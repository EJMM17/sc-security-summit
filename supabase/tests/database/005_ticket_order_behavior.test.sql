begin;

create extension if not exists pgtap with schema extensions;
grant usage on schema extensions to service_role;
set local role service_role;
set local search_path = public, extensions, pg_catalog;

select plan(21);

-- ---------------------------------------------------------------------------
-- create_ticket_order: pricing guards
-- ---------------------------------------------------------------------------

select throws_ok(
  $$
    select public.create_ticket_order(
      p_submission_id => '20000000-0000-4000-8000-000000000001'::uuid,
      p_payload_hash => 'not-a-hash',
      p_tier => 'plus',
      p_quantity => 2::smallint,
      p_unit_price_cents => 250000,
      p_subtotal_cents => 500000,
      p_tax_rate_basis_points => 1600,
      p_tax_cents => 80000,
      p_buyer_name => 'Ada Lovelace',
      p_email => 'ada@example.com',
      p_phone => '+52 899 123 4567',
      p_language => 'es',
      p_consent_version => '2026-07-30',
      p_consented_at => now(),
      p_retention_until => (now() + interval '5 years')::date
    )
  $$,
  '22023',
  'invalid_payload_hash',
  'a malformed payload hash is rejected'
);

select throws_ok(
  $$
    select public.create_ticket_order(
      p_submission_id => '20000000-0000-4000-8000-000000000002'::uuid,
      p_payload_hash => repeat('a', 64),
      p_tier => 'plus',
      p_quantity => 2::smallint,
      p_unit_price_cents => 250000,
      p_subtotal_cents => 400000,
      p_tax_rate_basis_points => 1600,
      p_tax_cents => 64000,
      p_buyer_name => 'Ada Lovelace',
      p_email => 'ada@example.com',
      p_phone => '+52 899 123 4567',
      p_language => 'es',
      p_consent_version => '2026-07-30',
      p_consented_at => now(),
      p_retention_until => (now() + interval '5 years')::date
    )
  $$,
  '22023',
  'invalid_subtotal',
  'a subtotal that is not unit price times quantity is rejected'
);

select throws_ok(
  $$
    select public.create_ticket_order(
      p_submission_id => '20000000-0000-4000-8000-000000000003'::uuid,
      p_payload_hash => repeat('a', 64),
      p_tier => 'plus',
      p_quantity => 2::smallint,
      p_unit_price_cents => 250000,
      p_subtotal_cents => 500000,
      p_tax_rate_basis_points => 1600,
      p_tax_cents => 1,
      p_buyer_name => 'Ada Lovelace',
      p_email => 'ada@example.com',
      p_phone => '+52 899 123 4567',
      p_language => 'es',
      p_consent_version => '2026-07-30',
      p_consented_at => now(),
      p_retention_until => (now() + interval '5 years')::date
    )
  $$,
  '22023',
  'invalid_tax_amount',
  'a tax amount that does not match the declared rate is rejected'
);

select throws_ok(
  $$
    select public.create_ticket_order(
      p_submission_id => '20000000-0000-4000-8000-000000000004'::uuid,
      p_payload_hash => repeat('a', 64),
      p_tier => 'plus',
      p_quantity => 1::smallint,
      p_unit_price_cents => 250000,
      p_subtotal_cents => 250000,
      p_tax_rate_basis_points => 1600,
      p_tax_cents => 40000,
      p_buyer_name => 'Ada Lovelace',
      p_email => 'ada@example.com',
      p_phone => '+52 899 123 4567',
      p_language => 'es',
      p_consent_version => '2026-07-30',
      p_consented_at => now(),
      p_retention_until => (now() + interval '5 years')::date,
      p_requires_invoice => true
    )
  $$,
  '22023',
  'invoice_details_required',
  'requesting a CFDI without fiscal data is rejected'
);

select throws_ok(
  $$
    select public.create_ticket_order(
      p_submission_id => '20000000-0000-4000-8000-000000000005'::uuid,
      p_payload_hash => repeat('a', 64),
      p_tier => 'plus',
      p_quantity => 1::smallint,
      p_unit_price_cents => 250000,
      p_subtotal_cents => 250000,
      p_tax_rate_basis_points => 1600,
      p_tax_cents => 40000,
      p_buyer_name => 'Ada Lovelace',
      p_email => 'ada@example.com',
      p_phone => '+52 899 123 4567',
      p_language => 'es',
      p_consent_version => '2026-07-30',
      p_consented_at => now(),
      p_retention_until => (now() + interval '5 years')::date,
      p_requires_invoice => false,
      p_rfc => 'ABC800101XY2'
    )
  $$,
  '22023',
  'invoice_details_not_requested',
  'fiscal data on an order that did not request a CFDI is rejected'
);

