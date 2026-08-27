-- SC Security Summit 2026
-- Optional partner discount codes on the ticket checkout.
--
-- Product change:
--   Convenio partners (universities, chambers, associations) hand out a code
--   that takes a percentage off the ticket. The code is optional: a buyer who
--   types nothing, or types something that is not a code, pays the published
--   price and is never blocked.
--
-- Design notes:
--   * The codes live here and only here. The browser never receives a list of
--     valid codes; it sends a string and is told whether it bought a discount.
--   * The discount is applied to the *unit* price, exactly like the volume
--     discount, so unit_price_cents * quantity stays the gross line total and
--     ticket_orders_amounts_check, the MercadoPago preference and the CFDI
--     base extraction all keep holding. What the order stores next to it is
--     the audit trail: which code, at what rate, off what list unit price, for
--     how many cents. subtotal_original is coupon_list_unit_price_cents *
--     quantity and total_after_discount is total_cents.
--   * create_ticket_order() re-checks the coupon inside the transaction that
--     writes the order — it exists, it is active, it is inside its window, it
--     has uses left — and reserves the use in public.coupon_uses. A coupon
--     that stopped applying between pricing and persistence answers
--     'coupon_unavailable' instead of storing an order at a price the coupon
--     no longer justifies.
--   * coupon_uses moves reserved -> used when the order is paid and
--     reserved -> released when it never will be, driven by a trigger on the
--     order status so the webhook, the return-page reconciliation and the
--     pending sweep all get it for free and all get it once.
--   * record_ticket_order_payment() now refuses to mark an order paid for an
--     amount that is not the stored total. That is the guard that makes the
--     discount safe end to end: whatever a browser does to the checkout, the
--     order is only ever paid for what the server priced.
--   * Every limit an administration screen will want (window, max uses, per
--     customer, minimum purchase, maximum discount, fixed amounts) is already
--     a column, so adding that screen needs no further migration. Only
--     `active`, the window, `max_uses` and the amounts are exercised today.
--   * The functions are replaced rather than overloaded: two candidates
--     sharing named arguments make the PostgREST call ambiguous.
--
-- Operational rollback:
--   Roll back the application and restore create_ticket_order and
--   record_ticket_order_payment from 20260826120000 / 20260824120000. Keep
--   these additive objects: coupon_uses and the coupon columns on
--   ticket_orders are the only record of which convenio produced which sale.

begin;

-- ---------------------------------------------------------------------------
-- Coupons
-- ---------------------------------------------------------------------------

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  discount_type text not null default 'percentage',
  discount_basis_points integer,
  discount_amount_cents integer,
  active boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  max_uses integer,
  max_uses_per_customer integer,
  minimum_purchase_cents integer,
  maximum_discount_cents integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coupons_code_key unique (code),
  constraint coupons_code_check
    check (
      code = pg_catalog.upper(pg_catalog.btrim(code))
      and code ~ '^[A-Z0-9][A-Z0-9._-]{1,39}$'
    ),
  constraint coupons_discount_type_check
    check (discount_type in ('percentage', 'fixed_amount')),
  -- Exactly one amount column is meaningful per type, so the other must be
  -- absent. A coupon can never be ambiguous about what it takes off.
  constraint coupons_discount_value_check
    check (
      (
        discount_type = 'percentage'
        and discount_basis_points between 1 and 10000
        and discount_amount_cents is null
      )
      or (
        discount_type = 'fixed_amount'
        and discount_amount_cents > 0
        and discount_basis_points is null
      )
    ),
  constraint coupons_window_check
    check (starts_at is null or expires_at is null or starts_at < expires_at),
  constraint coupons_limits_check
    check (
      (max_uses is null or max_uses > 0)
      and (max_uses_per_customer is null or max_uses_per_customer > 0)
      and (minimum_purchase_cents is null or minimum_purchase_cents > 0)
      and (maximum_discount_cents is null or maximum_discount_cents > 0)
    ),
  constraint coupons_notes_check
    check (notes is null or pg_catalog.char_length(notes) <= 500)
);

