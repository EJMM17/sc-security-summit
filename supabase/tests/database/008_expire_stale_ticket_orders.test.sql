begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;

select plan(12);

-- ---------------------------------------------------------------------------
-- Four orders: abandoned, still inside the checkout window, already answered
-- by the provider, and already paid.
-- ---------------------------------------------------------------------------

select public.create_ticket_order(
  p_submission_id => ('50000000-0000-4000-8000-00000000000' || g)::uuid,
  p_payload_hash => repeat(chr(97 + g), 64),
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
  p_retention_until => (now() + interval '5 years')::date
)
from generate_series(1, 4) as g;

create temp table sample as
  select
    row_number() over (order by o.submission_id) as n,
    o.id
  from public.ticket_orders as o;

update public.ticket_orders
set created_at = now() - interval '3 hours'
where id in (select id from sample where n in (1, 3, 4));

update public.ticket_orders
set provider_payment_id = 'mp-already-answered'
where id = (select id from sample where n = 3);

update public.ticket_orders
set status = 'paid', paid_at = now(), provider_payment_id = 'mp-paid'
where id = (select id from sample where n = 4);

-- ---------------------------------------------------------------------------
-- One run
-- ---------------------------------------------------------------------------

-- The sweep names the orders MercadoPago answered about; here every pending
-- one is offered, so the function's own guards are what must hold.
create temp table expired as
  select * from public.expire_stale_ticket_orders(
    (select array_agg(id) from sample)
  );

select is(
  (select count(*)::integer from expired),
  1,
  'only the abandoned order is expired'
);

select is(
  (select order_id from expired),
  (select id from sample where n = 1),
  'the expired order is the old one with no payment'
);

select is(
  (select status from public.ticket_orders where id = (select id from sample where n = 1)),
  'cancelled',
  'an abandoned checkout becomes cancelled'
);

select is(
  (select provider_status from public.ticket_orders where id = (select id from sample where n = 1)),
  'expired',
  'expiry is distinguishable from a cancellation the buyer made'
);

select is(
  (select status from public.ticket_orders where id = (select id from sample where n = 2)),
  'pending',
  'an order still inside the checkout window is untouched'
);

select is(
  (select status from public.ticket_orders where id = (select id from sample where n = 3)),
  'pending',
  'an order carrying a provider payment id is never expired'
);

select is(
  (select status from public.ticket_orders where id = (select id from sample where n = 4)),
  'paid',
  'a paid order is never expired'
);

select is(
  (
    select count(*)::integer
    from public.ticket_order_events
    where event_type = 'order_expired'
      and order_id = (select id from sample where n = 1)
  ),
  1,
  'expiry appends exactly one event'
);

select is(
  (
    select count(*)::integer
    from public.expire_stale_ticket_orders(
      (select array_agg(id) from sample)
    )
  ),
  0,
  'a second run has nothing left to expire'
);

select is(
  (
    select count(*)::integer
    from public.expire_stale_ticket_orders(array[]::uuid[])
  ),
  0,
  'naming no order expires nothing'
);

-- ---------------------------------------------------------------------------
-- The floor protects a checkout that is still open
-- ---------------------------------------------------------------------------

update public.ticket_orders
set status = 'pending',
    provider_status = null,
    created_at = now() - interval '20 minutes'
where id = (select id from sample where n = 1);

select is(
  (
    select count(*)::integer
    from public.expire_stale_ticket_orders(
      (select array_agg(id) from sample),
      1
    )
  ),
  0,
  'an expiry shorter than the preference window is clamped, not obeyed'
);

-- ---------------------------------------------------------------------------
-- A late payment still wins
-- ---------------------------------------------------------------------------

update public.ticket_orders
set status = 'cancelled',
    provider_status = 'expired',
    created_at = now() - interval '3 hours'
where id = (select id from sample where n = 1);

select public.record_ticket_order_payment(
  (select id from sample where n = 1),
  'mp-late-arrival',
  'paid',
  'approved',
  null,
  now()
);

select is(
  (select status from public.ticket_orders where id = (select id from sample where n = 1)),
  'paid',
  'a payment arriving after expiry still marks the order paid'
);

select * from finish();
rollback;
