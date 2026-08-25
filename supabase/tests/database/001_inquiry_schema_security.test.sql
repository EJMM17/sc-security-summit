begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;

select plan(26);

select ok(
  to_regclass('public.inquiries') is not null,
  'inquiries table exists'
);
select ok(
  to_regclass('public.inquiry_notifications') is not null,
  'inquiry_notifications table exists'
);
select ok(
  to_regclass('public.inquiry_notification_attempts') is not null,
  'inquiry_notification_attempts table exists'
);
select ok(
  to_regclass('public.inquiry_events') is not null,
  'inquiry_events table exists'
);
select ok(
  to_regclass('public.inquiry_attendees') is not null,
  'inquiry_attendees table exists'
);

select ok(
  (
    select bool_and(c.relrowsecurity)
    from pg_class as c
    join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'inquiries',
        'inquiry_notifications',
        'inquiry_notification_attempts',
        'inquiry_events',
        'inquiry_attendees'
      )
  ),
  'RLS is enabled on every inquiry table'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'inquiries',
        'inquiry_notifications',
        'inquiry_notification_attempts',
        'inquiry_events',
        'inquiry_attendees'
      )
  ),
  0,
  'no public RLS policy exists'
);

select ok(
  not exists (
    select 1
    from (
      values
        ('inquiries'),
        ('inquiry_notifications'),
        ('inquiry_notification_attempts'),
        ('inquiry_events'),
        ('inquiry_attendees')
    ) as tables(table_name)
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
      format('public.%I', tables.table_name),
      privileges.privilege_name
    )
  ),
  'anon has no table privilege'
);

select ok(
  not exists (
    select 1
    from (
      values
        ('inquiries'),
        ('inquiry_notifications'),
        ('inquiry_notification_attempts'),
        ('inquiry_events'),
        ('inquiry_attendees')
    ) as tables(table_name)
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
      format('public.%I', tables.table_name),
      privileges.privilege_name
    )
  ),
  'authenticated has no table privilege'
);

select ok(
  (
    select bool_and(
      has_table_privilege(
        'service_role',
        format('public.%I', tables.table_name),
        'SELECT'
      )
      and has_table_privilege(
        'service_role',
        format('public.%I', tables.table_name),
        'INSERT'
      )
    )
    from (
      values
        ('inquiries'),
        ('inquiry_notifications'),
        ('inquiry_notification_attempts'),
        ('inquiry_events'),
        ('inquiry_attendees')
    ) as tables(table_name)
  ),
  'service_role has only the required read and insert foundation'
);

select ok(
  has_table_privilege('service_role', 'public.inquiries', 'UPDATE')
  and has_table_privilege(
    'service_role',
    'public.inquiry_notifications',
    'UPDATE'
  )
  and not has_table_privilege(
    'service_role',
    'public.inquiry_notification_attempts',
    'UPDATE'
  )
  and not has_table_privilege(
    'service_role',
    'public.inquiry_events',
    'UPDATE'
  )
  -- A roster is submitted evidence: the panel reads it, nothing rewrites it.
  and not has_table_privilege(
    'service_role',
    'public.inquiry_attendees',
    'UPDATE'
  ),
  'only mutable inquiry and outbox tables allow application updates'
);

select ok(
  not exists (
    select 1
    from (
      values
        ('inquiries'),
        ('inquiry_notifications'),
        ('inquiry_notification_attempts'),
        ('inquiry_events'),
        ('inquiry_attendees')
    ) as tables(table_name)
    cross join (
      values
        ('DELETE'),
        ('TRUNCATE'),
        ('REFERENCES'),
        ('TRIGGER')
    ) as privileges(privilege_name)
    where has_table_privilege(
      'service_role',
      format('public.%I', tables.table_name),
      privileges.privilege_name
    )
  ),
  'service_role has no destructive or schema-level table privilege'
);

select ok(
  (
    select count(*) = 4
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'create_inquiry',
        'claim_inquiry_notification',
        'claim_inquiry_notifications',
        'complete_inquiry_notification'
      )
      and has_function_privilege('service_role', p.oid, 'EXECUTE')
  ),
  'service_role can execute all four application RPCs'
);

select ok(
  not exists (
    select 1
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'is_safe_inquiry_event_metadata',
        'enqueue_inquiry_notification',
        'audit_inquiry_changes',
        'create_inquiry',
        'claim_inquiry_notification',
        'claim_inquiry_notifications',
        'complete_inquiry_notification'
      )
      and has_function_privilege('anon', p.oid, 'EXECUTE')
  ),
  'anon cannot execute inquiry functions'
);

select ok(
  not exists (
    select 1
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'is_safe_inquiry_event_metadata',
        'enqueue_inquiry_notification',
        'audit_inquiry_changes',
        'create_inquiry',
        'claim_inquiry_notification',
        'claim_inquiry_notifications',
        'complete_inquiry_notification'
      )
      and has_function_privilege('authenticated', p.oid, 'EXECUTE')
  ),
  'authenticated cannot execute inquiry functions'
);

