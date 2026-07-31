begin;

create extension if not exists pgtap with schema extensions;
grant usage on schema extensions to service_role;
set local role service_role;
set local search_path = public, extensions, pg_catalog;

select plan(42);

select results_eq(
  $$
    select outcome
    from public.create_inquiry(
      p_submission_id => '10000000-0000-4000-8000-000000000001'::uuid,
      p_payload_hash => repeat('a', 64),
      p_kind => 'corporate',
      p_contact_name => 'Ada Lovelace',
      p_email => 'ADA@EXAMPLE.COM',
      p_phone => '8991234567',
      p_company => 'Analytical Engines',
      p_language => 'es',
      p_consent_version => 'privacy-2026-07',
      p_consented_at => '2026-07-29 12:00:00+00'::timestamptz,
      p_retention_until => '2028-01-29'::date,
      p_job_title => 'Engineering Lead',
      p_requested_seats => 2::smallint
    )
  $$,
  $$ values ('created'::text) $$,
  'a first corporate submission is created'
);

select ok(
  (select count(*) = 1 from public.inquiries)
  and (select count(*) = 1 from public.inquiry_notifications)
  and (
    select count(*) = 1
    from public.inquiry_events
    where event_type = 'created'
  ),
  'inquiry, outbox and created event commit atomically'
);

select results_eq(
  $$
    select template, status
    from public.inquiry_notifications
    where inquiry_id = (
      select id
      from public.inquiries
      where submission_id = '10000000-0000-4000-8000-000000000001'
    )
  $$,
  $$ values ('corporate_internal_v1'::text, 'pending'::text) $$,
  'corporate submission creates the correct pending template'
);

select is(
  (
    select email
    from public.inquiries
    where submission_id = '10000000-0000-4000-8000-000000000001'
  ),
  'ada@example.com',
  'email is normalized before persistence'
);

select results_eq(
  $$
    select outcome
    from public.create_inquiry(
      p_submission_id => '10000000-0000-4000-8000-000000000001'::uuid,
      p_payload_hash => repeat('a', 64),
      p_kind => 'corporate',
      p_contact_name => 'Ada Lovelace',
      p_email => 'ADA@EXAMPLE.COM',
      p_phone => '8991234567',
      p_company => 'Analytical Engines',
      p_language => 'es',
      p_consent_version => 'privacy-2026-07',
      p_consented_at => '2026-07-29 12:00:00+00'::timestamptz,
      p_retention_until => '2028-01-29'::date,
      p_job_title => 'Engineering Lead',
      p_requested_seats => 2::smallint
    )
  $$,
  $$ values ('replayed'::text) $$,
  'same submission id and hash is a safe replay'
);

select ok(
  (select count(*) = 1 from public.inquiries)
  and (select count(*) = 1 from public.inquiry_notifications)
  and (
    select count(*) = 1
    from public.inquiry_events
    where event_type = 'created'
  ),
  'safe replay creates no duplicate row, outbox or event'
);

select results_eq(
  $$
    select outcome
    from public.create_inquiry(
      p_submission_id => '10000000-0000-4000-8000-000000000001'::uuid,
      p_payload_hash => repeat('b', 64),
      p_kind => 'corporate',
      p_contact_name => 'Changed Name',
      p_email => 'changed@example.com',
      p_phone => '8997654321',
      p_company => 'Changed Company',
      p_language => 'en',
      p_consent_version => 'privacy-2026-07',
      p_consented_at => '2026-07-29 12:00:00+00'::timestamptz,
      p_retention_until => '2028-01-29'::date,
      p_job_title => 'Changed Role',
      p_requested_seats => 3::smallint
    )
  $$,
  $$ values ('conflict'::text) $$,
  'same submission id with a different hash conflicts'
);

select is(
  (
    select encode(payload_hash, 'hex')
    from public.inquiries
    where submission_id = '10000000-0000-4000-8000-000000000001'
  ),
  repeat('a', 64),
  'idempotency conflict does not mutate the original payload'
);

select throws_ok(
  $$
    select public.create_inquiry(
      p_submission_id => '10000000-0000-4000-8000-000000000009'::uuid,
      p_payload_hash => repeat('9', 64),
      p_kind => 'corporate',
      p_contact_name => 'Minimum Invalid',
      p_email => 'min-invalid@example.com',
      p_phone => '8991234567',
      p_company => 'Test Company',
      p_language => 'es',
      p_consent_version => 'privacy-2026-07',
      p_consented_at => '2026-07-29 12:00:00+00'::timestamptz,
      p_retention_until => '2028-01-29'::date,
      p_job_title => 'Lead',
      p_requested_seats => 1::smallint
    )
  $$,
  '23514',
  null,
  'corporate seat count below two is rejected'
);

