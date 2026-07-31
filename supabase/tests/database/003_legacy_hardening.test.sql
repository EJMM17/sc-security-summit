begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;

select plan(14);

select ok(
  (
    select bool_and(c.relrowsecurity)
    from pg_class as c
    join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'registros',
        'admins',
        'app_config',
        'app_secrets',
        'audit_log',
        'email_events'
      )
  ),
  'RLS remains enabled on every legacy table'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'registros',
        'admins',
        'app_config',
        'app_secrets',
        'audit_log',
        'email_events'
      )
  ),
  0,
  'redundant legacy RLS policies are removed'
);

select ok(
  not exists (
    select 1
    from (
      values
        ('registros'),
        ('admins'),
        ('app_config'),
        ('app_secrets'),
        ('audit_log'),
        ('email_events'),
        ('admin_registros_view')
    ) as relations(relation_name)
    cross join (
      values
        ('SELECT'),
        ('INSERT'),
        ('UPDATE'),
        ('DELETE'),
        ('TRUNCATE'),
        ('REFERENCES'),
        ('TRIGGER')
    ) as privileges(privilege_name)
    where has_table_privilege(
      'anon',
      format('public.%I', relations.relation_name),
      privileges.privilege_name
    )
  ),
  'anon has no legacy table or view privilege, including TRUNCATE'
);

select ok(
  not exists (
    select 1
    from (
      values
        ('registros'),
        ('admins'),
        ('app_config'),
        ('app_secrets'),
        ('audit_log'),
        ('email_events'),
        ('admin_registros_view')
    ) as relations(relation_name)
    cross join (
      values
        ('SELECT'),
        ('INSERT'),
        ('UPDATE'),
        ('DELETE'),
        ('TRUNCATE'),
        ('REFERENCES'),
        ('TRIGGER')
    ) as privileges(privilege_name)
    where has_table_privilege(
      'authenticated',
      format('public.%I', relations.relation_name),
      privileges.privilege_name
    )
  ),
  'authenticated has no legacy table or view privilege'
);

select ok(
  not exists (
    select 1
    from (
      values
        ('registros'),
        ('admins'),
        ('app_config'),
        ('app_secrets'),
        ('audit_log'),
        ('email_events'),
        ('admin_registros_view')
    ) as relations(relation_name)
    cross join (
      values
        ('SELECT'),
        ('INSERT'),
        ('UPDATE'),
        ('DELETE'),
        ('TRUNCATE'),
        ('REFERENCES'),
        ('TRIGGER')
    ) as privileges(privilege_name)
    where has_table_privilege(
      'service_role',
      format('public.%I', relations.relation_name),
      privileges.privilege_name
    )
  ),
  'service_role has no dependency on retired relations'
);

select ok(
  not exists (
    select 1
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and has_function_privilege('anon', p.oid, 'EXECUTE')
  ),
  'anon cannot execute any public RPC'
);

select ok(
  not exists (
    select 1
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and has_function_privilege('authenticated', p.oid, 'EXECUTE')
  ),
  'authenticated cannot execute any public RPC'
);

select ok(
  not exists (
    select 1
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'get_cupos_disponibles',
        'set_updated_at',
        'update_updated_at_column',
        'notify_new_registro'
      )
      and has_function_privilege('service_role', p.oid, 'EXECUTE')
  ),
  'service_role cannot execute retired functions'
);

select ok(
  (
    select 'security_invoker=true' = any(coalesce(c.reloptions, '{}'::text[]))
    from pg_class as c
    where c.oid = 'public.admin_registros_view'::regclass
  ),
  'legacy admin view uses caller privileges'
);

select ok(
  to_regprocedure('public.notify_new_registro()') is null,
  'legacy webhook function is removed'
);

select ok(
  not exists (
    select 1
    from pg_trigger as t
    where not t.tgisinternal
      and t.tgname = 'trg_send_confirmation_email'
      and t.tgrelid = 'public.registros'::regclass
  ),
  'legacy webhook trigger is removed'
);

select ok(
  not exists (
    select 1
    from pg_extension
    where extname = 'pg_net'
  ),
  'pg_net is not installed'
);

select ok(
  (
    select count(*) = 1
      and bool_and(t.tgname = 'trg_registros_updated_at')
    from pg_trigger as t
    where not t.tgisinternal
      and t.tgrelid = 'public.registros'::regclass
  ),
  'only the known updated_at trigger remains on registros'
);

select ok(
  (
    select bool_and(
      has_table_privilege(
        'postgres',
        format('public.%I', relations.relation_name),
        'SELECT'
      )
    )
    from (
      values
        ('registros'),
        ('admins'),
        ('app_config'),
        ('app_secrets'),
        ('audit_log'),
        ('email_events'),
        ('admin_registros_view')
    ) as relations(relation_name)
  ),
  'postgres retains the controlled Studio read path'
);

select * from finish();
rollback;
