-- SC Security Summit 2026
-- Add MercadoPago ticket orders with an IVA breakdown and optional CFDI data.
--
-- Product change:
--   Until this migration Eventbrite owned every individual ticket. The site
--   now sells the three published accesses directly, prices them server side
--   and captures fiscal data for the buyers who request a CFDI.
--
-- Design notes:
--   * Money is stored as integer cents. Published prices are IVA-exclusive, so
--     subtotal_cents is the taxable base and total_cents is what MercadoPago
--     captures. A generated column keeps the three amounts consistent.
--   * Fiscal data lives in its own table. An order without an invoice request
--     stores no tax identifiers whatsoever.
--   * create_ticket_order() replays a submission with an identical payload
--     hash and refuses a submission whose payload changed, exactly like
--     create_inquiry().
--   * record_ticket_order_payment() is idempotent because Vercel and
--     MercadoPago both deliver webhooks more than once.
--
-- Operational rollback:
--   Roll back the application and remove the MercadoPago webhook in the
--   provider panel. Keep these additive tables so orders captured during the
--   deployment window are not lost. Correct defects with a new migration;
--   never edit this migration after deployment.

begin;

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
      if pg_catalog.jsonb_typeof(v_value) <> 'number'
         or v_text !~ '^[0-9]{1,2}$' then
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
         or v_text not in ('plus', 'general', 'estudiante') then
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

create table public.ticket_orders (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null,
  payload_hash bytea not null,
  status text not null default 'pending',
  tier text not null,
  quantity smallint not null,
  currency text not null default 'MXN',
  unit_price_cents integer not null,
  subtotal_cents integer not null,
  tax_rate_basis_points integer not null default 1600,
  tax_cents integer not null,
  total_cents integer generated always as (subtotal_cents + tax_cents) stored,
  buyer_name text not null,
  email text not null,
  phone text not null,
  company text,
  language text not null,
  consent_version text not null,
  consented_at timestamptz not null,
  requires_invoice boolean not null default false,
  provider text not null default 'mercadopago',
  provider_preference_id text,
  provider_payment_id text,
  provider_status text,
  provider_status_detail text,
  paid_at timestamptz,
  owner text,
  internal_notes text,
  invoice_status text not null default 'not_requested',
  invoiced_at timestamptz,
  cfdi_uuid text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  landing_page text,
  referrer text,
  first_touch_at timestamptz,
  last_touch_at timestamptz,
  retention_until date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ticket_orders_submission_id_key unique (submission_id),
  constraint ticket_orders_provider_payment_id_key
    unique (provider, provider_payment_id),
  constraint ticket_orders_payload_hash_length_check
    check (pg_catalog.octet_length(payload_hash) = 32),
  constraint ticket_orders_status_check
    check (
      status in (
        'pending',
        'in_process',
        'paid',
        'rejected',
        'cancelled',
        'refunded',
        'charged_back'
      )
    ),
  constraint ticket_orders_tier_check
    check (tier in ('plus', 'general', 'estudiante')),
  constraint ticket_orders_quantity_check
    check (quantity between 1 and 10),
  constraint ticket_orders_currency_check
    check (currency = 'MXN'),
  constraint ticket_orders_provider_check
    check (provider = 'mercadopago'),
  constraint ticket_orders_language_check
    check (language in ('es', 'en')),
  constraint ticket_orders_amounts_check
    check (
      unit_price_cents > 0
      and subtotal_cents = unit_price_cents * quantity
      and tax_cents >= 0
      and tax_rate_basis_points between 0 and 10000
    ),
  constraint ticket_orders_invoice_status_check
    check (
      invoice_status in (
        'not_requested',
        'requested',
        'issued',
        'cancelled'
      )
    ),
  constraint ticket_orders_invoice_request_check
    check (
      (requires_invoice and invoice_status <> 'not_requested')
      or (not requires_invoice and invoice_status = 'not_requested')
    ),
  constraint ticket_orders_paid_at_check
    check (
      (paid_at is null
        or status in ('paid', 'refunded', 'charged_back'))
      and (status <> 'paid' or paid_at is not null)
    )
);

comment on table public.ticket_orders is
  'Ticket orders paid through MercadoPago. Amounts are integer cents; published prices are IVA-exclusive.';
comment on column public.ticket_orders.subtotal_cents is
  'IVA-exclusive taxable base. total_cents is generated as subtotal + tax.';
