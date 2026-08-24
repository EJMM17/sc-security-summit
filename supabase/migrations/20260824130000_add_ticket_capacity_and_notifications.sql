-- SC Security Summit 2026
-- Add seat capacity control and a durable notification outbox for ticket
-- orders.
--
-- Forward plan:
--   * public.ticket_capacity caps how many seats can be committed, globally
--     and per tier. A scope with no row is unlimited, so capacity is opt-in:
--     nothing blocks a sale until operations configures a real number.
--   * create_ticket_order() is replaced (same signature) to enforce that cap
--     and to return the new 'sold_out' outcome.
--   * public.ticket_order_notifications is an outbox with the same lease,
--     attempt and idempotency contract as inquiry_notifications. A trigger
--     enqueues the buyer receipt and the internal notice exactly once, when an
--     order first becomes paid.
--
-- Operational rollback:
--   Roll back the application. Keep these additive tables. Deleting every
--   ticket_capacity row restores unlimited selling without a code change.

begin;

-- ---------------------------------------------------------------------------
-- Capacity
-- ---------------------------------------------------------------------------

create table public.ticket_capacity (
  scope text primary key,
  total_seats integer not null,
  hold_minutes smallint not null default 30,
  updated_at timestamptz not null default now(),
  constraint ticket_capacity_scope_check
    check (scope in ('total', 'plus', 'general', 'estudiante')),
  constraint ticket_capacity_total_seats_check
    check (total_seats >= 0),
  constraint ticket_capacity_hold_minutes_check
    check (hold_minutes between 5 and 240)
);

comment on table public.ticket_capacity is
  'Opt-in seat caps. A scope with no row is unlimited; deleting every row disables capacity control.';
comment on column public.ticket_capacity.hold_minutes is
  'How long an unpaid pending order keeps holding its seats. Must match or exceed the MercadoPago preference expiry.';

create trigger ticket_capacity_touch_updated_at
  before update on public.ticket_capacity
  for each row
  execute function public.touch_ticket_order_updated_at();

/**
 * Seats already committed for a scope.
 *
 * Paid and in-process orders always count. A pending order counts only while
 * its soft hold lasts, so an abandoned checkout releases its seats instead of
 * starving the event.
 */
create or replace function public.committed_ticket_seats(
  p_scope text,
  p_hold_minutes smallint default 30
)
returns integer
language sql
stable
security invoker
set search_path = ''
as $function$
  select coalesce(pg_catalog.sum(o.quantity), 0)::integer
  from public.ticket_orders as o
  where (p_scope = 'total' or o.tier = p_scope)
    and (
      o.status in ('paid', 'in_process')
      or (
        o.status = 'pending'
        and o.created_at
          > pg_catalog.clock_timestamp()
            - (p_hold_minutes * interval '1 minute')
      )
    );
$function$;

/**
 * Remaining seats for a scope, or null when the scope is uncapped.
 */
create or replace function public.remaining_ticket_seats(p_scope text)
returns integer
language plpgsql
stable
security invoker
set search_path = ''
as $function$
declare
  v_capacity public.ticket_capacity%rowtype;
begin
  select * into v_capacity
  from public.ticket_capacity as c
  where c.scope = p_scope;

  if not found then
    return null;
  end if;

  -- greatest() is a SQL construct, not a pg_catalog function, so it resolves
  -- correctly even with an empty search_path.
  return greatest(
    0,
    v_capacity.total_seats
      - public.committed_ticket_seats(p_scope, v_capacity.hold_minutes)
  );
end;
$function$;

-- ---------------------------------------------------------------------------
-- Notification outbox
-- ---------------------------------------------------------------------------