comment on table public.coupons is
  'Partner discount codes. Read only by the server; the browser never receives the list.';
comment on column public.coupons.code is
  'Normalized code: trimmed, whitespace removed, upper-cased. Lookups normalize the same way.';
comment on column public.coupons.discount_basis_points is
  'Percentage coupons only, in basis points (2000 = 20%).';
comment on column public.coupons.discount_amount_cents is
  'Fixed coupons only: cents off ONE access, so the line total stays an exact multiple of the unit price.';
comment on column public.coupons.maximum_discount_cents is
  'Ceiling on the discount of one order. Divided across the accesses and floored, for the same multiple-of-the-unit reason.';
comment on column public.coupons.max_uses_per_customer is
  'Reserved for a future administration screen; nothing enforces it yet. coupon_uses.customer_key is what it will count.';

create index coupons_active_idx on public.coupons (active) where active;

create trigger coupons_touch_updated_at
  before update on public.coupons
  for each row
  execute function public.touch_ticket_order_updated_at();

-- ---------------------------------------------------------------------------
-- Coupon uses
-- ---------------------------------------------------------------------------

create table public.coupon_uses (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null
    references public.coupons (id) on delete restrict,
  order_id uuid not null
    references public.ticket_orders (id) on delete cascade,
  customer_key text,
  status text not null default 'reserved',
  discount_cents integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- An order carries at most one code, so the order is the natural key of a
  -- use and a replayed submission can never reserve twice.
  constraint coupon_uses_order_id_key unique (order_id),
  constraint coupon_uses_status_check
    check (status in ('reserved', 'used', 'released')),
  constraint coupon_uses_discount_cents_check check (discount_cents >= 0),
  constraint coupon_uses_customer_key_check
    check (customer_key is null or customer_key ~ '^[0-9a-f]{64}$')
);

comment on table public.coupon_uses is
  'One row per order that used a code. reserved at checkout, used once paid, released when the order will never be paid.';
comment on column public.coupon_uses.customer_key is
  'SHA-256 of the buyer email. A pseudonym for counting per-customer uses; never an address, never reversible to one here.';

create index coupon_uses_coupon_id_idx
  on public.coupon_uses (coupon_id, status);
create index coupon_uses_customer_key_idx
  on public.coupon_uses (coupon_id, customer_key)
  where customer_key is not null;

create trigger coupon_uses_touch_updated_at
  before update on public.coupon_uses
  for each row
  execute function public.touch_ticket_order_updated_at();

-- ---------------------------------------------------------------------------
-- What the order remembers about the code it used
-- ---------------------------------------------------------------------------

alter table public.ticket_orders
  -- restrict, not set null: the amount columns next to it are only valid with
  -- the coupon id present, and a coupon that produced sales is never deleted.
  add column coupon_id uuid references public.coupons (id) on delete restrict,
  add column coupon_code text,
  add column coupon_discount_type text,
  add column coupon_discount_basis_points integer,
  add column coupon_list_unit_price_cents integer,
  add column coupon_discount_cents integer;

alter table public.ticket_orders
  add constraint ticket_orders_coupon_check
  check (
    (
      coupon_id is null
      and coupon_code is null
      and coupon_discount_type is null
      and coupon_discount_basis_points is null
      and coupon_list_unit_price_cents is null
      and coupon_discount_cents is null
    )
    or (
      coupon_id is not null
      and coupon_code is not null
      and coupon_code = pg_catalog.upper(pg_catalog.btrim(coupon_code))
      and pg_catalog.char_length(coupon_code) between 2 and 40
      and coupon_discount_type in ('percentage', 'fixed_amount')
      and coupon_discount_basis_points between 0 and 10000
      -- The charged unit is the list unit minus the coupon, and the stored
      -- discount is that difference across the whole line. The amounts can
      -- never claim a discount the charged total does not reflect.
      and coupon_list_unit_price_cents > unit_price_cents
      and coupon_discount_cents
          = (coupon_list_unit_price_cents - unit_price_cents) * quantity
    )
  );

comment on column public.ticket_orders.coupon_code is
  'Code as applied. Kept next to the amounts so a convenio can be reported on without joining a coupon that may later change.';