comment on column public.ticket_orders.tax_rate_basis_points is
  'IVA rate in basis points. 1600 = 16%.';
comment on column public.ticket_orders.payload_hash is
  'SHA-256 of the versioned canonical payload; guards idempotent replays.';

create index ticket_orders_status_created_at_idx
  on public.ticket_orders (status, created_at desc);
create index ticket_orders_email_idx on public.ticket_orders (email);
create index ticket_orders_preference_idx
  on public.ticket_orders (provider_preference_id)
  where provider_preference_id is not null;
create index ticket_orders_invoice_status_idx
  on public.ticket_orders (invoice_status)
  where requires_invoice;

-- Fiscal data is separated so an order with no CFDI request carries no tax
-- identifiers, and so the invoicing team can be granted a narrower view later.
create table public.ticket_order_invoice_details (
  order_id uuid primary key
    references public.ticket_orders (id) on delete cascade,
  rfc text not null,
  person_type text not null,
  legal_name text not null,
  tax_regime text not null,
  cfdi_use text not null,
  postal_code text not null,
  billing_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ticket_order_invoice_rfc_check
    check (rfc ~ '^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$'),
  constraint ticket_order_invoice_person_type_check
    check (person_type in ('fisica', 'moral')),
  constraint ticket_order_invoice_person_type_length_check
    check (
      (person_type = 'moral' and pg_catalog.length(rfc) = 12)
      or (person_type = 'fisica' and pg_catalog.length(rfc) = 13)
    ),
  constraint ticket_order_invoice_tax_regime_check
    check (tax_regime ~ '^[0-9]{3}$'),
  constraint ticket_order_invoice_cfdi_use_check
    check (cfdi_use ~ '^[A-Z]{1,2}[0-9]{2}$'),
  constraint ticket_order_invoice_postal_code_check
    check (postal_code ~ '^[0-9]{5}$' and postal_code <> '00000')
);

comment on table public.ticket_order_invoice_details is
  'CFDI 4.0 request data. Present only for orders whose buyer asked for an invoice.';

create table public.ticket_order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null
    references public.ticket_orders (id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ticket_order_events_type_check
    check (
      event_type in (
        'order_created',
        'order_replayed',
        'order_conflict',
        'preference_created',
        'payment_status_changed',
        'payment_duplicate_ignored',
        'invoice_requested',
        'invoice_issued'
      )
    ),
  constraint ticket_order_events_metadata_check
    check (public.is_safe_ticket_order_event_metadata(metadata))
);

comment on table public.ticket_order_events is
  'Append-only operational history with a strict metadata allowlist. Never stores PII.';

create index ticket_order_events_order_id_idx
  on public.ticket_order_events (order_id, created_at desc);

create or replace function public.touch_ticket_order_updated_at()
returns trigger
language plpgsql
volatile
security invoker
set search_path = ''
as $function$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$function$;

create trigger ticket_orders_touch_updated_at
  before update on public.ticket_orders
  for each row
  execute function public.touch_ticket_order_updated_at();

create trigger ticket_order_invoice_details_touch_updated_at
  before update on public.ticket_order_invoice_details
  for each row
  execute function public.touch_ticket_order_updated_at();

-- ---------------------------------------------------------------------------
-- RPCs
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
  v_outcome text;
  v_total integer;
begin
  if p_payload_hash is null
     or p_payload_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_payload_hash'
      using errcode = '22023';
  end if;

  -- The caller prices the order from the server-side catalog, but the amounts
  -- are re-checked here so no future caller can persist an inconsistent total.
  if p_subtotal_cents is distinct from p_unit_price_cents * p_quantity then
    raise exception 'invalid_subtotal'
      using errcode = '22023';
  end if;

  -- Half-up rounding over integers, mirroring applyRateHalfUp() in
  -- lib/payments/tax.ts. Positive bigint division truncates toward zero, so
  -- adding half the divisor before dividing rounds .5 away from zero.
  if p_tax_cents is distinct from (
       (p_subtotal_cents::bigint * p_tax_rate_basis_points + 5000) / 10000
     )::integer then
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
  on conflict (submission_id) do nothing
  returning id into v_order_id;

  if v_order_id is null then
    select o.id, o.payload_hash, o.total_cents
    into v_order_id, v_existing_hash, v_total
    from public.ticket_orders as o
    where o.submission_id = p_submission_id;

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

  v_outcome := 'created';

  return query
  select v_order_id, v_outcome, v_total;