create table public.ticket_order_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null
    references public.ticket_orders (id) on delete cascade,
  channel text not null default 'email',
  template text not null,
  status text not null default 'pending',
  attempt_count smallint not null default 0,
  next_attempt_at timestamptz,
  processing_started_at timestamptz,
  provider_message_id text,
  last_error_code text,
  last_error_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ticket_order_notifications_delivery_key
    unique (order_id, channel, template),
  constraint ticket_order_notifications_channel_check
    check (channel = 'email'),
  constraint ticket_order_notifications_template_check
    check (
      template in ('ticket_buyer_receipt_v1', 'ticket_order_internal_v1')
    ),
  constraint ticket_order_notifications_status_check
    check (status in ('pending', 'processing', 'sent', 'retry', 'dead')),
  constraint ticket_order_notifications_attempt_count_check
    check (attempt_count between 0 and 5),
  constraint ticket_order_notifications_provider_message_id_check
    check (
      provider_message_id is null
      or pg_catalog.char_length(provider_message_id) between 1 and 255
    ),
  constraint ticket_order_notifications_error_code_check
    check (
      last_error_code is null
      or last_error_code ~ '^[A-Za-z0-9_.:-]{1,128}$'
    ),
  constraint ticket_order_notifications_state_check check (
    (
      status = 'pending'
      and attempt_count = 0
      and next_attempt_at is not null
      and processing_started_at is null
      and sent_at is null
    )
    or (
      status = 'processing'
      and attempt_count between 1 and 5
      and next_attempt_at is null
      and processing_started_at is not null
      and sent_at is null
    )
    or (
      status = 'retry'
      and attempt_count between 1 and 4
      and next_attempt_at is not null
      and processing_started_at is null
      and last_error_code is not null
      and sent_at is null
    )
    or (
      status = 'sent'
      and attempt_count between 1 and 5
      and next_attempt_at is null
      and processing_started_at is null
      and provider_message_id is not null
      and last_error_code is null
      and sent_at is not null
    )
    or (
      status = 'dead'
      and attempt_count between 1 and 5
      and next_attempt_at is null
      and processing_started_at is null
      and last_error_code is not null
      and sent_at is null
    )
  )
);

comment on table public.ticket_order_notifications is
  'Durable email outbox for ticket orders. Workers must claim before contacting Resend.';

create index ticket_order_notifications_due_idx
  on public.ticket_order_notifications (next_attempt_at, created_at)
  where status in ('pending', 'retry');
create index ticket_order_notifications_order_idx
  on public.ticket_order_notifications (order_id);

create table public.ticket_order_notification_attempts (
  id bigint generated always as identity primary key,
  notification_id uuid not null
    references public.ticket_order_notifications (id) on delete cascade,
  attempt_number smallint not null,
  result text not null,
  duration_ms integer not null,
  provider_message_id text,
  error_code text,
  created_at timestamptz not null default now(),
  constraint ticket_order_notification_attempts_number_key
    unique (notification_id, attempt_number),
  constraint ticket_order_notification_attempts_number_check
    check (attempt_number between 1 and 5),
  constraint ticket_order_notification_attempts_result_check
    check (result in ('sent', 'retry', 'dead')),
  constraint ticket_order_notification_attempts_duration_check
    check (duration_ms between 0 and 900000),
  constraint ticket_order_notification_attempts_error_code_check
    check (error_code is null or error_code ~ '^[A-Za-z0-9_.:-]{1,128}$')
);

comment on table public.ticket_order_notification_attempts is
  'Append-only technical delivery attempts; never stores email content or recipient.';

create trigger ticket_order_notifications_touch_updated_at
  before update on public.ticket_order_notifications
  for each row
  execute function public.touch_ticket_order_updated_at();

/**
 * Enqueues the buyer receipt and the internal notice the first time an order
 * becomes paid. `on conflict do nothing` makes a duplicate webhook delivery a
 * no-op even if it somehow reaches the update again.
 */
create or replace function public.enqueue_ticket_order_notifications()
returns trigger
language plpgsql
volatile
security invoker
set search_path = ''
as $function$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then
    insert into public.ticket_order_notifications (
      order_id, template, next_attempt_at
    )
    values
      (new.id, 'ticket_buyer_receipt_v1', pg_catalog.clock_timestamp()),
      (new.id, 'ticket_order_internal_v1', pg_catalog.clock_timestamp())
    on conflict on constraint ticket_order_notifications_delivery_key
    do nothing;
  end if;

  return new;
end;
$function$;

