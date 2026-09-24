begin;

create extension if not exists pgtap with schema extensions;
grant usage on schema extensions to service_role;
set local role service_role;
set local search_path = public, extensions, pg_catalog;

select plan(13);

-- ---------------------------------------------------------------------------
-- A paid order enqueues its two emails
-- ---------------------------------------------------------------------------

select lives_ok(
  $$
    select public.create_ticket_order(
      p_submission_id => '50000000-0000-4000-8000-000000000001'::uuid,
      p_payload_hash => repeat('e', 64),
      p_tier => 'plus',
      p_quantity => 1::smallint,
      p_unit_price_cents => 250000,
      p_subtotal_cents => 215517,
      p_tax_rate_basis_points => 1600,
      p_tax_cents => 34483,
      p_buyer_name => 'Grace Hopper',
      p_email => 'grace@example.com',
      p_phone => '+52 899 123 4567',
      p_language => 'es',
      p_consent_version => '2026-08-26',
      p_consented_at => now(),
      p_retention_until => (now() + interval '5 years')::date
    )
  $$,
  'a single Plus order is stored'
);

select is(
  (
    select order_status from public.record_ticket_order_payment(
      p_order_id => (
        select id from public.ticket_orders
        where submission_id = '50000000-0000-4000-8000-000000000001'::uuid
      ),
      p_payment_id => 'mp-approved',
      p_status => 'paid',
      p_provider_status => 'approved',
      p_paid_at => now(),
      p_paid_amount_cents => 250000
    )
  ),
  'paid',
  'the approved payment marks the order paid'
);

-- ---------------------------------------------------------------------------
-- The outbox can complete a delivery (regressed by 20260827120000)
-- ---------------------------------------------------------------------------

create temporary table claimed on commit drop as
select * from public.claim_ticket_order_notification(
  (
    select n.id from public.ticket_order_notifications as n
    join public.ticket_orders as o on o.id = n.order_id
    where o.submission_id = '50000000-0000-4000-8000-000000000001'::uuid
      and n.template = 'ticket_buyer_receipt_v1'
  )
);

select is(
  (select count(*)::integer from claimed),
  1,
  'the receipt is claimed'
);

select is(
  (
    select status from public.complete_ticket_order_notification(
      p_notification_id => (select notification_id from claimed),
      p_attempt_number => 1::smallint,
      p_result => 'sent',
      p_duration_ms => 120,
      p_provider_message_id => 'resend-message-1'
    )
  ),
  'sent',
  'a delivered receipt is recorded as sent'
);

select is(
  (
    select count(*)::integer from public.ticket_order_events
    where order_id = (select order_id from claimed)
      and event_type = 'notification_sent'
      and metadata ->> 'notification_id' = (select notification_id::text from claimed)
  ),
  1,
  'the delivery is logged with its notification id'
);

-- ---------------------------------------------------------------------------
-- Cron recovers an abandoned lease instead of failing the whole run
-- ---------------------------------------------------------------------------

select is(
  (
    select count(*)::integer from public.claim_ticket_order_notification(
      (
        select n.id from public.ticket_order_notifications as n
        where n.order_id = (select order_id from claimed)
          and n.template = 'ticket_order_internal_v1'
      )
    )
  ),
  1,
  'the internal notice is claimed'
);

-- Simulate a worker that died mid-delivery.
update public.ticket_order_notifications
set processing_started_at = pg_catalog.clock_timestamp() - interval '20 minutes'
where order_id = (select order_id from claimed)
  and template = 'ticket_order_internal_v1';

select lives_ok(
  $$ select * from public.claim_ticket_order_notifications(10) $$,
  'the cron claim recovers an expired lease without raising'
);

select is(
  (
    select attempt_count::integer from public.ticket_order_notifications
    where order_id = (select order_id from claimed)
      and template = 'ticket_order_internal_v1'
  ),
  2,
  'the recovered notice was retried as its second attempt'
);

select is(
  (
    select count(*)::integer from public.ticket_order_events
    where order_id = (select order_id from claimed)
      and event_type = 'notification_failed'
      and metadata ->> 'error_code' = 'processing_lease_expired'
  ),
  1,
  'the expired lease is logged'
);

-- ---------------------------------------------------------------------------
-- A paid order stays paid
-- ---------------------------------------------------------------------------

select is(
  (
    select order_status || ':' || outcome from public.record_ticket_order_payment(
      p_order_id => (select order_id from claimed),
      p_payment_id => 'mp-declined-earlier',
      p_status => 'rejected',
      p_provider_status => 'rejected'
    )
  ),
  'paid:ignored',
  'a late rejection of an earlier card does not un-pay the order'
);

select is(
  (
    select order_status || ':' || outcome from public.record_ticket_order_payment(
      p_order_id => (select order_id from claimed),
      p_payment_id => 'mp-duplicate-charge',
      p_status => 'refunded',
      p_provider_status => 'refunded'
    )
  ),
  'paid:ignored',
  'refunding a duplicate charge does not refund the order'
);

select is(
  (
    select order_status || ':' || outcome from public.record_ticket_order_payment(
      p_order_id => (select order_id from claimed),
      p_payment_id => 'mp-approved',
      p_status => 'cancelled',
      p_provider_status => 'cancelled'
    )
  ),
  'paid:ignored',
  'a late cancellation of the paying payment is ignored'
);

select is(
  (
    select order_status || ':' || outcome from public.record_ticket_order_payment(
      p_order_id => (select order_id from claimed),
      p_payment_id => 'mp-approved',
      p_status => 'refunded',
      p_provider_status => 'refunded'
    )
  ),
  'refunded:updated',
  'refunding the paying payment still refunds the order'
);

select * from finish();
rollback;