select results_eq(
  $$
    select outcome
    from public.create_inquiry(
      p_submission_id => '10000000-0000-4000-8000-000000000010'::uuid,
      p_payload_hash => repeat('c', 64),
      p_kind => 'corporate',
      p_contact_name => 'Maximum Valid',
      p_email => 'max-valid@example.com',
      p_phone => '8991234567',
      p_company => 'Test Company',
      p_language => 'en',
      p_consent_version => 'privacy-2026-07',
      p_consented_at => '2026-07-29 12:00:00+00'::timestamptz,
      p_retention_until => '2028-01-29'::date,
      p_job_title => 'Lead',
      p_requested_seats => 10::smallint
    )
  $$,
  $$ values ('created'::text) $$,
  'corporate seat count of ten is accepted'
);

select throws_ok(
  $$
    select public.create_inquiry(
      p_submission_id => '10000000-0000-4000-8000-000000000011'::uuid,
      p_payload_hash => repeat('d', 64),
      p_kind => 'corporate',
      p_contact_name => 'Maximum Invalid',
      p_email => 'max-invalid@example.com',
      p_phone => '8991234567',
      p_company => 'Test Company',
      p_language => 'en',
      p_consent_version => 'privacy-2026-07',
      p_consented_at => '2026-07-29 12:00:00+00'::timestamptz,
      p_retention_until => '2028-01-29'::date,
      p_job_title => 'Lead',
      p_requested_seats => 11::smallint
    )
  $$,
  '23514',
  null,
  'corporate seat count above ten is rejected'
);

select results_eq(
  $$
    select outcome
    from public.create_inquiry(
      p_submission_id => '20000000-0000-4000-8000-000000000001'::uuid,
      p_payload_hash => repeat('2', 64),
      p_kind => 'sponsor',
      p_contact_name => 'Sponsor Contact',
      p_email => 'sponsor@example.com',
      p_phone => '8991234567',
      p_company => 'Sponsor Company',
      p_language => 'es',
      p_consent_version => 'privacy-2026-07',
      p_consented_at => '2026-07-29 12:00:00+00'::timestamptz,
      p_retention_until => '2028-01-29'::date,
      p_interest => 'We want to discuss the available sponsorship packages.'
    )
  $$,
  $$ values ('created'::text) $$,
  'sponsor payload is accepted'
);

select is(
  (
    select n.template
    from public.inquiry_notifications as n
    join public.inquiries as i on i.id = n.inquiry_id
    where i.submission_id = '20000000-0000-4000-8000-000000000001'
  ),
  'sponsor_internal_v1',
  'sponsor submission creates the sponsor notification template'
);

select throws_ok(
  $$
    select public.create_inquiry(
      p_submission_id => '20000000-0000-4000-8000-000000000002'::uuid,
      p_payload_hash => repeat('3', 64),
      p_kind => 'sponsor',
      p_contact_name => 'Invalid Sponsor',
      p_email => 'invalid-sponsor@example.com',
      p_phone => '8991234567',
      p_company => 'Sponsor Company',
      p_language => 'es',
      p_consent_version => 'privacy-2026-07',
      p_consented_at => '2026-07-29 12:00:00+00'::timestamptz,
      p_retention_until => '2028-01-29'::date,
      p_job_title => 'Must Be Null',
      p_interest => 'We want to discuss the available sponsorship packages.'
    )
  $$,
  '23514',
  null,
  'sponsor payload rejects corporate-only fields'
);

select is(
  (
    select count(*)::integer
    from public.claim_inquiry_notification(
      (
        select n.id
        from public.inquiry_notifications as n
        join public.inquiries as i on i.id = n.inquiry_id
        where i.submission_id = '10000000-0000-4000-8000-000000000001'
      )
    )
  ),
  1,
  'a due notification can be claimed once'
);

select is(
  (
    select count(*)::integer
    from public.claim_inquiry_notification(
      (
        select n.id
        from public.inquiry_notifications as n
        join public.inquiries as i on i.id = n.inquiry_id
        where i.submission_id = '10000000-0000-4000-8000-000000000001'
      )
    )
  ),
  0,
  'an active lease cannot be claimed twice'
);

