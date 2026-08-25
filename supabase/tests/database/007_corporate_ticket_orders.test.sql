begin;

create extension if not exists pgtap with schema extensions;
grant usage on schema extensions to service_role;
set local role service_role;
set local search_path = public, extensions, pg_catalog;

select plan(10);

-- ---------------------------------------------------------------------------
-- A corporate block is a paid order with a named roster
-- ---------------------------------------------------------------------------

select lives_ok(
  $$
    select public.create_ticket_order(
      p_submission_id => '30000000-0000-4000-8000-000000000001'::uuid,
      p_payload_hash => repeat('a', 64),
      p_tier => 'corporativo',
      p_quantity => 5::smallint,
      -- 2,500 MXN list, 25% off from the fifth access up.
      p_unit_price_cents => 187500,
      p_subtotal_cents => 808190,
      p_tax_rate_basis_points => 1600,
      p_tax_cents => 129310,
      p_buyer_name => 'Ada Lovelace',
      p_email => 'ada@example.com',
      p_phone => '+52 899 123 4567',
      p_language => 'es',
      p_consent_version => '2026-08-26',
      p_consented_at => now(),
      p_retention_until => (now() + interval '5 years')::date,
      p_company => 'Logística del Norte',
      p_referral_source => 'Cámara de Comercio de Reynosa',
      p_attendees => array[
        'Ada Lovelace',
        'Grace Hopper',
        'Katherine Johnson',
        'Dorothy Vaughan',
        'Mary Jackson'
      ]
    )
  $$,
  'a corporate block is stored with its discounted unit price'
);

select is(
  (
    select total_cents from public.ticket_orders
    where submission_id = '30000000-0000-4000-8000-000000000001'::uuid
  ),
  937500,
  'the block total is the discounted unit times the seats'
);

select is(
  (
    select referral_source from public.ticket_orders
    where submission_id = '30000000-0000-4000-8000-000000000001'::uuid
  ),
  'Cámara de Comercio de Reynosa',
  'the referrer is stored as typed'
);

select is(
  (
    select count(*)::integer from public.ticket_order_attendees as a
    join public.ticket_orders as o on o.id = a.order_id
    where o.submission_id = '30000000-0000-4000-8000-000000000001'::uuid
  ),
  5,
  'the roster names every purchased access'
);

select is(
  (
    select a.full_name from public.ticket_order_attendees as a
    join public.ticket_orders as o on o.id = a.order_id
    where o.submission_id = '30000000-0000-4000-8000-000000000001'::uuid
      and a.seat_number = 3
  ),
  'Katherine Johnson',
  'the roster keeps the order the buyer typed'
);

-- ---------------------------------------------------------------------------
-- Roster guards
-- ---------------------------------------------------------------------------

select throws_ok(
  $$
    select public.create_ticket_order(
      p_submission_id => '30000000-0000-4000-8000-000000000002'::uuid,
      p_payload_hash => repeat('b', 64),
      p_tier => 'corporativo',
      p_quantity => 3::smallint,
      p_unit_price_cents => 250000,
      p_subtotal_cents => 646552,
      p_tax_rate_basis_points => 1600,
      p_tax_cents => 103448,
      p_buyer_name => 'Ada Lovelace',
      p_email => 'ada@example.com',
      p_phone => '+52 899 123 4567',
      p_language => 'es',
      p_consent_version => '2026-08-26',
      p_consented_at => now(),
      p_retention_until => (now() + interval '5 years')::date,
      p_attendees => array['Ada Lovelace', 'Grace Hopper']
    )
  $$,
  '22023',
  'attendees_required',
  'a roster shorter than the block is refused'
);

select throws_ok(
  $$
    select public.create_ticket_order(
      p_submission_id => '30000000-0000-4000-8000-000000000003'::uuid,
      p_payload_hash => repeat('c', 64),
      p_tier => 'plus',
      p_quantity => 2::smallint,
      p_unit_price_cents => 250000,
      p_subtotal_cents => 431034,
      p_tax_rate_basis_points => 1600,
      p_tax_cents => 68966,
      p_buyer_name => 'Ada Lovelace',
      p_email => 'ada@example.com',
      p_phone => '+52 899 123 4567',
      p_language => 'es',
      p_consent_version => '2026-08-26',
      p_consented_at => now(),
      p_retention_until => (now() + interval '5 years')::date,
      p_attendees => array['Ada Lovelace', 'Grace Hopper']
    )
  $$,
  '22023',
  'attendees_not_expected',
  'an individual access cannot carry a roster'
);

-- ---------------------------------------------------------------------------
-- Shape guards
-- ---------------------------------------------------------------------------

select throws_ok(
  $$
    insert into public.ticket_orders (
      submission_id, payload_hash, tier, quantity, unit_price_cents,
      subtotal_cents, tax_cents, buyer_name, email, phone, language,
      consent_version, consented_at, retention_until
    )
    values (
      '30000000-0000-4000-8000-000000000004'::uuid, decode(repeat('d', 64), 'hex'),
      'corporativo', 1::smallint, 250000, 215517, 34483, 'Ada Lovelace',
      'ada@example.com', '+52 899 123 4567', 'es', '2026-08-26', now(),
      (now() + interval '5 years')::date
    )
  $$,
  '23514',
  NULL,
  'a corporate block of one access violates the quantity constraint'
);

select throws_ok(
  $$
    insert into public.ticket_orders (
      submission_id, payload_hash, tier, quantity, unit_price_cents,
      subtotal_cents, tax_cents, buyer_name, email, phone, language,
      consent_version, consented_at, retention_until
    )
    values (
      '30000000-0000-4000-8000-000000000005'::uuid, decode(repeat('e', 64), 'hex'),
      'plus', 11::smallint, 250000, 2370690, 379310, 'Ada Lovelace',
      'ada@example.com', '+52 899 123 4567', 'es', '2026-08-26', now(),
      (now() + interval '5 years')::date
    )
  $$,
  '23514',
  NULL,
  'an individual access still tops out at ten'
);

select ok(
  not public.is_safe_ticket_order_event_metadata(
    jsonb_build_object('referral_source', 'Cámara de Comercio')
  ),
  'buyer-supplied referral text can never reach an order event'
);

select * from finish();
rollback;
