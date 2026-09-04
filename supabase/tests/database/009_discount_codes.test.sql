begin;

create extension if not exists pgtap with schema extensions;
grant usage on schema extensions to service_role;
set local role service_role;
set local search_path = public, extensions, pg_catalog;

select plan(27);

-- ---------------------------------------------------------------------------
-- The convenios that shipped with the migration
-- ---------------------------------------------------------------------------

select is(
  (
    select count(*)::integer from public.coupons
    where code in ('UVB2026', 'IIIES2026', 'PVILLAFLORIDA2026', 'CANACAR2026')
      and discount_type = 'percentage'
      and discount_basis_points = 2000
      and active
  ),
  4,
  'the four seeded codes are active percentage coupons at 20%'
);

-- 20260904185529 adds AAARAC at a different rate, so the rate is per coupon
-- and not a property of "being a convenio".
select is(
  (
    select discount_basis_points from public.coupons
    where code = 'AAARAC2026' and discount_type = 'percentage' and active
  ),
  2500,
  'AAARAC2026 is an active percentage coupon at 25%'
);

-- The coupon constraints are exercised as the owning role: service_role can
-- only read this table, which is itself asserted at the end of this file.
reset role;

select throws_ok(
  $$
    insert into public.coupons (code, discount_type, discount_basis_points)
    values ('uvb2026', 'percentage', 2000)
  $$,
  '23514',
  NULL,
  'a code is stored normalized or not at all'
);

select throws_ok(
  $$
    insert into public.coupons (code, discount_type, discount_basis_points)
    values ('UVB2026', 'percentage', 2000)
  $$,
  '23505',
  NULL,
  'a code is unique'
);

select throws_ok(
  $$
    insert into public.coupons (
      code, discount_type, discount_basis_points, discount_amount_cents
    )
    values ('BOTH2026', 'percentage', 2000, 5000)
  $$,
  '23514',
  NULL,
  'a coupon can never carry both a rate and a fixed amount'
);

set local role service_role;

-- ---------------------------------------------------------------------------
-- An order that used a code
-- ---------------------------------------------------------------------------

select lives_ok(
  $$
    select public.create_ticket_order(
      p_submission_id => '40000000-0000-4000-8000-000000000001'::uuid,
      p_payload_hash => repeat('a', 64),
      p_tier => 'plus',
      p_quantity => 2::smallint,
      -- 2,500 MXN list, 20% off: 2,000 MXN per access, IVA inside.
      p_unit_price_cents => 200000,
      p_subtotal_cents => 344828,
      p_tax_rate_basis_points => 1600,
      p_tax_cents => 55172,
      p_buyer_name => 'Ada Lovelace',
      p_email => 'Ada@Example.com',
      p_phone => '+52 899 123 4567',
      p_language => 'es',
      p_consent_version => '2026-08-26',
      p_consented_at => now(),
      p_retention_until => (now() + interval '5 years')::date,
      p_coupon_id => (select id from public.coupons where code = 'UVB2026'),
      p_coupon_code => 'UVB2026',
      p_coupon_discount_type => 'percentage',
      p_coupon_discount_basis_points => 2000,
      p_coupon_list_unit_price_cents => 250000,
      p_coupon_discount_cents => 100000
    )
  $$,
  'an order stores the code that produced its price'
);

select is(
  (
    select total_cents from public.ticket_orders
    where submission_id = '40000000-0000-4000-8000-000000000001'::uuid
  ),
  400000,
  'the order total is the discounted unit times the quantity'
);

select is(
  (
    select coupon_code from public.ticket_orders
    where submission_id = '40000000-0000-4000-8000-000000000001'::uuid
  ),
  'UVB2026',
  'the convenio is readable straight off the order'
);

select is(
  (
    select u.status from public.coupon_uses as u
    join public.ticket_orders as o on o.id = u.order_id
    where o.submission_id = '40000000-0000-4000-8000-000000000001'::uuid
  ),
  'reserved',
  'the use is reserved while the order is only pending'
);

select is(
  (
    select u.customer_key from public.coupon_uses as u
    join public.ticket_orders as o on o.id = u.order_id
    where o.submission_id = '40000000-0000-4000-8000-000000000001'::uuid
  ),
  encode(sha256(convert_to('ada@example.com', 'UTF8')), 'hex'),
  'the customer is counted by a pseudonym, never by an address'
);

select is(
  (
    select count(*)::integer from public.ticket_order_events as e
    join public.ticket_orders as o on o.id = e.order_id
    where o.submission_id = '40000000-0000-4000-8000-000000000001'::uuid
      and e.event_type = 'coupon_applied'
      and e.metadata->>'coupon_code' = 'UVB2026'
  ),
  1,
  'applying a code is recorded as an event carrying only the code'
);

-- ---------------------------------------------------------------------------
-- The amounts must agree with what is charged
-- ---------------------------------------------------------------------------