select results_eq(
  $$
    select n.status, n.attempt_count
    from public.inquiry_notifications as n
    join public.inquiries as i on i.id = n.inquiry_id
    where i.submission_id = '10000000-0000-4000-8000-000000000001'
  $$,
  $$ values ('processing'::text, 1::smallint) $$,
  'claim increments the attempt and enters processing'
);

select results_eq(
  $$
    select completed.status
    from public.complete_inquiry_notification(
      (
        select n.id
        from public.inquiry_notifications as n
        join public.inquiries as i on i.id = n.inquiry_id
        where i.submission_id = '10000000-0000-4000-8000-000000000001'
      ),
      1::smallint,
      'sent',
      25,
      'resend_message_1'
    ) as completed
  $$,
  $$ values ('sent'::text) $$,
  'a claimed notification can complete as sent'
);

select is(
  (
    select count(*)::integer
    from public.inquiry_notification_attempts as a
    join public.inquiry_notifications as n on n.id = a.notification_id
    join public.inquiries as i on i.id = n.inquiry_id
    where i.submission_id = '10000000-0000-4000-8000-000000000001'
      and a.result = 'sent'
  ),
  1,
  'sent completion records one append-only attempt'
);

select is(
  (
    select count(*)::integer
    from public.inquiry_events as e
    join public.inquiries as i on i.id = e.inquiry_id
    where i.submission_id = '10000000-0000-4000-8000-000000000001'
      and e.event_type = 'notification_sent'
  ),
  1,
  'sent completion records one event'
);

select lives_ok(
  $$
    select public.complete_inquiry_notification(
      (
        select n.id
        from public.inquiry_notifications as n
        join public.inquiries as i on i.id = n.inquiry_id
        where i.submission_id = '10000000-0000-4000-8000-000000000001'
      ),
      1::smallint,
      'sent',
      25,
      'resend_message_1'
    )
  $$,
  'identical completion replay is idempotent'
);

select ok(
  (
    select count(*) = 1
    from public.inquiry_notification_attempts as a
    join public.inquiry_notifications as n on n.id = a.notification_id
    join public.inquiries as i on i.id = n.inquiry_id
    where i.submission_id = '10000000-0000-4000-8000-000000000001'
  )
  and (
    select count(*) = 1
    from public.inquiry_events as e
    join public.inquiries as i on i.id = e.inquiry_id
    where i.submission_id = '10000000-0000-4000-8000-000000000001'
      and e.event_type = 'notification_sent'
  ),
  'completion replay creates no duplicate attempt or event'
);

select throws_ok(
  $$
    select public.complete_inquiry_notification(
      (
        select n.id
        from public.inquiry_notifications as n
        join public.inquiries as i on i.id = n.inquiry_id
        where i.submission_id = '10000000-0000-4000-8000-000000000001'
      ),
      1::smallint,
      'sent',
      26,
      'different_provider_id'
    )
  $$,
  'P0001',
  'notification_completion_conflict',
  'different replay of an attempt is rejected'
);

select is(
  (
    select count(*)::integer
    from public.claim_inquiry_notification(
      (
        select n.id
        from public.inquiry_notifications as n
        join public.inquiries as i on i.id = n.inquiry_id
        where i.submission_id = '20000000-0000-4000-8000-000000000001'
      )
    )
  ),
  1,
  'sponsor notification can be claimed'
);

select results_eq(
  $$
    select completed.status
    from public.complete_inquiry_notification(
      (
        select n.id
        from public.inquiry_notifications as n
        join public.inquiries as i on i.id = n.inquiry_id
        where i.submission_id = '20000000-0000-4000-8000-000000000001'
      ),
      1::smallint,
      'retry',
      50,
      null,
      'resend_timeout',
      clock_timestamp() + interval '5 minutes'
    ) as completed
  $$,
  $$ values ('retry'::text) $$,
  'transient completion moves notification to retry'
);

select ok(
  (
    select n.status = 'retry' and n.attempt_count = 1
    from public.inquiry_notifications as n
    join public.inquiries as i on i.id = n.inquiry_id
    where i.submission_id = '20000000-0000-4000-8000-000000000001'
  )
  and (
    select count(*) = 1
    from public.inquiry_notification_attempts as a
    join public.inquiry_notifications as n on n.id = a.notification_id
    join public.inquiries as i on i.id = n.inquiry_id
    where i.submission_id = '20000000-0000-4000-8000-000000000001'
      and a.result = 'retry'
  )
  and (
    select count(*) = 1
    from public.inquiry_events as e
    join public.inquiries as i on i.id = e.inquiry_id
    where i.submission_id = '20000000-0000-4000-8000-000000000001'
      and e.event_type = 'notification_failed'
  ),
  'retry completion records state, attempt and event'
);