comment on column public.ticket_orders.coupon_list_unit_price_cents is
  'Gross unit price before the code. Times quantity it is the pre-discount line total; total_cents is the post-discount one.';

create index ticket_orders_coupon_code_idx
  on public.ticket_orders (coupon_code)
  where coupon_code is not null;

-- ---------------------------------------------------------------------------
-- Event metadata allowlist: a coupon code identifies an agreement, not a buyer
-- ---------------------------------------------------------------------------

create or replace function public.is_safe_ticket_order_event_metadata(
  p_metadata jsonb
)
returns boolean
language plpgsql
immutable
strict
security invoker
set search_path = ''
as $function$
declare
  v_key text;
  v_value jsonb;
  v_text text;
begin
  if pg_catalog.jsonb_typeof(p_metadata) <> 'object'
     or pg_catalog.octet_length(
       pg_catalog.convert_to(p_metadata::text, 'UTF8')
     ) > 2048 then
    return false;
  end if;

  for v_key, v_value in
    select entry.key, entry.value
    from pg_catalog.jsonb_each(p_metadata) as entry
  loop
    if v_key not in (
      'order_status',
      'previous_status',
      'tier',
      'quantity',
      'language',
      'requires_invoice',
      'provider',
      'provider_status',
      'error_code',
      'source',
      'reason',
      'coupon_code'
    ) then
      return false;
    end if;

    v_text := v_value #>> '{}';

    if v_key = 'quantity' then
      if pg_catalog.jsonb_typeof(v_value) <> 'number'
         or v_text !~ '^[0-9]{1,3}$' then
        return false;
      end if;
    elsif v_key = 'requires_invoice' then
      if pg_catalog.jsonb_typeof(v_value) <> 'boolean' then
        return false;
      end if;
    elsif v_key in ('order_status', 'previous_status') then
      if pg_catalog.jsonb_typeof(v_value) <> 'string'
         or v_text not in (
           'pending',
           'in_process',
           'paid',
           'rejected',
           'cancelled',
           'refunded',
           'charged_back'
         ) then
        return false;
      end if;
    elsif v_key = 'tier' then
      if pg_catalog.jsonb_typeof(v_value) <> 'string'
         or v_text not in ('plus', 'general', 'estudiante', 'corporativo') then
        return false;
      end if;
    elsif v_key = 'language' then
      if pg_catalog.jsonb_typeof(v_value) <> 'string'
         or v_text not in ('es', 'en') then
        return false;
      end if;
    elsif v_key = 'coupon_code' then
      if pg_catalog.jsonb_typeof(v_value) <> 'string'
         or v_text !~ '^[A-Z0-9][A-Z0-9._-]{1,39}$' then
        return false;
      end if;
    else
      if pg_catalog.jsonb_typeof(v_value) <> 'string'
         or v_text !~ '^[A-Za-z0-9_.:-]{1,128}$' then
        return false;
      end if;
    end if;
  end loop;

  return true;
end;
$function$;

alter table public.ticket_order_events
  drop constraint ticket_order_events_type_check;

alter table public.ticket_order_events
  add constraint ticket_order_events_type_check
  check (
    event_type in (
      'order_created',
      'order_replayed',
      'order_conflict',
      'preference_created',
      'payment_status_changed',
      'payment_duplicate_ignored',
      'payment_amount_mismatch',
      'coupon_applied',
      'invoice_requested',
      'invoice_issued'
    )
  );

-- ---------------------------------------------------------------------------
-- Coupon use lifecycle follows the order status
-- ---------------------------------------------------------------------------

create or replace function public.sync_coupon_use_status()
returns trigger
language plpgsql
volatile
security invoker
set search_path = ''
as $function$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status = 'paid' then
    update public.coupon_uses as u
    set status = 'used'
    where u.order_id = new.id
      and u.status <> 'used';
  elsif new.status in ('rejected', 'cancelled') then
    -- The order never became a sale, so the reservation goes back to the pool.
    -- A use already confirmed is left alone: only a refund undoes a sale.
    update public.coupon_uses as u
    set status = 'released'
    where u.order_id = new.id
      and u.status = 'reserved';
  elsif new.status in ('refunded', 'charged_back') then
    update public.coupon_uses as u
    set status = 'released'
    where u.order_id = new.id
      and u.status <> 'released';
  end if;

  return new;