select throws_ok(
  $$
    select public.create_ticket_order(
      p_submission_id => '40000000-0000-4000-8000-000000000002'::uuid,
      p_payload_hash => repeat('b', 64),
      p_tier => 'plus',
      p_quantity => 2::smallint,
      p_unit_price_cents => 200000,
      p_subtotal_cents => 344828,
      p_tax_rate_basis_points => 1600,
      p_tax_cents => 55172,
      p_buyer_name => 'Ada Lovelace',
      p_email => 'ada@example.com',
      p_phone => '+52 899 123 4567',
      p_language => 'es',
      p_consent_version => '2026-08-26',
      p_consented_at => now(),
      p_retention_until => (now() + interval '5 years')::date,
      p_coupon_id => (select id from public.coupons where code = 'UVB2026'),
      p_coupon_code => 'UVB2026',
      p_coupon_discount_type => 'percentage',
      p_coupon_discount_basis_points => 2000,
      p_coupon_list_unit_price_cents => 250000,
      -- Claims a discount twice the one the charged unit reflects.
      p_coupon_discount_cents => 200000
    )
  $$,
  '22023',
  NULL,
  'a claimed discount that does not match the charged unit is refused'
);

select throws_ok(
  $$
    select public.create_ticket_order(
      p_submission_id => '40000000-0000-4000-8000-000000000003'::uuid,
      p_payload_hash => repeat('c', 64),
      p_tier => 'plus',
      p_quantity => 1::smallint,
      p_unit_price_cents => 250000,
      p_subtotal_cents => 215517,
      p_tax_rate_basis_points => 1600,
      p_tax_cents => 34483,
      p_buyer_name => 'Ada Lovelace',
      p_email => 'ada@example.com',
      p_phone => '+52 899 123 4567',
      p_language => 'es',
      p_consent_version => '2026-08-26',
      p_consented_at => now(),
      p_retention_until => (now() + interval '5 years')::date,
      -- A code with no coupon behind it.
      p_coupon_code => 'UVB2026',
      p_coupon_discount_cents => 50000
    )
  $$,
  '22023',
  NULL,
  'a discount without a coupon id is refused'
);

-- ---------------------------------------------------------------------------
-- A coupon that stopped applying
-- ---------------------------------------------------------------------------

-- Coupons are managed in Studio, not by the application: service_role can read
-- them and nothing else, so the fixtures are created as the owning role.
reset role;
insert into public.coupons (code, discount_type, discount_basis_points, active)
values ('RETIRED2026', 'percentage', 2000, false);
set local role service_role;

select is(
  (
    select outcome from public.create_ticket_order(
      p_submission_id => '40000000-0000-4000-8000-000000000004'::uuid,
      p_payload_hash => repeat('d', 64),
      p_tier => 'plus',
      p_quantity => 1::smallint,
      p_unit_price_cents => 200000,
      p_subtotal_cents => 172414,
      p_tax_rate_basis_points => 1600,
      p_tax_cents => 27586,
      p_buyer_name => 'Ada Lovelace',
      p_email => 'ada@example.com',
      p_phone => '+52 899 123 4567',
      p_language => 'es',
      p_consent_version => '2026-08-26',
      p_consented_at => now(),
      p_retention_until => (now() + interval '5 years')::date,
      p_coupon_id => (select id from public.coupons where code = 'RETIRED2026'),
      p_coupon_code => 'RETIRED2026',
      p_coupon_discount_type => 'percentage',
      p_coupon_discount_basis_points => 2000,
      p_coupon_list_unit_price_cents => 250000,
      p_coupon_discount_cents => 50000
    )
  ),
  'coupon_unavailable',
  'a deactivated coupon stores no order at the discounted price'
);

select is(
  (
    select count(*)::integer from public.ticket_orders
    where submission_id = '40000000-0000-4000-8000-000000000004'::uuid
  ),
  0,
  'nothing is written when the coupon is refused'
);

reset role;
insert into public.coupons (code, discount_type, discount_basis_points, max_uses)
values ('ONESHOT2026', 'percentage', 2000, 1);
set local role service_role;

select is(
  (
    select outcome from public.create_ticket_order(
      p_submission_id => '40000000-0000-4000-8000-000000000005'::uuid,
      p_payload_hash => repeat('e', 64),
      p_tier => 'plus',
      p_quantity => 1::smallint,
      p_unit_price_cents => 200000,
      p_subtotal_cents => 172414,
      p_tax_rate_basis_points => 1600,
      p_tax_cents => 27586,
      p_buyer_name => 'Ada Lovelace',
      p_email => 'ada@example.com',
      p_phone => '+52 899 123 4567',
      p_language => 'es',
      p_consent_version => '2026-08-26',
      p_consented_at => now(),
      p_retention_until => (now() + interval '5 years')::date,
      p_coupon_id => (select id from public.coupons where code = 'ONESHOT2026'),
      p_coupon_code => 'ONESHOT2026',
      p_coupon_discount_type => 'percentage',
      p_coupon_discount_basis_points => 2000,
      p_coupon_list_unit_price_cents => 250000,
      p_coupon_discount_cents => 50000
    )
  ),
  'created',
  'the single use of a limited coupon is granted'
);