-- ---------------------------------------------------------------------------
-- create_ticket_order: happy path, replay and conflict
-- ---------------------------------------------------------------------------

select results_eq(
  $$
    select outcome, total_cents
    from public.create_ticket_order(
      p_submission_id => '20000000-0000-4000-8000-000000000010'::uuid,
      p_payload_hash => repeat('b', 64),
      p_tier => 'plus',
      p_quantity => 2::smallint,
      p_unit_price_cents => 250000,
      p_subtotal_cents => 500000,
      p_tax_rate_basis_points => 1600,
      p_tax_cents => 80000,
      p_buyer_name => 'Ada Lovelace',
      p_email => 'ADA@Example.com',
      p_phone => '+52 899 123 4567',
      p_language => 'es',
      p_consent_version => '2026-07-30',
      p_consented_at => now(),
      p_retention_until => (now() + interval '5 years')::date
    )
  $$,
  $$ values ('created'::text, 580000) $$,
  'a new order is created and totals subtotal plus tax'
);

select is(
  (
    select email
    from public.ticket_orders
    where submission_id = '20000000-0000-4000-8000-000000000010'::uuid
  ),
  'ada@example.com',
  'the buyer email is normalized to lower case'
);

select is(
  (
    select status
    from public.ticket_orders
    where submission_id = '20000000-0000-4000-8000-000000000010'::uuid
  ),
  'pending',
  'a new order starts pending'
);

select results_eq(
  $$
    select outcome, total_cents
    from public.create_ticket_order(
      p_submission_id => '20000000-0000-4000-8000-000000000010'::uuid,
      p_payload_hash => repeat('b', 64),
      p_tier => 'plus',
      p_quantity => 2::smallint,
      p_unit_price_cents => 250000,
      p_subtotal_cents => 500000,
      p_tax_rate_basis_points => 1600,
      p_tax_cents => 80000,
      p_buyer_name => 'Ada Lovelace',
      p_email => 'ada@example.com',
      p_phone => '+52 899 123 4567',
      p_language => 'es',
      p_consent_version => '2026-07-30',
      p_consented_at => now(),
      p_retention_until => (now() + interval '5 years')::date
    )
  $$,
  $$ values ('replayed'::text, 580000) $$,
  'an identical resubmission replays instead of creating a second order'
);

select results_eq(
  $$
    select outcome
    from public.create_ticket_order(
      p_submission_id => '20000000-0000-4000-8000-000000000010'::uuid,
      p_payload_hash => repeat('c', 64),
      p_tier => 'general',
      p_quantity => 1::smallint,
      p_unit_price_cents => 90000,
      p_subtotal_cents => 90000,
      p_tax_rate_basis_points => 1600,
      p_tax_cents => 14400,
      p_buyer_name => 'Ada Lovelace',
      p_email => 'ada@example.com',
      p_phone => '+52 899 123 4567',
      p_language => 'es',
      p_consent_version => '2026-07-30',
      p_consented_at => now(),
      p_retention_until => (now() + interval '5 years')::date
    )
  $$,
  $$ values ('conflict'::text) $$,
  'the same submission id with a different payload conflicts'
);

select is(
  (
    select count(*)::integer
    from public.ticket_orders
    where submission_id = '20000000-0000-4000-8000-000000000010'::uuid
  ),
  1,
  'a conflict never overwrites or duplicates the original order'
);

select is(
  (
    select total_cents
    from public.ticket_orders
    where submission_id = '20000000-0000-4000-8000-000000000010'::uuid
  ),
  580000,
  'the original amount survives the conflicting resubmission'
);

-- ---------------------------------------------------------------------------
-- create_ticket_order: CFDI request
-- ---------------------------------------------------------------------------