end;
$function$;

create trigger ticket_orders_sync_coupon_uses
  after update on public.ticket_orders
  for each row
  execute function public.sync_coupon_use_status();

-- ---------------------------------------------------------------------------
-- create_ticket_order: the coupon joins the contract
-- ---------------------------------------------------------------------------

drop function public.create_ticket_order(
  uuid, text, text, smallint, integer, integer, integer, integer, text,
  text, text, text, text, timestamptz, date, boolean, text, text, text[],
  text, text, text, text, text, text, text, text, text, text, text, text,
  text, text, timestamptz, timestamptz
);

create or replace function public.create_ticket_order(
  p_submission_id uuid,
  p_payload_hash text,
  p_tier text,
  p_quantity smallint,
  p_unit_price_cents integer,
  p_subtotal_cents integer,
  p_tax_rate_basis_points integer,
  p_tax_cents integer,
  p_buyer_name text,
  p_email text,
  p_phone text,
  p_language text,
  p_consent_version text,
  p_consented_at timestamptz,
  p_retention_until date,
  p_requires_invoice boolean default false,
  p_company text default null,
  p_referral_source text default null,
  p_attendees text[] default null,
  p_coupon_id uuid default null,
  p_coupon_code text default null,
  p_coupon_discount_type text default null,
  p_coupon_discount_basis_points integer default null,
  p_coupon_list_unit_price_cents integer default null,
  p_coupon_discount_cents integer default null,
  p_rfc text default null,
  p_person_type text default null,
  p_legal_name text default null,
  p_tax_regime text default null,
  p_cfdi_use text default null,
  p_postal_code text default null,
  p_billing_email text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_utm_term text default null,
  p_utm_content text default null,
  p_landing_page text default null,
  p_referrer text default null,
  p_first_touch_at timestamptz default null,
  p_last_touch_at timestamptz default null
)
returns table (
  order_id uuid,
  outcome text,
  total_cents integer
)
language plpgsql
volatile
security invoker
set search_path = ''
as $function$
declare
  v_order_id uuid;
  v_existing_hash bytea;
  v_hash bytea;
  v_total integer;
  v_remaining integer;
  v_gross bigint;
  v_base bigint;
  v_coupon public.coupons%rowtype;
  v_coupon_code text;
  v_coupon_uses integer;