end;
$function$;

create or replace function public.attach_ticket_order_preference(
  p_order_id uuid,
  p_preference_id text
)
returns table (
  order_id uuid,
  preference_id text
)
language plpgsql
volatile
security invoker
set search_path = ''
as $function$
declare
  v_preference text;
begin
  if p_preference_id is null
     or p_preference_id !~ '^[A-Za-z0-9_.:-]{1,128}$' then
    raise exception 'invalid_preference_id'
      using errcode = '22023';
  end if;

  update public.ticket_orders as o
  set provider_preference_id = p_preference_id
  where o.id = p_order_id
    and (
      o.provider_preference_id is null
      or o.provider_preference_id = p_preference_id
    )
  returning o.provider_preference_id into v_preference;

  if v_preference is null then
    -- Either the order does not exist or it already points at a different
    -- preference. Both are non-fatal: the caller keeps the stored preference.
    select o.provider_preference_id into v_preference
    from public.ticket_orders as o
    where o.id = p_order_id;

    if v_preference is null then
      raise exception 'ticket_order_not_found'
        using errcode = 'P0002';
    end if;

    return query select p_order_id, v_preference;
    return;
  end if;

  insert into public.ticket_order_events (order_id, event_type, metadata)
  values (
    p_order_id,
    'preference_created',
    pg_catalog.jsonb_build_object('provider', 'mercadopago')
  );

  return query select p_order_id, v_preference;
end;
$function$;

create or replace function public.record_ticket_order_payment(
  p_order_id uuid,
  p_payment_id text,
  p_status text,
  p_provider_status text default null,
  p_provider_status_detail text default null,
  p_paid_at timestamptz default null
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
  select o.status, o.provider_payment_id
  into v_previous_status, v_previous_payment
  from public.ticket_orders as o
  where o.id = p_order_id
  for update;

  if v_previous_status is null then
    raise exception 'ticket_order_not_found'
      using errcode = 'P0002';
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

alter table public.ticket_orders enable row level security;
alter table public.ticket_order_invoice_details enable row level security;
alter table public.ticket_order_events enable row level security;

-- No policy is created on purpose. Every read and write goes through the
-- server-side secret key (service_role), which bypasses RLS. anon and
-- authenticated keep zero access even if a browser-facing key is ever leaked.
revoke all on table public.ticket_orders
  from anon, authenticated, public;
revoke all on table public.ticket_order_invoice_details
  from anon, authenticated, public;
revoke all on table public.ticket_order_events
  from anon, authenticated, public;

grant select, insert, update on table public.ticket_orders to service_role;
grant select, insert, update on table public.ticket_order_invoice_details
  to service_role;
grant select, insert on table public.ticket_order_events to service_role;

revoke all on sequence public.ticket_order_events_id_seq
  from anon, authenticated, public;
grant usage on sequence public.ticket_order_events_id_seq to service_role;

revoke all on function public.is_safe_ticket_order_event_metadata(jsonb)
  from anon, authenticated, public;
revoke all on function public.touch_ticket_order_updated_at()
  from anon, authenticated, public;
revoke all on function public.create_ticket_order(
  uuid, text, text, smallint, integer, integer, integer, integer, text,
  text, text, text, text, timestamptz, date, boolean, text, text, text,
  text, text, text, text, text, text, text, text, text, text, text, text,
  timestamptz, timestamptz
) from anon, authenticated, public;
revoke all on function public.attach_ticket_order_preference(uuid, text)
  from anon, authenticated, public;
revoke all on function public.record_ticket_order_payment(
  uuid, text, text, text, text, timestamptz
) from anon, authenticated, public;

grant execute on function public.is_safe_ticket_order_event_metadata(jsonb)
  to service_role;
grant execute on function public.create_ticket_order(
  uuid, text, text, smallint, integer, integer, integer, integer, text,
  text, text, text, text, timestamptz, date, boolean, text, text, text,
  text, text, text, text, text, text, text, text, text, text, text, text,
  timestamptz, timestamptz
) to service_role;
grant execute on function public.attach_ticket_order_preference(uuid, text)
  to service_role;
grant execute on function public.record_ticket_order_payment(
  uuid, text, text, text, text, timestamptz
) to service_role;

commit;