create trigger ticket_orders_enqueue_notifications
  after update on public.ticket_orders
  for each row
  execute function public.enqueue_ticket_order_notifications();

-- ---------------------------------------------------------------------------
-- create_ticket_order: same signature, now capacity aware
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

-- ---------------------------------------------------------------------------
-- Event log: widen for notification history
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
      'notification_id',
      'notification_status',
      'template',
      'attempt_number',
      'duration_ms'
    ) then
      return false;
    end if;

    v_text := v_value #>> '{}';

    if v_key = 'quantity' then
      if pg_catalog.jsonb_typeof(v_value) <> 'number'
         or v_text !~ '^[0-9]{1,2}$' then
        return false;
      end if;
    elsif v_key = 'attempt_number' then
      if pg_catalog.jsonb_typeof(v_value) <> 'number'
         or v_text !~ '^[0-5]$' then
        return false;
      end if;
    elsif v_key = 'duration_ms' then
      if pg_catalog.jsonb_typeof(v_value) <> 'number'
         or v_text !~ '^[0-9]{1,9}$' then
        return false;
      end if;
    elsif v_key = 'notification_id' then
      if pg_catalog.jsonb_typeof(v_value) <> 'string'
         or v_text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
        return false;
      end if;
    elsif v_key = 'notification_status' then
      if pg_catalog.jsonb_typeof(v_value) <> 'string'
         or v_text not in ('pending', 'processing', 'sent', 'retry', 'dead') then
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

alter table public.ticket_order_events
  drop constraint ticket_order_events_type_check;
alter table public.ticket_order_events
  add constraint ticket_order_events_type_check
  check (
    event_type in (
      'order_created',
      'order_replayed',
      'order_conflict',
      'order_sold_out',
      'preference_created',
      'payment_status_changed',
      'payment_duplicate_ignored',
      'invoice_requested',
      'invoice_issued',
      'notification_sent',
      'notification_failed'
    )
  );

-- ---------------------------------------------------------------------------
-- Outbox RPCs
-- ---------------------------------------------------------------------------

create or replace function public.claim_ticket_order_notification(
  p_notification_id uuid
)
returns table (
  notification_id uuid,
  order_id uuid,
  attempt_number smallint,
  template text
)
language sql
volatile
security invoker
set search_path = ''
as $function$
  with candidate as (
    select n.id
    from public.ticket_order_notifications as n
    where n.id = p_notification_id
      and n.status in ('pending', 'retry')
      and n.next_attempt_at <= pg_catalog.clock_timestamp()
      and n.attempt_count < 5
    for update skip locked
  ),
  claimed as (
    update public.ticket_order_notifications as n
    set
      status = 'processing',
      attempt_count = n.attempt_count + 1,
      next_attempt_at = null,
      processing_started_at = pg_catalog.clock_timestamp()
    from candidate as c
    where n.id = c.id
    returning n.id, n.order_id, n.attempt_count, n.template
  )
  select c.id, c.order_id, c.attempt_count, c.template
  from claimed as c;
$function$;

create or replace function public.claim_ticket_order_notifications(
  p_limit integer default 10
)
returns table (
  notification_id uuid,
  order_id uuid,
  attempt_number smallint,
  template text
)
language plpgsql
volatile
security invoker
set search_path = ''
as $function$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 10), 1), 50);
  v_stale record;
  v_recovered_status text;
  v_error_code text := 'processing_lease_expired';