begin
  if p_payload_hash is null
     or p_payload_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_payload_hash'
      using errcode = '22023';
  end if;

  -- The caller prices the order from the server-side catalog, but the amounts
  -- are re-checked here so no future caller can persist an inconsistent total.
  -- The published price is IVA-inclusive, so the line total is the gross
  -- amount and the base plus the tax must add up to exactly that. A discounted
  -- unit price — volume, coupon or both — keeps the same identity.
  v_gross := p_unit_price_cents::bigint * p_quantity;

  if (p_subtotal_cents::bigint + p_tax_cents) is distinct from v_gross then
    raise exception 'invalid_subtotal'
      using errcode = '22023';
  end if;

  -- Half-up extraction of the taxable base out of the gross line, mirroring
  -- extractTaxFromGross() in lib/payments/tax.ts. Doubling both sides keeps
  -- the .5 case exact for an odd divisor too, which `divisor / 2` would not.
  v_base := (
    (v_gross * 20000 + (10000 + p_tax_rate_basis_points))
    / (2 * (10000 + p_tax_rate_basis_points))
  );

  if p_subtotal_cents is distinct from v_base::integer then
    raise exception 'invalid_tax_amount'
      using errcode = '22023';
  end if;

  -- A block names every person who will attend, one per purchased access, and
  -- an individual order has no roster at all.
  if p_tier = 'corporativo' then
    if p_attendees is null
       or pg_catalog.array_length(p_attendees, 1)
          is distinct from p_quantity::integer then
      raise exception 'attendees_required'
        using errcode = '22023';
    end if;
  elsif p_attendees is not null then
    raise exception 'attendees_not_expected'
      using errcode = '22023';
  end if;

  -- A discount is stored as what it did to the price, and what it did must
  -- agree with what is being charged. This is structural, not commercial: the
  -- rate itself comes from the catalog, exactly like the list price does.
  if p_coupon_id is not null then
    v_coupon_code := pg_catalog.upper(pg_catalog.btrim(p_coupon_code));

    if v_coupon_code is null
       or p_coupon_discount_type is null
       or p_coupon_discount_basis_points is null
       or p_coupon_list_unit_price_cents is null
       or p_coupon_discount_cents is null then
      raise exception 'invalid_coupon_payload'
        using errcode = '22023';
    end if;

    if p_coupon_list_unit_price_cents <= p_unit_price_cents
       or p_coupon_discount_cents is distinct from
          (p_coupon_list_unit_price_cents - p_unit_price_cents) * p_quantity then
      raise exception 'invalid_coupon_amount'
        using errcode = '22023';
    end if;
  elsif p_coupon_code is not null
        or p_coupon_discount_type is not null
        or p_coupon_discount_basis_points is not null
        or p_coupon_discount_cents is not null
        or p_coupon_list_unit_price_cents is not null then
    raise exception 'invalid_coupon_payload'
      using errcode = '22023';
  end if;

  if p_requires_invoice and (
       p_rfc is null
       or p_legal_name is null
       or p_tax_regime is null
       or p_cfdi_use is null
       or p_postal_code is null
       or p_person_type is null
     ) then
    raise exception 'invoice_details_required'
      using errcode = '22023';
  end if;

  if not p_requires_invoice and p_rfc is not null then
    raise exception 'invoice_details_not_requested'
      using errcode = '22023';
  end if;

  v_hash := pg_catalog.decode(p_payload_hash, 'hex');

  -- A replay must be answered before the capacity check, otherwise a sold-out
  -- event would start rejecting buyers who already hold a valid order. It is
  -- answered before the coupon is reserved for the same reason: the original
  -- order already holds its reservation.
  select o.id, o.payload_hash, o.total_cents
  into v_order_id, v_existing_hash, v_total
  from public.ticket_orders as o
  where o.submission_id = p_submission_id;

  if found then
    if v_existing_hash is distinct from v_hash then
      insert into public.ticket_order_events (order_id, event_type, metadata)
      values (
        v_order_id,
        'order_conflict',
        pg_catalog.jsonb_build_object('reason', 'idempotency_conflict')
      );

      return query
      select v_order_id, 'conflict'::text, null::integer;
      return;
    end if;

    insert into public.ticket_order_events (order_id, event_type, metadata)
    values (
      v_order_id,
      'order_replayed',
      pg_catalog.jsonb_build_object('tier', p_tier, 'language', p_language)
    );

    return query
    select v_order_id, 'replayed'::text, v_total;
    return;
  end if;

  -- Serialize order creation so two concurrent buyers cannot both pass a
  -- capacity check that only one of them fits into. The lock is released at
  -- transaction end and the contention window is a single insert. The coupon's
  -- use limit is counted under the same lock, for the same reason.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('public.ticket_capacity')
  );

  if p_coupon_id is not null then
    select * into v_coupon
    from public.coupons as c
    where c.id = p_coupon_id
      and c.code = v_coupon_code;

    -- The coupon was read, priced and is now being spent. Anything that
    -- changed in between — deactivated, expired, exhausted, renamed — means
    -- the price the caller computed is no longer one this coupon justifies,
    -- so no order is stored at it.
    if not found
       or not v_coupon.active
       or (v_coupon.starts_at is not null
           and pg_catalog.now() < v_coupon.starts_at)
       or (v_coupon.expires_at is not null
           and pg_catalog.now() >= v_coupon.expires_at) then
      return query
      select null::uuid, 'coupon_unavailable'::text, null::integer;
      return;
    end if;

    if v_coupon.max_uses is not null then
      select pg_catalog.count(*)::integer
      into v_coupon_uses
      from public.coupon_uses as u
      where u.coupon_id = p_coupon_id
        and u.status in ('reserved', 'used');

      if v_coupon_uses >= v_coupon.max_uses then
        return query
        select null::uuid, 'coupon_unavailable'::text, null::integer;
        return;
      end if;
    end if;
  end if;

  v_remaining := public.remaining_ticket_seats(p_tier);
  if v_remaining is not null and v_remaining < p_quantity then
    return query
    select null::uuid, 'sold_out'::text, null::integer;
    return;
  end if;

  v_remaining := public.remaining_ticket_seats('total');
  if v_remaining is not null and v_remaining < p_quantity then
    return query
    select null::uuid, 'sold_out'::text, null::integer;
    return;
  end if;

  insert into public.ticket_orders (
    submission_id,
    payload_hash,
    tier,
    quantity,
    unit_price_cents,
    subtotal_cents,
    tax_rate_basis_points,
    tax_cents,
    buyer_name,
    email,
    phone,
    company,
    referral_source,
    coupon_id,
    coupon_code,
    coupon_discount_type,
    coupon_discount_basis_points,
    coupon_list_unit_price_cents,
    coupon_discount_cents,
    language,
    consent_version,
    consented_at,
    requires_invoice,
    invoice_status,
    retention_until,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content,
    landing_page,
    referrer,
    first_touch_at,
    last_touch_at
  )
  values (
    p_submission_id,
    v_hash,
    p_tier,
    p_quantity,
    p_unit_price_cents,
    p_subtotal_cents,
    p_tax_rate_basis_points,
    p_tax_cents,
    pg_catalog.btrim(p_buyer_name),
    pg_catalog.lower(pg_catalog.btrim(p_email)),
    pg_catalog.btrim(p_phone),
    nullif(pg_catalog.btrim(p_company), ''),
    nullif(pg_catalog.btrim(p_referral_source), ''),
    p_coupon_id,
    v_coupon_code,
    p_coupon_discount_type,
    p_coupon_discount_basis_points,
    p_coupon_list_unit_price_cents,
    p_coupon_discount_cents,
    p_language,
    pg_catalog.btrim(p_consent_version),
    p_consented_at,
    p_requires_invoice,
    case when p_requires_invoice then 'requested' else 'not_requested' end,
    p_retention_until,
    nullif(pg_catalog.btrim(p_utm_source), ''),
    nullif(pg_catalog.btrim(p_utm_medium), ''),
    nullif(pg_catalog.btrim(p_utm_campaign), ''),
    nullif(pg_catalog.btrim(p_utm_term), ''),
    nullif(pg_catalog.btrim(p_utm_content), ''),
    nullif(pg_catalog.btrim(p_landing_page), ''),
    nullif(pg_catalog.btrim(p_referrer), ''),
    p_first_touch_at,
    p_last_touch_at
  )
  returning id into v_order_id;

  -- Only a first submission writes the roster. A replay already has it, and a
  -- payload whose roster changed is a conflict, never an overwrite.
  if p_attendees is not null then
    insert into public.ticket_order_attendees (order_id, seat_number, full_name)
    select
      v_order_id,
      entry.ordinality::smallint,
      pg_catalog.btrim(entry.full_name)
    from pg_catalog.unnest(p_attendees)
      with ordinality as entry(full_name, ordinality);
  end if;

  if p_coupon_id is not null then
    insert into public.coupon_uses (
      coupon_id, order_id, customer_key, status, discount_cents
    )
    values (
      p_coupon_id,
      v_order_id,
      -- A pseudonym, so per-customer limits can be counted later without this
      -- table ever holding an address.
      pg_catalog.encode(
        pg_catalog.sha256(
          pg_catalog.convert_to(
            pg_catalog.lower(pg_catalog.btrim(p_email)), 'UTF8'
          )
        ),
        'hex'
      ),
      'reserved',
      p_coupon_discount_cents
    );

    insert into public.ticket_order_events (order_id, event_type, metadata)
    values (
      v_order_id,
      'coupon_applied',
      pg_catalog.jsonb_build_object('coupon_code', v_coupon_code)
    );
  end if;

  if p_requires_invoice then
    insert into public.ticket_order_invoice_details (
      order_id,
      rfc,
      person_type,
      legal_name,
      tax_regime,
      cfdi_use,
      postal_code,
      billing_email
    )
    values (
      v_order_id,
      pg_catalog.upper(pg_catalog.btrim(p_rfc)),
      p_person_type,
      pg_catalog.btrim(p_legal_name),
      pg_catalog.btrim(p_tax_regime),
      pg_catalog.upper(pg_catalog.btrim(p_cfdi_use)),
      pg_catalog.btrim(p_postal_code),
      nullif(pg_catalog.lower(pg_catalog.btrim(p_billing_email)), '')
    );

    insert into public.ticket_order_events (order_id, event_type, metadata)
    values (
      v_order_id,
      'invoice_requested',
      pg_catalog.jsonb_build_object('requires_invoice', true)
    );
  end if;

  insert into public.ticket_order_events (order_id, event_type, metadata)
  values (
    v_order_id,
    'order_created',
    pg_catalog.jsonb_build_object(
      'tier', p_tier,
      'quantity', p_quantity,
      'language', p_language,
      'requires_invoice', p_requires_invoice,
      'order_status', 'pending'
    )
  );

  select o.total_cents into v_total
  from public.ticket_orders as o
  where o.id = v_order_id;

  return query
  select v_order_id, 'created'::text, v_total;
