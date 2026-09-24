-- SC Security Summit 2026
-- Unblock the ticket notification outbox and keep paid orders paid.
--
-- Problem 1 — no ticket email has ever been recorded as delivered:
--   20260827120000_discount_codes rewrote ticket_order_events_type_check and
--   is_safe_ticket_order_event_metadata() against the vocabulary as it stood
--   before 20260824130000, so both dropped what the notification outbox
--   writes: the 'notification_sent' / 'notification_failed' event types and
--   the notification_id, notification_status, template, attempt_number and
--   duration_ms metadata keys. 20260827130000 restored 'order_expired' but not
--   these.
--
--   complete_ticket_order_notification() logs one of those events, so every
--   completion rolls back and the row stays 'processing' with no attempt
--   recorded. claim_ticket_order_notifications() logs the same event when it
--   recovers an expired lease, so the cron recovery rolls back too and the
--   ticket queue fails on every run. The email itself is sent before the
--   completion, so the immediate attempt most likely did reach the buyer; what
--   is lost is the record of it and every retry.
--
-- Problem 2 — a paid order could be un-paid by another payment:
--   record_ticket_order_payment() only refused pending/in_process on a paid
--   order. A late 'rejected' for a card declined before the approved one, or a
--   refund of a duplicate charge, carries a different payment id and used to
--   move the order out of 'paid' (and release its coupon use with it).
--
-- Fix:
--   Restate the event check and the metadata validator as the union of every
--   vocabulary, and pin a paid order to the payment that paid it. No data is
--   touched here: the outbox rows left 'processing' are recovered by the cron
--   runs after this is applied, and recovered rows are retried — which sends
--   those emails again unless operations settles the backlog first.

begin;

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
      'order_expired',
      'coupon_applied',
      'invoice_requested',
      'invoice_issued',
      'notification_sent',
      'notification_failed'
    )
  );

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
      'coupon_code',
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

  -- A paid order stays paid. It belongs to the payment that paid it, so a
  -- notification about any other payment of the same order — a card declined
  -- before the one that went through, a second checkout the buyer abandoned,
  -- a duplicate charge being refunded — never moves it. Its own payment can
  -- only take it to refunded or charged_back; a late pending, in_process,
  -- rejected or cancelled delivery about it is noise.
  if v_previous_status = 'paid'
     and (
       v_previous_payment is distinct from p_payment_id
       or p_status in ('pending', 'in_process', 'rejected', 'cancelled')
     ) then
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


commit;