begin
  -- Recover abandoned leases before claiming new work. Every expired lease is
  -- recorded as an attempt, so attempt numbering remains complete.
  for v_stale in
    select n.id, n.order_id, n.attempt_count
    from public.ticket_order_notifications as n
    where n.status = 'processing'
      and n.processing_started_at
        <= pg_catalog.clock_timestamp() - interval '15 minutes'
    order by n.processing_started_at
    limit v_limit
    for update skip locked
  loop
    v_recovered_status :=
      case when v_stale.attempt_count >= 5 then 'dead' else 'retry' end;

    insert into public.ticket_order_notification_attempts (
      notification_id, attempt_number, result, error_code, duration_ms
    )
    values (v_stale.id, v_stale.attempt_count, v_recovered_status, v_error_code, 0)
    on conflict on constraint ticket_order_notification_attempts_number_key
    do nothing;

    update public.ticket_order_notifications as n
    set
      status = v_recovered_status,
      next_attempt_at = case
        when v_recovered_status = 'retry' then pg_catalog.clock_timestamp()
        else null
      end,
      processing_started_at = null,
      last_error_code = v_error_code,
      last_error_at = pg_catalog.clock_timestamp()
    where n.id = v_stale.id;

    insert into public.ticket_order_events (order_id, event_type, metadata)
    values (
      v_stale.order_id,
      'notification_failed',
      pg_catalog.jsonb_build_object(
        'notification_id', v_stale.id,
        'notification_status', v_recovered_status,
        'error_code', v_error_code,
        'attempt_number', v_stale.attempt_count,
        'duration_ms', 0
      )
    );
  end loop;

  return query
  with candidates as (
    select n.id
    from public.ticket_order_notifications as n
    where n.status in ('pending', 'retry')
      and n.next_attempt_at <= pg_catalog.clock_timestamp()
      and n.attempt_count < 5
    order by n.next_attempt_at, n.created_at
    limit v_limit
    for update skip locked
  ),
  claimed as (
    update public.ticket_order_notifications as n
    set
      status = 'processing',
      attempt_count = n.attempt_count + 1,
      next_attempt_at = null,
      processing_started_at = pg_catalog.clock_timestamp()
    from candidates as c
    where n.id = c.id
    returning n.id, n.order_id, n.attempt_count, n.template
  )
  select c.id, c.order_id, c.attempt_count, c.template
  from claimed as c
  order by c.id;
end;
$function$;

create or replace function public.complete_ticket_order_notification(
  p_notification_id uuid,
  p_attempt_number smallint,
  p_result text,
  p_duration_ms integer,
  p_provider_message_id text default null,
  p_error_code text default null,
  p_next_attempt_at timestamptz default null
)
returns table (
  notification_id uuid,
  status text,
  attempt_count smallint
)
language plpgsql
volatile
security invoker
set search_path = ''
as $function$
declare
  v_notification public.ticket_order_notifications%rowtype;
  v_existing public.ticket_order_notification_attempts%rowtype;
  v_provider_message_id text :=
    nullif(pg_catalog.btrim(p_provider_message_id), '');
  v_error_code text := nullif(pg_catalog.btrim(p_error_code), '');
  v_event_type text;
