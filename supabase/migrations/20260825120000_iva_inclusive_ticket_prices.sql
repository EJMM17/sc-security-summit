-- SC Security Summit 2026
-- Published prices become IVA-inclusive.
--
-- Product change:
--   The site used to publish the taxable base and add 16% at checkout. The
--   published price is now the whole amount the buyer pays: the IVA lives
--   inside it and the seller absorbs it. Nothing about how the money is
--   stored changes — subtotal_cents is still the base and tax_cents is still
--   the IVA — but the invariant that ties them to the unit price flips from
--   "base = unit x quantity" to "base + tax = unit x quantity".
--
-- Design notes:
--   * unit_price_cents now holds the IVA-inclusive published price.
--   * The base is extracted from the gross line once, half up, and the tax is
--     the remainder, so base + tax is exactly the amount MercadoPago captures
--     and the CFDI can never be a cent away from the settlement.
--   * Orders captured before this migration were priced IVA-exclusive. Their
--     money does not change: the backfill below only restates unit_price_cents
--     as the gross unit that was already charged, leaving base, tax and total
--     untouched. It refuses to guess when the gross does not divide evenly.
--
-- Operational rollback:
--   Restore the previous constraint and function bodies from
--   20260824120000 / 20260824130000 and republish the IVA-exclusive prices in
--   lib/content.ts. Orders keep their amounts either way.

begin;

-- ---------------------------------------------------------------------------
-- Amount invariants
-- ---------------------------------------------------------------------------

alter table public.ticket_orders
  drop constraint ticket_orders_amounts_check;

-- Restate legacy IVA-exclusive rows in gross terms. total_cents is generated
-- from subtotal + tax and is deliberately not touched.
do $migration$
declare
  v_undividable integer;
begin
  update public.ticket_orders
  set unit_price_cents = (subtotal_cents + tax_cents) / quantity
  where subtotal_cents = unit_price_cents * quantity
    and tax_cents > 0
    and (subtotal_cents + tax_cents) % quantity = 0;

  select pg_catalog.count(*)
  into v_undividable
  from public.ticket_orders
  where subtotal_cents + tax_cents <> unit_price_cents * quantity;

  if v_undividable > 0 then
    raise exception
      'cannot restate % ticket order(s) as IVA-inclusive; reprice them by hand first',
      v_undividable
      using errcode = '22023';
  end if;
end;
$migration$;

alter table public.ticket_orders
  add constraint ticket_orders_amounts_check
  check (
    unit_price_cents > 0
    and subtotal_cents > 0
    and tax_cents >= 0
    and subtotal_cents + tax_cents = unit_price_cents * quantity
    and tax_rate_basis_points between 0 and 10000
  );

comment on table public.ticket_orders is
  'Ticket orders paid through MercadoPago. Amounts are integer cents; published prices are IVA-inclusive.';
comment on column public.ticket_orders.unit_price_cents is
  'IVA-inclusive published price of one access. unit_price_cents * quantity is the gross line total.';
comment on column public.ticket_orders.subtotal_cents is
  'IVA-exclusive taxable base extracted from the gross line. total_cents is generated as subtotal + tax.';

-- ---------------------------------------------------------------------------
-- create_ticket_order: same signature, IVA-inclusive amount checks
-- ---------------------------------------------------------------------------

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
  -- amount and the base plus the tax must add up to exactly that.
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

commit;