end;
$function$;

-- ---------------------------------------------------------------------------
-- record_ticket_order_payment: an order is paid only for its own total
-- ---------------------------------------------------------------------------

drop function public.record_ticket_order_payment(
  uuid, text, text, text, text, timestamptz
);

create or replace function public.record_ticket_order_payment(
  p_order_id uuid,
  p_payment_id text,
  p_status text,
  p_provider_status text default null,
  p_provider_status_detail text default null,
  p_paid_at timestamptz default null,
  p_paid_amount_cents integer default null
)
returns table (
  order_id uuid,
  order_status text,
  outcome text
)
language plpgsql
volatile
security invoker
set search_path = ''
as $function$
declare
  v_previous_status text;
  v_previous_payment text;
  v_total integer;
  v_next_status text;
begin
  if p_payment_id is null
     or p_payment_id !~ '^[A-Za-z0-9_.:-]{1,128}$' then
    raise exception 'invalid_payment_id'
      using errcode = '22023';
  end if;

  if p_status not in (
    'pending',
    'in_process',
    'paid',
    'rejected',
    'cancelled',
    'refunded',
    'charged_back'
  ) then
    raise exception 'invalid_order_status'
      using errcode = '22023';
  end if;

  -- Lock the row so two concurrent webhook deliveries for the same order
  -- cannot both observe the pre-update status and both append an event.
  select o.status, o.provider_payment_id, o.total_cents
  into v_previous_status, v_previous_payment, v_total
  from public.ticket_orders as o
  where o.id = p_order_id
  for update;

  if v_previous_status is null then
    raise exception 'ticket_order_not_found'
      using errcode = 'P0002';
  end if;

  -- The seller's own number decides what "paid" means. A settlement for
  -- anything other than the stored total is recorded and refused rather than
  -- turned into a ticket: it is either a preference that was tampered with in
  -- flight or a partial capture, and neither is a sold access. Operations sees
  -- the event in the order's history and resolves it by hand.
  if p_status = 'paid'
     and p_paid_amount_cents is not null
     and p_paid_amount_cents is distinct from v_total then
    insert into public.ticket_order_events (order_id, event_type, metadata)
    values (
      p_order_id,
      'payment_amount_mismatch',
      pg_catalog.jsonb_build_object(
        'order_status', v_previous_status,
        'provider_status', coalesce(p_provider_status, 'unknown'),
        'reason', 'amount_mismatch'
      )
    );

    return query select p_order_id, v_previous_status, 'ignored'::text;
    return;
  end if;

  -- A paid order never regresses to pending on a late duplicate delivery.
  if v_previous_status = 'paid' and p_status in ('pending', 'in_process') then
    insert into public.ticket_order_events (order_id, event_type, metadata)
    values (
      p_order_id,
      'payment_duplicate_ignored',
      pg_catalog.jsonb_build_object(
        'order_status', v_previous_status,
        'provider_status', coalesce(p_provider_status, 'unknown')
      )
    );

    return query select p_order_id, v_previous_status, 'ignored'::text;
    return;
  end if;

  if v_previous_status = p_status
     and v_previous_payment is not distinct from p_payment_id then
    insert into public.ticket_order_events (order_id, event_type, metadata)
    values (
      p_order_id,
      'payment_duplicate_ignored',
      pg_catalog.jsonb_build_object('order_status', v_previous_status)
    );

    return query select p_order_id, v_previous_status, 'duplicate'::text;
    return;
  end if;

  update public.ticket_orders as o
  set status = p_status,
      provider_payment_id = p_payment_id,
      provider_status = nullif(pg_catalog.btrim(p_provider_status), ''),
      provider_status_detail =
        nullif(pg_catalog.btrim(p_provider_status_detail), ''),
      paid_at = case
        when p_status = 'paid' then
          coalesce(o.paid_at, p_paid_at, pg_catalog.now())
        else o.paid_at
      end
  where o.id = p_order_id
  returning o.status into v_next_status;

  insert into public.ticket_order_events (order_id, event_type, metadata)
  values (
    p_order_id,
    'payment_status_changed',
    pg_catalog.jsonb_build_object(
      'previous_status', v_previous_status,
      'order_status', v_next_status,
      'provider', 'mercadopago'
    )
  );

  return query select p_order_id, v_next_status, 'updated'::text;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Row level security and grants