begin
  select n.* into v_notification
  from public.ticket_order_notifications as n
  where n.id = p_notification_id
  for update;

  if not found then
    raise exception 'notification_not_found' using errcode = 'P0002';
  end if;

  select a.* into v_existing
  from public.ticket_order_notification_attempts as a
  where a.notification_id = p_notification_id
    and a.attempt_number = p_attempt_number;

  if found then
    -- A cron delivery that repeats an identical completion is a safe replay.
    if v_existing.result = p_result
       and v_existing.provider_message_id
         is not distinct from v_provider_message_id
       and v_existing.error_code is not distinct from v_error_code
       and v_existing.duration_ms = p_duration_ms then
      return query
      select n.id, n.status, n.attempt_count
      from public.ticket_order_notifications as n
      where n.id = p_notification_id;
      return;
    end if;

    raise exception 'notification_completion_conflict' using errcode = 'P0001';
  end if;

  if v_notification.status <> 'processing'
     or v_notification.attempt_count <> p_attempt_number then
    raise exception 'notification_not_claimed' using errcode = 'P0001';
  end if;

  if p_result not in ('sent', 'retry', 'dead')
     or p_duration_ms is null
     or p_duration_ms < 0
     or p_duration_ms > 900000 then
    raise exception 'invalid_notification_result' using errcode = '22023';
  end if;

  if p_result = 'sent' then
    if v_provider_message_id is null
       or v_error_code is not null
       or p_next_attempt_at is not null then
      raise exception 'invalid_sent_result' using errcode = '22023';
    end if;
  elsif p_result = 'retry' then
    if v_error_code is null
       or v_error_code !~ '^[A-Za-z0-9_.:-]{1,128}$'
       or p_next_attempt_at is null
       or p_next_attempt_at <= pg_catalog.clock_timestamp()
       or p_attempt_number >= 5 then
      raise exception 'invalid_retry_result' using errcode = '22023';
    end if;
  else
    if v_error_code is null
       or v_error_code !~ '^[A-Za-z0-9_.:-]{1,128}$'
       or p_next_attempt_at is not null then
      raise exception 'invalid_dead_result' using errcode = '22023';
    end if;
  end if;

  insert into public.ticket_order_notification_attempts (
    notification_id, attempt_number, result, duration_ms,
    provider_message_id, error_code
  )
  values (
    p_notification_id, p_attempt_number, p_result, p_duration_ms,
    v_provider_message_id, v_error_code
  );

  update public.ticket_order_notifications as n
  set
    status = p_result,
    next_attempt_at = case when p_result = 'retry' then p_next_attempt_at end,
    processing_started_at = null,
    provider_message_id = case
      when p_result = 'sent' then v_provider_message_id
      else n.provider_message_id
    end,
    last_error_code = case when p_result = 'sent' then null else v_error_code end,
    last_error_at = case
      when p_result = 'sent' then n.last_error_at
      else pg_catalog.clock_timestamp()
    end,
    sent_at = case
      when p_result = 'sent' then pg_catalog.clock_timestamp()
      else n.sent_at
    end
  where n.id = p_notification_id;

  v_event_type := case
    when p_result = 'sent' then 'notification_sent'
    else 'notification_failed'
  end;

  insert into public.ticket_order_events (order_id, event_type, metadata)
  values (
    v_notification.order_id,
    v_event_type,
    pg_catalog.jsonb_build_object(
      'notification_id', p_notification_id,
      'notification_status', p_result,
      'template', v_notification.template,
      'attempt_number', p_attempt_number,
      'duration_ms', p_duration_ms
    )
    || case
         when v_error_code is null then '{}'::jsonb
         else pg_catalog.jsonb_build_object('error_code', v_error_code)
       end
  );

  return query
  select n.id, n.status, n.attempt_count
  from public.ticket_order_notifications as n
  where n.id = p_notification_id;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Row level security and grants
-- ---------------------------------------------------------------------------

alter table public.ticket_capacity enable row level security;
alter table public.ticket_order_notifications enable row level security;
alter table public.ticket_order_notification_attempts enable row level security;

revoke all on table public.ticket_capacity
  from anon, authenticated, public;
revoke all on table public.ticket_order_notifications
  from anon, authenticated, public;
revoke all on table public.ticket_order_notification_attempts
  from anon, authenticated, public;

grant select on table public.ticket_capacity to service_role;
grant select, insert, update on table public.ticket_order_notifications
  to service_role;
grant select, insert on table public.ticket_order_notification_attempts
  to service_role;

revoke all on sequence public.ticket_order_notification_attempts_id_seq
  from anon, authenticated, public;
grant usage on sequence public.ticket_order_notification_attempts_id_seq
  to service_role;

revoke all on function public.committed_ticket_seats(text, smallint)
  from anon, authenticated, public;
revoke all on function public.remaining_ticket_seats(text)
  from anon, authenticated, public;
revoke all on function public.enqueue_ticket_order_notifications()
  from anon, authenticated, public;
revoke all on function public.claim_ticket_order_notification(uuid)
  from anon, authenticated, public;
revoke all on function public.claim_ticket_order_notifications(integer)
  from anon, authenticated, public;
revoke all on function public.complete_ticket_order_notification(
  uuid, smallint, text, integer, text, text, timestamptz
) from anon, authenticated, public;

grant execute on function public.committed_ticket_seats(text, smallint)
  to service_role;
grant execute on function public.remaining_ticket_seats(text) to service_role;
grant execute on function public.claim_ticket_order_notification(uuid)
  to service_role;
grant execute on function public.claim_ticket_order_notifications(integer)
  to service_role;
grant execute on function public.complete_ticket_order_notification(
  uuid, smallint, text, integer, text, text, timestamptz
) to service_role;

commit;
