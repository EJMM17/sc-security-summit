begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;

select plan(16);

select ok(
  to_regclass('public.ticket_orders') is not null,
  'ticket_orders table exists'
);
select ok(
  to_regclass('public.ticket_order_invoice_details') is not null,
  'ticket_order_invoice_details table exists'
);
select ok(
  to_regclass('public.ticket_order_events') is not null,
  'ticket_order_events table exists'
);

select ok(
  (
    select bool_and(c.relrowsecurity)
    from pg_class as c
    join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'ticket_orders',
        'ticket_order_invoice_details',
        'ticket_order_events'
      )
  ),
  'RLS is enabled on every ticket order table'
);

-- No policy exists on purpose: every access path is the server-side secret
-- key. A policy appearing here would mean a browser-facing role gained a way
-- in.
select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'ticket_orders',
        'ticket_order_invoice_details',
        'ticket_order_events'
      )
  ),
  0,
  'no RLS policy grants a non-service role access to ticket orders'
);

select ok(
  not exists (
    select 1
    from unnest(array['anon', 'authenticated', 'public']) as role_name
    cross join unnest(array[
      'public.ticket_orders',
      'public.ticket_order_invoice_details',
      'public.ticket_order_events'
    ]) as table_name
    cross join unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) as privilege
    where has_table_privilege(role_name, table_name, privilege)
  ),
  'anon, authenticated and public hold no privilege on any ticket order table'
);

select ok(
  has_table_privilege('service_role', 'public.ticket_orders', 'SELECT')
  and has_table_privilege('service_role', 'public.ticket_orders', 'INSERT')
  and has_table_privilege('service_role', 'public.ticket_orders', 'UPDATE')
  and not has_table_privilege('service_role', 'public.ticket_orders', 'DELETE'),
  'service_role can read and write ticket orders but never delete them'
);

select ok(
  has_table_privilege('service_role', 'public.ticket_order_events', 'INSERT')
  and not has_table_privilege(
    'service_role',
    'public.ticket_order_events',
    'UPDATE'
  )
  and not has_table_privilege(
    'service_role',
    'public.ticket_order_events',
    'DELETE'
  ),
  'the ticket order event log is append-only'
);

select ok(
  not has_sequence_privilege(
    'anon',
    'public.ticket_order_events_id_seq',
    'USAGE'
  )
  and not has_sequence_privilege(
    'authenticated',
    'public.ticket_order_events_id_seq',
    'USAGE'
  )
  and has_sequence_privilege(
    'service_role',
    'public.ticket_order_events_id_seq',
    'USAGE'
  ),
  'the ticket order event sequence is least-privilege'
);

select ok(
  not exists (
    select 1
    from unnest(array['anon', 'authenticated', 'public']) as role_name
    cross join unnest(array[
      'public.create_ticket_order(uuid, text, text, smallint, integer, integer, integer, integer, text, text, text, text, text, timestamptz, date, boolean, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, timestamptz, timestamptz)',
      'public.attach_ticket_order_preference(uuid, text)',
      'public.record_ticket_order_payment(uuid, text, text, text, text, timestamptz)'
    ]) as function_signature
    where has_function_privilege(role_name, function_signature, 'EXECUTE')
  ),
  'no browser-facing role can execute a ticket order RPC'
);

-- Every function must pin an empty search_path so a hostile schema on the
-- caller's path cannot shadow a referenced object.
select ok(
  (
    select bool_and(p.proconfig @> array['search_path='])
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'create_ticket_order',
        'attach_ticket_order_preference',
        'record_ticket_order_payment',
        'is_safe_ticket_order_event_metadata',
        'touch_ticket_order_updated_at'
      )
  ),
  'every ticket order function pins an empty search_path'
);

select ok(
  not exists (
    select 1
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and p.proname in (
        'create_ticket_order',
        'attach_ticket_order_preference',
        'record_ticket_order_payment'
      )
  ),
  'no ticket order RPC is SECURITY DEFINER'
);

select ok(
  exists (
    select 1
    from pg_attribute as a
    where a.attrelid = 'public.ticket_orders'::regclass
      and a.attname = 'total_cents'
      and a.attgenerated = 's'
  ),
  'total_cents is a stored generated column and cannot drift from its parts'
);

select is(
  (
    select count(*)::integer
    from pg_trigger as t
    where not t.tgisinternal
      and t.tgname in (
        'ticket_orders_touch_updated_at',
        'ticket_order_invoice_details_touch_updated_at'
      )
  ),
  2,
  'both ticket order updated_at triggers exist exactly once'
);

select ok(
  (
    select confdeltype = 'c'
    from pg_constraint
    where conrelid = 'public.ticket_order_invoice_details'::regclass
      and contype = 'f'
  ),
  'deleting an order removes its fiscal data'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'ticket_orders'
      and indexdef ilike '%provider%provider_payment_id%'
  ),
  'a payment id can only ever be attached to one order'
);

select * from finish();
rollback;