-- ---------------------------------------------------------------------------

alter table public.coupons enable row level security;
alter table public.coupon_uses enable row level security;

-- No policy on purpose, exactly like the ticket tables: every read and write
-- goes through the server-side secret key, and anon/authenticated keep zero
-- access even if a browser-facing key is ever leaked. A leaked anon key must
-- not become a list of valid discount codes.
revoke all on table public.coupons from public, anon, authenticated, service_role;
revoke all on table public.coupon_uses
  from public, anon, authenticated, service_role;

-- Read only: codes are created and retired in Studio, never by the site.
grant select on table public.coupons to service_role;
grant select, insert, update on table public.coupon_uses to service_role;

revoke all on function public.sync_coupon_use_status()
  from public, anon, authenticated;

revoke all on function public.create_ticket_order(
  uuid, text, text, smallint, integer, integer, integer, integer, text,
  text, text, text, text, timestamptz, date, boolean, text, text, text[],
  uuid, text, text, integer, integer, integer,
  text, text, text, text, text, text, text, text, text, text, text, text,
  text, text, timestamptz, timestamptz
) from public, anon, authenticated;

grant execute on function public.create_ticket_order(
  uuid, text, text, smallint, integer, integer, integer, integer, text,
  text, text, text, text, timestamptz, date, boolean, text, text, text[],
  uuid, text, text, integer, integer, integer,
  text, text, text, text, text, text, text, text, text, text, text, text,
  text, text, timestamptz, timestamptz
) to service_role;

revoke all on function public.record_ticket_order_payment(
  uuid, text, text, text, text, timestamptz, integer
) from public, anon, authenticated;

grant execute on function public.record_ticket_order_payment(
  uuid, text, text, text, text, timestamptz, integer
) to service_role;

-- ---------------------------------------------------------------------------
-- The convenios in force at the cut
-- ---------------------------------------------------------------------------

insert into public.coupons (code, discount_type, discount_basis_points, active, notes)
values
  ('UVB2026', 'percentage', 2000, true, 'Convenio UVB'),
  ('IIIES2026', 'percentage', 2000, true, 'Convenio IIIES'),
  ('PVILLAFLORIDA2026', 'percentage', 2000, true, 'Convenio Parque Villa Florida'),
  ('CANACAR2026', 'percentage', 2000, true, 'Convenio CANACAR')
on conflict on constraint coupons_code_key do nothing;

commit;