select ok(
  not exists (
    select 1
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'is_safe_inquiry_event_metadata',
        'enqueue_inquiry_notification',
        'audit_inquiry_changes',
        'create_inquiry',
        'claim_inquiry_notification',
        'claim_inquiry_notifications',
        'complete_inquiry_notification'
      )
      and p.prosecdef
  ),
  'all inquiry functions are SECURITY INVOKER'
);

select ok(
  not exists (
    select 1
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'is_safe_inquiry_event_metadata',
        'enqueue_inquiry_notification',
        'audit_inquiry_changes',
        'create_inquiry',
        'claim_inquiry_notification',
        'claim_inquiry_notifications',
        'complete_inquiry_notification'
      )
      and (
        p.proconfig is null
        or array_to_string(p.proconfig, ',') not like '%search_path=%'
        or array_to_string(p.proconfig, ',') like '%public%'
      )
  ),
  'all inquiry functions pin an empty search_path'
);

select is(
  (
    select count(*)::integer
    from pg_indexes
    where schemaname = 'public'
      and indexname in (
        'inquiries_status_created_at_idx',
        'inquiries_kind_status_created_at_idx',
        'inquiries_next_follow_up_at_idx',
        'inquiries_retention_until_idx',
        'inquiry_notifications_ready_idx',
        'inquiry_notifications_processing_idx',
        'inquiry_notification_attempts_notification_id_idx',
        'inquiry_events_inquiry_id_idx'
      )
  ),
  8,
  'all operational and foreign-key indexes exist'
);

select is(
  (
    select count(*)::integer
    from pg_constraint as c
    join pg_namespace as n on n.oid = c.connamespace
    where n.nspname = 'public'
      and c.contype = 'f'
      and c.conrelid in (
        'public.inquiry_notifications'::regclass,
        'public.inquiry_notification_attempts'::regclass,
        'public.inquiry_events'::regclass
      )
  ),
  3,
  'all three inquiry foreign keys exist'
);

select ok(
  not exists (
    select 1
    from pg_constraint as c
    where c.contype = 'f'
      and c.conrelid in (
        'public.inquiry_notifications'::regclass,
        'public.inquiry_notification_attempts'::regclass,
        'public.inquiry_events'::regclass
      )
      and not exists (
        select 1
        from pg_index as i
        where i.indrelid = c.conrelid
          and i.indisvalid
          and i.indkey[0] = c.conkey[1]
      )
  ),
  'every inquiry foreign key is indexed as the leading column'
);

select is(
  (
    select count(*)::integer
    from pg_constraint
    where conname in (
      'inquiries_payload_hash_length_check',
      'inquiries_discriminated_payload_check',
      'inquiries_attribution_order_check',
      'inquiry_notifications_state_check',
      'inquiry_notification_attempts_result_shape_check',
      'inquiry_events_metadata_check'
    )
  ),
  6,
  'critical data-integrity checks exist'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.inquiries'::regclass
      and conname = 'inquiries_submission_id_key'
      and contype = 'u'
  ),
  'submission_id has a database-enforced unique constraint'
);

select ok(
  (
    select a.atttypid = 'bytea'::regtype
    from pg_attribute as a
    where a.attrelid = 'public.inquiries'::regclass
      and a.attname = 'payload_hash'
      and not a.attisdropped
  ),
  'payload_hash is stored as bytea'
);

select ok(
  (
    select count(*) = 2
    from pg_attribute as a
    where a.attrelid in (
        'public.inquiry_notification_attempts'::regclass,
        'public.inquiry_events'::regclass
      )
      and a.attname = 'id'
      and a.attidentity = 'a'
  ),
  'append-only tables use generated-always identity keys'
);

select ok(
  has_sequence_privilege(
    'service_role',
    'public.inquiry_notification_attempts_id_seq',
    'USAGE'
  )
  and has_sequence_privilege(
    'service_role',
    'public.inquiry_events_id_seq',
    'USAGE'
  )
  and not has_sequence_privilege(
    'anon',
    'public.inquiry_notification_attempts_id_seq',
    'USAGE'
  )
  and not has_sequence_privilege(
    'authenticated',
    'public.inquiry_events_id_seq',
    'USAGE'
  ),
  'identity sequence privileges are least-privilege'
);

select is(
  (
    select count(*)::integer
    from pg_trigger as t
    where not t.tgisinternal
      and t.tgname in (
        'inquiries_enqueue_notification',
        'inquiries_set_updated_at',
        'inquiries_audit_changes',
        'inquiry_notifications_set_updated_at'
      )
  ),
  4,
  'all inquiry triggers exist exactly once'
);

select * from finish();
rollback;
