-- SC Security Summit 2026
-- Corporate blocks become paid orders, and every order can name a referrer.
--
-- Product change:
--   A corporate pass used to be a lead: the buyer asked for a quote and the
--   team charged the block outside the site. It is now sold on site through
--   MercadoPago exactly like an individual access, so a block lands in
--   public.ticket_orders under its own tier, with the roster of named
--   participants attached to the order instead of to an inquiry.
--   Independently, both flows now capture an optional referrer.
--
-- Design notes:
--   * 'corporativo' is an order tier, not a published one: it has no fixed
--     unit price. The caller prices the block from the server-side catalog
--     (25% off from the fifth access up, applied to the unit so the line stays
--     an exact multiple) and the existing amount invariants still hold.
--   * The seat ceiling on an order rises to 200 — the same technical guard the
--     inquiry roster already used, not a commercial ceiling.
--   * The roster lives in its own table, keyed by seat number, so it is
--     ordered, cannot exceed the paid accesses and cascades with the order's
--     five-year fiscal retention. It carries names only: a participant's name
--     is the minimum the DC-3 certificate needs.
--   * referral_source is free text supplied by the buyer. It is never an
--     identifier the site acts on, so it is stored as typed and, like every
--     other buyer-supplied string, is kept out of events and logs.
--   * create_ticket_order() is replaced rather than overloaded: two candidates
--     sharing named arguments make the PostgREST call ambiguous.
--
-- Operational rollback:
--   Roll back the application and restore create_ticket_order from
--   20260825120000. Keep these additive objects: rosters and referrers
--   captured during the deployment window are the only copy of that data.

begin;

-- ---------------------------------------------------------------------------
-- Order shape
-- ---------------------------------------------------------------------------

alter table public.ticket_orders
  drop constraint ticket_orders_tier_check;

alter table public.ticket_orders
  add constraint ticket_orders_tier_check
  check (tier in ('plus', 'general', 'estudiante', 'corporativo'));

alter table public.ticket_orders
  drop constraint ticket_orders_quantity_check;

alter table public.ticket_orders
  add constraint ticket_orders_quantity_check
  check (
    quantity between 1 and 200
    and (tier <> 'corporativo' or quantity >= 2)
    and (tier = 'corporativo' or quantity <= 10)
  );

alter table public.ticket_orders
  add column referral_source text;

alter table public.ticket_orders
  add constraint ticket_orders_referral_source_check
  check (
    referral_source is null
    or (
      referral_source = pg_catalog.btrim(referral_source)
      and pg_catalog.char_length(referral_source) between 2 and 160
    )
  );

comment on column public.ticket_orders.referral_source is
  'Optional, buyer-supplied answer to "who referred you". Free text; never an identifier the site acts on.';
comment on column public.ticket_orders.tier is
  'Published access tier, or ''corporativo'' for a block priced with the volume discount.';

alter table public.ticket_capacity
  drop constraint ticket_capacity_scope_check;

alter table public.ticket_capacity
  add constraint ticket_capacity_scope_check
  check (scope in ('total', 'plus', 'general', 'estudiante', 'corporativo'));

-- ---------------------------------------------------------------------------
-- Roster
-- ---------------------------------------------------------------------------

create table public.ticket_order_attendees (
  order_id uuid not null
    references public.ticket_orders (id) on delete cascade,
  seat_number smallint not null,
  full_name text not null,
  created_at timestamptz not null default now(),
  constraint ticket_order_attendees_pkey primary key (order_id, seat_number),
  constraint ticket_order_attendees_seat_number_check
    check (seat_number between 1 and 200),
  constraint ticket_order_attendees_full_name_check
    check (
      full_name = pg_catalog.btrim(full_name)
      and pg_catalog.char_length(full_name) between 3 and 160
    )
);

comment on table public.ticket_order_attendees is
  'People named in a paid corporate block, one row per purchased access. Deleted with the order it belongs to.';
comment on column public.ticket_order_attendees.seat_number is
  'Position in the roster, 1..quantity. Ordering is the buyer''s own.';

alter table public.ticket_order_attendees enable row level security;

revoke all on table public.ticket_order_attendees
  from public, anon, authenticated, service_role;
grant select, insert on table public.ticket_order_attendees to service_role;

-- ---------------------------------------------------------------------------
-- Event metadata allowlist
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
      'reason'
    ) then
      return false;
    end if;

    v_text := v_value #>> '{}';

    if v_key = 'quantity' then
      -- A corporate block can be three digits; the buyer's own numbers never
      -- reach this allowlist as anything but a seat count.
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

-- ---------------------------------------------------------------------------
-- create_ticket_order: the roster and the referrer join the contract
-- ---------------------------------------------------------------------------

drop function public.create_ticket_order(
  uuid, text, text, smallint, integer, integer, integer, integer, text,
  text, text, text, text, timestamptz, date, boolean, text, text, text,
  text, text, text, text, text, text, text, text, text, text, text, text,
  timestamptz, timestamptz
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
begin
  if p_payload_hash is null
     or p_payload_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_payload_hash'
      using errcode = '22023';
  end if;

  -- The caller prices the order from the server-side catalog, but the amounts
  -- are re-checked here so no future caller can persist an inconsistent total.
  -- The published price is IVA-inclusive, so the line total is the gross
  -- amount and the base plus the tax must add up to exactly that. A corporate
  -- block carries its discounted unit price, so the same identity holds.
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
  -- event would start rejecting buyers who already hold a valid order.
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
  -- transaction end and the contention window is a single insert.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('public.ticket_capacity')
  );

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

revoke all on function public.create_ticket_order(
  uuid, text, text, smallint, integer, integer, integer, integer, text,
  text, text, text, text, timestamptz, date, boolean, text, text, text[],
  text, text, text, text, text, text, text, text, text, text, text, text,
  text, text, timestamptz, timestamptz
) from public, anon, authenticated;

grant execute on function public.create_ticket_order(
  uuid, text, text, smallint, integer, integer, integer, integer, text,
  text, text, text, text, timestamptz, date, boolean, text, text, text[],
  text, text, text, text, text, text, text, text, text, text, text, text,
  text, text, timestamptz, timestamptz
) to service_role;

commit;