select is(
  (
    select count(*)::integer
    from public.claim_inquiry_notification(
      (
        select n.id
        from public.inquiry_notifications as n
        join public.inquiries as i on i.id = n.inquiry_id
        where i.submission_id = '20000000-0000-4000-8000-000000000001'
      )
    )
  ),
  0,
  'retry cannot be claimed before next_attempt_at'
);

update public.inquiry_notifications as n
set next_attempt_at = clock_timestamp() - interval '1 second'
from public.inquiries as i
where i.id = n.inquiry_id
  and i.submission_id = '20000000-0000-4000-8000-000000000001';

select results_eq(
  $$
    select attempt_number
    from public.claim_inquiry_notification(
      (
        select n.id
        from public.inquiry_notifications as n
        join public.inquiries as i on i.id = n.inquiry_id
        where i.submission_id = '20000000-0000-4000-8000-000000000001'
      )
    )
  $$,
  $$ values (2::smallint) $$,
  'due retry is claimed as the next attempt'
);

select results_eq(
  $$
    select completed.status
    from public.complete_inquiry_notification(
      (
        select n.id
        from public.inquiry_notifications as n
        join public.inquiries as i on i.id = n.inquiry_id
        where i.submission_id = '20000000-0000-4000-8000-000000000001'
      ),
      2::smallint,
      'dead',
      40,
      null,
      'resend_rejected'
    ) as completed
  $$,
  $$ values ('dead'::text) $$,
  'permanent completion moves notification to dead'
);

select ok(
  (
    select n.status = 'dead' and n.attempt_count = 2
    from public.inquiry_notifications as n
    join public.inquiries as i on i.id = n.inquiry_id
    where i.submission_id = '20000000-0000-4000-8000-000000000001'
  )
  and (
    select count(*) = 1
    from public.inquiry_notification_attempts as a
    join public.inquiry_notifications as n on n.id = a.notification_id
    join public.inquiries as i on i.id = n.inquiry_id
    where i.submission_id = '20000000-0000-4000-8000-000000000001'
      and a.result = 'dead'
  )
  and (
    select count(*) = 2
    from public.inquiry_events as e
    join public.inquiries as i on i.id = e.inquiry_id
    where i.submission_id = '20000000-0000-4000-8000-000000000001'
      and e.event_type = 'notification_failed'
  ),
  'dead completion records final state, attempt and event'
);

select results_eq(
  $$
    select outcome
    from public.create_inquiry(
      p_submission_id => '30000000-0000-4000-8000-000000000001'::uuid,
      p_payload_hash => repeat('3', 64),
      p_kind => 'sponsor',
      p_contact_name => 'Lease Test',
      p_email => 'lease@example.com',
      p_phone => '8991234567',
      p_company => 'Lease Company',
      p_language => 'en',
      p_consent_version => 'privacy-2026-07',
      p_consented_at => '2026-07-29 12:00:00+00'::timestamptz,
      p_retention_until => '2028-01-29'::date,
      p_interest => 'This inquiry is used to verify abandoned lease recovery.'
    )
  $$,
  $$ values ('created'::text) $$,
  'lease-recovery fixture is created'
);

select is(
  (
    select count(*)::integer
    from public.claim_inquiry_notification(
      (
        select n.id
        from public.inquiry_notifications as n
        join public.inquiries as i on i.id = n.inquiry_id
        where i.submission_id = '30000000-0000-4000-8000-000000000001'
      )
    )
  ),
  1,
  'lease-recovery fixture is initially claimed'
);

update public.inquiry_notifications as n
set processing_started_at = clock_timestamp() - interval '16 minutes'
from public.inquiries as i
where i.id = n.inquiry_id
  and i.submission_id = '30000000-0000-4000-8000-000000000001';

select lives_ok(
  $$ select * from public.claim_inquiry_notifications(null) $$,
  'batch claim accepts null limit and recovers expired leases'
);

