begin;

create extension if not exists pgtap with schema extensions;
grant usage on schema extensions to service_role;
set local search_path = public, extensions, pg_catalog;

select plan(19);

-- ---------------------------------------------------------------------------
-- Security
-- ---------------------------------------------------------------------------

select ok(
  (
    select bool_and(c.relrowsecurity)
    from pg_class as c
    join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'ticket_capacity',
        'ticket_order_notifications',
        'ticket_order_notification_attempts'
      )
  ),
  'RLS is enabled on the capacity and notification tables'
);

select ok(
  not exists (
    select 1
    from unnest(array['anon', 'authenticated', 'public']) as role_name
    cross join unnest(array[
      'public.ticket_capacity',
      'public.ticket_order_notifications',
      'public.ticket_order_notification_attempts'
    ]) as table_name
    cross join unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) as privilege
    where has_table_privilege(role_name, table_name, privilege)
  ),
  'no browser-facing role can touch capacity or notifications'
);

select ok(
  has_table_privilege('service_role', 'public.ticket_order_notification_attempts', 'INSERT')
  and not has_table_privilege(
    'service_role', 'public.ticket_order_notification_attempts', 'UPDATE'
  ),
  'the notification attempt log is append-only'
);

-- Capacity is edited by a human in Studio, never by the application.
select ok(
  has_table_privilege('service_role', 'public.ticket_capacity', 'SELECT')
  and not has_table_privilege('service_role', 'public.ticket_capacity', 'UPDATE')
  and not has_table_privilege('service_role', 'public.ticket_capacity', 'INSERT'),
  'the application can read capacity but never change it'
);

set local role service_role;

-- ---------------------------------------------------------------------------
-- Capacity is opt-in
-- ---------------------------------------------------------------------------

select is(
  public.remaining_ticket_seats('plus'),
  null,
  'a scope with no capacity row is unlimited'
);

select is(
  (
    select count(*)::integer from public.ticket_capacity
  ),
  0,
  'no capacity is configured by default, so nothing blocks a first sale'
);

select lives_ok(
  $$
    select public.create_ticket_order(
      p_submission_id => '30000000-0000-4000-8000-000000000001'::uuid,
      p_payload_hash => repeat('a', 64),
      p_tier => 'plus',
      p_quantity => 4::smallint,
      p_unit_price_cents => 250000,
      p_subtotal_cents => 862069,
      p_tax_rate_basis_points => 1600,
      p_tax_cents => 137931,
      p_buyer_name => 'Ada Lovelace',
      p_email => 'ada@example.com',
      p_phone => '+52 899 123 4567',
      p_language => 'es',
      p_consent_version => '2026-07-30',
      p_consented_at => now(),
      p_retention_until => (now() + interval '5 years')::date
    )
  $$,
  'an order is accepted while capacity is unconfigured'
);

reset role;
insert into public.ticket_capacity (scope, total_seats, hold_minutes)
values ('plus', 5, 30);
set local role service_role;

select is(
  public.remaining_ticket_seats('plus'),
  1,
  'a pending order holds its seats while the hold window lasts'
);

select results_eq(
  $$
    select outcome
    from public.create_ticket_order(
      p_submission_id => '30000000-0000-4000-8000-000000000002'::uuid,
      p_payload_hash => repeat('b', 64),
      p_tier => 'plus',
      p_quantity => 2::smallint,
      p_unit_price_cents => 250000,
      p_subtotal_cents => 431034,
      p_tax_rate_basis_points => 1600,
      p_tax_cents => 68966,
      p_buyer_name => 'Grace Hopper',
      p_email => 'grace@example.com',
      p_phone => '+52 899 765 4321',
      p_language => 'es',
      p_consent_version => '2026-07-30',
      p_consented_at => now(),
      p_retention_until => (now() + interval '5 years')::date
    )
  $$,
  $$ values ('sold_out'::text) $$,
  'an order that does not fit in the remaining seats is refused'
);

select is(
  (select count(*)::integer from public.ticket_orders),
  1,
  'a sold-out attempt stores no order'
);

select results_eq(
  $$
    select outcome
    from public.create_ticket_order(
      p_submission_id => '30000000-0000-4000-8000-000000000001'::uuid,
      p_payload_hash => repeat('a', 64),
      p_tier => 'plus',
      p_quantity => 4::smallint,
      p_unit_price_cents => 250000,
      p_subtotal_cents => 862069,
      p_tax_rate_basis_points => 1600,
      p_tax_cents => 137931,
      p_buyer_name => 'Ada Lovelace',
      p_email => 'ada@example.com',
      p_phone => '+52 899 123 4567',
      p_language => 'es',
      p_consent_version => '2026-07-30',
      p_consented_at => now(),
      p_retention_until => (now() + interval '5 years')::date
    )
  $$,
  $$ values ('replayed'::text) $$,
  'a replay is answered before the capacity check, so a sold-out event never rejects an existing buyer'
);

-- An abandoned checkout must give its seats back.
reset role;
update public.ticket_orders
set created_at = now() - interval '2 hours'
where submission_id = '30000000-0000-4000-8000-000000000001'::uuid;
set local role service_role;

select is(
  public.remaining_ticket_seats('plus'),
  5,
  'an abandoned pending order releases its seats once the hold expires'
);

-- ---------------------------------------------------------------------------
-- Notification outbox
-- ---------------------------------------------------------------------------

select is(
  (
    select count(*)::integer
    from public.ticket_order_notifications
  ),
  0,
  'an unpaid order enqueues no notification'
);

select lives_ok(
  $$
    select public.record_ticket_order_payment(
      p_order_id => (
        select id from public.ticket_orders
        where submission_id = '30000000-0000-4000-8000-000000000001'::uuid
      ),
      p_payment_id => '1234567890',
      p_status => 'paid',
      p_provider_status => 'approved',
      p_paid_at => now()
    )
  $$,
  'the order can be marked paid'
);

select results_eq(
  $$
    select template::text
    from public.ticket_order_notifications
    order by template
  $$,
  $$ values ('ticket_buyer_receipt_v1'::text), ('ticket_order_internal_v1'::text) $$,
  'becoming paid enqueues the buyer receipt and the internal notice'
);

-- A duplicate webhook delivery must not enqueue a second receipt.
select lives_ok(
  $$
    select public.record_ticket_order_payment(
      p_order_id => (
        select id from public.ticket_orders
        where submission_id = '30000000-0000-4000-8000-000000000001'::uuid
      ),
      p_payment_id => '1234567890',
      p_status => 'paid',
      p_provider_status => 'approved'
    )
  $$,
  'a duplicate paid notification is accepted'
);

select is(
  (select count(*)::integer from public.ticket_order_notifications),
  2,
  'a duplicate paid notification never enqueues a second email'
);

select results_eq(
  $$
    select attempt_number, template
    from public.claim_ticket_order_notification(
      (
        select id from public.ticket_order_notifications
        where template = 'ticket_buyer_receipt_v1'
      )
    )
  $$,
  $$ values (1::smallint, 'ticket_buyer_receipt_v1'::text) $$,
  'a pending notification can be claimed once'
);

select is(
  (
    select count(*)::integer
    from public.claim_ticket_order_notification(
      (
        select id from public.ticket_order_notifications
        where template = 'ticket_buyer_receipt_v1'
      )
    )
  ),
  0,
  'an already claimed notification cannot be claimed again'
);

select * from finish();
rollback;