select lives_ok(
  $$
    select public.create_ticket_order(
      p_submission_id => '20000000-0000-4000-8000-000000000020'::uuid,
      p_payload_hash => repeat('d', 64),
      p_tier => 'general',
      p_quantity => 1::smallint,
      p_unit_price_cents => 90000,
      p_subtotal_cents => 90000,
      p_tax_rate_basis_points => 1600,
      p_tax_cents => 14400,
      p_buyer_name => 'Grace Hopper',
      p_email => 'grace@example.com',
      p_phone => '+52 899 765 4321',
      p_language => 'en',
      p_consent_version => '2026-07-30',
      p_consented_at => now(),
      p_retention_until => (now() + interval '5 years')::date,
      p_requires_invoice => true,
      p_rfc => 'abc800101xy2',
      p_person_type => 'moral',
      p_legal_name => 'Compilers SA de CV',
      p_tax_regime => '601',
      p_cfdi_use => 'g03',
      p_postal_code => '88680'
    )
  $$,
  'an order requesting a CFDI is accepted with its fiscal data'
);

select results_eq(
  $$
    select d.rfc, d.cfdi_use, o.invoice_status
    from public.ticket_order_invoice_details as d
    join public.ticket_orders as o on o.id = d.order_id
    where o.submission_id = '20000000-0000-4000-8000-000000000020'::uuid
  $$,
  $$ values ('ABC800101XY2'::text, 'G03'::text, 'requested'::text) $$,
  'fiscal identifiers are stored upper cased and the invoice is marked requested'
);

select throws_ok(
  $$
    insert into public.ticket_order_invoice_details (
      order_id, rfc, person_type, legal_name, tax_regime, cfdi_use, postal_code
    )
    select id, 'ABC800101XY2', 'fisica', 'Compilers SA de CV', '601', 'G03', '88680'
    from public.ticket_orders
    where submission_id = '20000000-0000-4000-8000-000000000010'::uuid
  $$,
  '23514',
  null,
  'a 12-character RFC cannot be declared as a persona física'
);

-- ---------------------------------------------------------------------------
-- record_ticket_order_payment: idempotency
-- ---------------------------------------------------------------------------

select results_eq(
  $$
    select order_status, outcome
    from public.record_ticket_order_payment(
      p_order_id => (
        select id from public.ticket_orders
        where submission_id = '20000000-0000-4000-8000-000000000010'::uuid
      ),
      p_payment_id => '1234567890',
      p_status => 'paid',
      p_provider_status => 'approved',
      p_provider_status_detail => 'accredited',
      p_paid_at => now()
    )
  $$,
  $$ values ('paid'::text, 'updated'::text) $$,
  'an approved payment marks the order paid'
);

select results_eq(
  $$
    select order_status, outcome
    from public.record_ticket_order_payment(
      p_order_id => (
        select id from public.ticket_orders
        where submission_id = '20000000-0000-4000-8000-000000000010'::uuid
      ),
      p_payment_id => '1234567890',
      p_status => 'paid',
      p_provider_status => 'approved'
    )
  $$,
  $$ values ('paid'::text, 'duplicate'::text) $$,
  'a duplicate delivery of the same payment is a no-op'
);

select results_eq(
  $$
    select order_status, outcome
    from public.record_ticket_order_payment(
      p_order_id => (
        select id from public.ticket_orders
        where submission_id = '20000000-0000-4000-8000-000000000010'::uuid
      ),
      p_payment_id => '1234567890',
      p_status => 'pending',
      p_provider_status => 'pending'
    )
  $$,
  $$ values ('paid'::text, 'ignored'::text) $$,
  'a late pending notification never un-pays a paid order'
);

select throws_ok(
  $$
    select public.record_ticket_order_payment(
      p_order_id => '20000000-0000-4000-8000-00000000ffff'::uuid,
      p_payment_id => '1234567890',
      p_status => 'paid'
    )
  $$,
  'P0002',
  'ticket_order_not_found',
  'a payment for an unknown order is refused rather than inventing a row'
);

select throws_ok(
  $$
    select public.record_ticket_order_payment(
      p_order_id => (
        select id from public.ticket_orders
        where submission_id = '20000000-0000-4000-8000-000000000020'::uuid
      ),
      p_payment_id => '../../etc/passwd',
      p_status => 'paid'
    )
  $$,
  '22023',
  'invalid_payment_id',
  'a payment id outside the allowed alphabet is refused'
);

select throws_ok(
  $$
    select public.record_ticket_order_payment(
      p_order_id => (
        select id from public.ticket_orders
        where submission_id = '20000000-0000-4000-8000-000000000020'::uuid
      ),
      p_payment_id => '999',
      p_status => 'settled'
    )
  $$,
  '22023',
  'invalid_order_status',
  'an unknown order status is refused'
);

select * from finish();
rollback;