select results_eq(
  $$
    select a.result, a.error_code, a.attempt_number
    from public.inquiry_notification_attempts as a
    join public.inquiry_notifications as n on n.id = a.notification_id
    join public.inquiries as i on i.id = n.inquiry_id
    where i.submission_id = '30000000-0000-4000-8000-000000000001'
  $$,
  $$ values ('retry'::text, 'processing_lease_expired'::text, 1::smallint) $$,
  'expired lease is recorded as a retry attempt'
);

select results_eq(
  $$
    select n.status, n.attempt_count
    from public.inquiry_notifications as n
    join public.inquiries as i on i.id = n.inquiry_id
    where i.submission_id = '30000000-0000-4000-8000-000000000001'
  $$,
  $$ values ('processing'::text, 2::smallint) $$,
  'recovered lease is claimed as the next attempt'
);

select throws_ok(
  $$
    insert into public.inquiry_events (
      inquiry_id,
      event_type,
      actor,
      metadata
    )
    values (
      (
        select id
        from public.inquiries
        where submission_id = '10000000-0000-4000-8000-000000000001'
      ),
      'note_updated',
      'system',
      '{"email":"pii@example.com"}'::jsonb
    )
  $$,
  '23514',
  null,
  'event metadata rejects PII keys'
);

select throws_ok(
  $$
    update public.inquiries
    set landing_page = '/?email=pii@example.com'
    where submission_id = '10000000-0000-4000-8000-000000000001'
  $$,
  '23514',
  null,
  'landing page rejects query strings that could contain PII'
);

select throws_ok(
  $$
    update public.inquiries
    set referrer = 'https://partner.example/path?email=pii@example.com'
    where submission_id = '10000000-0000-4000-8000-000000000001'
  $$,
  '23514',
  null,
  'referrer accepts an origin only'
);

select lives_ok(
  $$
    update public.inquiries
    set status = 'contacted'
    where submission_id = '10000000-0000-4000-8000-000000000001'
  $$,
  'operator status update succeeds'
);

select is(
  (
    select count(*)::integer
    from public.inquiry_events as e
    join public.inquiries as i on i.id = e.inquiry_id
    where i.submission_id = '10000000-0000-4000-8000-000000000001'
      and e.event_type = 'status_changed'
      and e.from_value = 'new'
      and e.to_value = 'contacted'
  ),
  1,
  'status update creates an audit event'
);

do $fixtures$
begin
  perform public.create_inquiry(
    p_submission_id => '40000000-0000-4000-8000-000000000001'::uuid,
    p_payload_hash => repeat('4', 64),
    p_kind => 'sponsor',
    p_contact_name => 'Lower Bound One',
    p_email => 'lower-one@example.com',
    p_phone => '8991234567',
    p_company => 'Queue Company',
    p_language => 'es',
    p_consent_version => 'privacy-2026-07',
    p_consented_at => '2026-07-29 12:00:00+00'::timestamptz,
    p_retention_until => '2028-01-29'::date,
    p_interest => 'Queue lower-bound fixture number one.'
  );

  perform public.create_inquiry(
    p_submission_id => '40000000-0000-4000-8000-000000000002'::uuid,
    p_payload_hash => repeat('5', 64),
    p_kind => 'sponsor',
    p_contact_name => 'Lower Bound Two',
    p_email => 'lower-two@example.com',
    p_phone => '8991234567',
    p_company => 'Queue Company',
    p_language => 'es',
    p_consent_version => 'privacy-2026-07',
    p_consented_at => '2026-07-29 12:00:00+00'::timestamptz,
    p_retention_until => '2028-01-29'::date,
    p_interest => 'Queue lower-bound fixture number two.'
  );
end;
$fixtures$;

select is(
  (select count(*)::integer from public.claim_inquiry_notifications(0)),
  1,
  'batch limit zero clamps to one'
);

insert into public.inquiries (
  submission_id,
  payload_hash,
  kind,
  contact_name,
  email,
  phone,
  company,
  interest,
  language,
  consent_version,
  consented_at,
  retention_until
)
select
  gen_random_uuid(),
  decode(repeat('e', 64), 'hex'),
  'sponsor',
  'Batch Limit Fixture',
  'batch-limit@example.com',
  '8991234567',
  'Queue Company',
  'Fixture for verifying the default batch upper bound.',
  'en',
  'privacy-2026-07',
  '2026-07-29 12:00:00+00'::timestamptz,
  '2028-01-29'::date
from generate_series(1, 12);

select is(
  (select count(*)::integer from public.claim_inquiry_notifications(null)),
  10,
  'null batch limit defaults to ten'
);

select * from finish();
rollback;