select is(
  (
    select outcome from public.create_ticket_order(
      p_submission_id => '40000000-0000-4000-8000-000000000006'::uuid,
      p_payload_hash => repeat('f', 64),
      p_tier => 'plus',
      p_quantity => 1::smallint,
      p_unit_price_cents => 200000,
      p_subtotal_cents => 172414,
      p_tax_rate_basis_points => 1600,
      p_tax_cents => 27586,
      p_buyer_name => 'Grace Hopper',
      p_email => 'grace@example.com',
      p_phone => '+52 899 123 4567',
      p_language => 'es',
      p_consent_version => '2026-08-26',
      p_consented_at => now(),
      p_retention_until => (now() + interval '5 years')::date,
      p_coupon_id => (select id from public.coupons where code = 'ONESHOT2026'),
      p_coupon_code => 'ONESHOT2026',
      p_coupon_discount_type => 'percentage',
      p_coupon_discount_basis_points => 2000,
      p_coupon_list_unit_price_cents => 250000,
      p_coupon_discount_cents => 50000
    )
  ),
  'coupon_unavailable',
  'the second use of a one-use coupon is refused'
);

-- ---------------------------------------------------------------------------
-- The use follows the order status
-- ---------------------------------------------------------------------------

select is(
  (
    select order_status from public.record_ticket_order_payment(
      p_order_id => (
        select id from public.ticket_orders
        where submission_id = '40000000-0000-4000-8000-000000000001'::uuid
      ),
      p_payment_id => 'mp-1',
      p_status => 'paid',
      p_provider_status => 'approved',
      p_paid_at => now(),
      p_paid_amount_cents => 400000
    )
  ),
  'paid',
  'a payment for exactly the stored total is accepted'
);

select is(
  (
    select u.status from public.coupon_uses as u
    join public.ticket_orders as o on o.id = u.order_id
    where o.submission_id = '40000000-0000-4000-8000-000000000001'::uuid
  ),
  'used',
  'paying the order confirms the use of the code'
);

-- ---------------------------------------------------------------------------
-- An order is only ever paid for its own total
-- ---------------------------------------------------------------------------

select is(
  (
    select outcome from public.record_ticket_order_payment(
      p_order_id => (
        select id from public.ticket_orders
        where submission_id = '40000000-0000-4000-8000-000000000005'::uuid
      ),
      p_payment_id => 'mp-2',
      p_status => 'paid',
      p_provider_status => 'approved',
      p_paid_at => now(),
      -- One peso for a two-thousand-peso access.
      p_paid_amount_cents => 100
    )
  ),
  'ignored',
  'a settlement for the wrong amount never marks an order paid'
);

select is(
  (
    select status from public.ticket_orders
    where submission_id = '40000000-0000-4000-8000-000000000005'::uuid
  ),
  'pending',
  'the underpaid order stays pending for Operations to resolve'
);

select is(
  (
    select count(*)::integer from public.ticket_order_events as e
    join public.ticket_orders as o on o.id = e.order_id
    where o.submission_id = '40000000-0000-4000-8000-000000000005'::uuid
      and e.event_type = 'payment_amount_mismatch'
  ),
  1,
  'the mismatch is recorded where Operations will see it'
);

select is(
  (
    select order_status from public.record_ticket_order_payment(
      p_order_id => (
        select id from public.ticket_orders
        where submission_id = '40000000-0000-4000-8000-000000000005'::uuid
      ),
      p_payment_id => 'mp-3',
      p_status => 'cancelled',
      p_provider_status => 'expired'
    )
  ),
  'cancelled',
  'a cancelled order is still recorded'
);

select is(
  (
    select u.status from public.coupon_uses as u
    join public.ticket_orders as o on o.id = u.order_id
    where o.submission_id = '40000000-0000-4000-8000-000000000005'::uuid
  ),
  'released',
  'an order that will never be paid gives the use back'
);

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------

reset role;

select ok(
  not has_table_privilege('anon', 'public.coupons', 'select')
    and not has_table_privilege('authenticated', 'public.coupons', 'select'),
  'a leaked browser key is never a list of valid discount codes'
);

select ok(
  not has_table_privilege('anon', 'public.coupon_uses', 'select')
    and not has_table_privilege('anon', 'public.coupon_uses', 'insert')
    and not has_table_privilege('authenticated', 'public.coupon_uses', 'select'),
  'coupon uses are invisible to anon and authenticated'
);

select ok(
  (
    select bool_and(c.relrowsecurity)
    from pg_catalog.pg_class as c
    join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname in ('coupons', 'coupon_uses')
  ),
  'row level security is enabled on both new tables'
);

select * from finish();
rollback;
