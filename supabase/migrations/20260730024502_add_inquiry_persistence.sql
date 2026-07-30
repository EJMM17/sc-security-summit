-- SC Security Summit 2026
-- Add durable, idempotent inquiry persistence and an email outbox.
--
-- Forward plan:
--   The application persists through create_inquiry(), then claims and
--   completes the generated notification. Cron workers use the same outbox.
--
-- Operational rollback:
--   Roll back the application and disable its cron. Keep these additive tables
--   so inquiries captured during the deployment window are not lost. Correct
--   defects with a new migration; never edit this migration after deployment.

begin;

create or replace function public.is_safe_inquiry_event_metadata(
  p_metadata jsonb
)
returns boolean
language plpgsql
immutable
strict
security invoker
set search_path = ''
as $function$
declare
  v_key text;
  v_value jsonb;
  v_text text;
begin
  if pg_catalog.jsonb_typeof(p_metadata) <> 'object'
     or pg_catalog.octet_length(
       pg_catalog.convert_to(p_metadata::text, 'UTF8')
     ) > 2048 then
    return false;
  end if;

  for v_key, v_value in
    select entry.key, entry.value
    from pg_catalog.jsonb_each(p_metadata) as entry
  loop
    if v_key not in (
      'notification_id',
      'notification_status',
      'error_code',
      'attempt_number',
      'duration_ms',
      'kind',
      'language',
      'source',
      'reason'
    ) then
      return false;
    end if;

    v_text := v_value #>> '{}';

    if v_key = 'notification_id' then
      if pg_catalog.jsonb_typeof(v_value) <> 'string'
         or v_text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
        return false;
      end if;
    elsif v_key = 'attempt_number' then
      if pg_catalog.jsonb_typeof(v_value) <> 'number'
         or v_text !~ '^[1-5]$' then
        return false;
      end if;
    elsif v_key = 'duration_ms' then
      if pg_catalog.jsonb_typeof(v_value) <> 'number'
         or v_text !~ '^[0-9]{1,9}$' then
        return false;
      end if;
    elsif v_key = 'kind' then
      if pg_catalog.jsonb_typeof(v_value) <> 'string'
         or v_text not in ('corporate', 'sponsor') then
        return false;
      end if;
    elsif v_key = 'language' then
      if pg_catalog.jsonb_typeof(v_value) <> 'string'
         or v_text not in ('es', 'en') then
        return false;
      end if;
    elsif v_key = 'notification_status' then
      if pg_catalog.jsonb_typeof(v_value) <> 'string'
         or v_text not in ('pending', 'processing', 'sent', 'retry', 'dead') then
        return false;
      end if;
    else
      if pg_catalog.jsonb_typeof(v_value) <> 'string'
         or v_text !~ '^[A-Za-z0-9_.:-]{1,128}$' then
        return false;
      end if;
    end if;
  end loop;

  return true;
end;
$function$;

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null,
  payload_hash bytea not null,
  kind text not null,
  status text not null default 'new',
  contact_name text not null,
  email text not null,
  phone text not null,
  company text not null,
  job_title text,
  requested_seats smallint,
  interest text,
  language text not null,
  consent_version text not null,
  consented_at timestamptz not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  landing_page text,
  referrer text,
  first_touch_at timestamptz,
  last_touch_at timestamptz,
  owner text,
  internal_notes text,
  next_follow_up_at timestamptz,
  retention_until date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inquiries_submission_id_key unique (submission_id),
  constraint inquiries_payload_hash_length_check
    check (pg_catalog.octet_length(payload_hash) = 32),
  constraint inquiries_kind_check
    check (kind in ('corporate', 'sponsor')),
  constraint inquiries_status_check
    check (
      status in (
        'new',
        'contacted',
        'qualified',
        'proposal_sent',
        'won',
        'lost',
        'archived'
      )
    ),
  constraint inquiries_contact_name_check
    check (
      contact_name = pg_catalog.btrim(contact_name)
      and pg_catalog.char_length(contact_name) between 2 and 160
    ),
  constraint inquiries_email_check
    check (
      email = pg_catalog.lower(pg_catalog.btrim(email))
      and pg_catalog.char_length(email) between 3 and 255
      and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    ),
  constraint inquiries_phone_check
    check (
      phone = pg_catalog.btrim(phone)
      and pg_catalog.char_length(phone) between 7 and 30
    ),
  constraint inquiries_company_check
    check (
      company = pg_catalog.btrim(company)
      and pg_catalog.char_length(company) between 2 and 160
    ),
  constraint inquiries_job_title_check
    check (
      job_title is null
      or (
        job_title = pg_catalog.btrim(job_title)
        and pg_catalog.char_length(job_title) between 2 and 160
      )
    ),
  constraint inquiries_interest_check
    check (
      interest is null
      or (
        interest = pg_catalog.btrim(interest)
        and pg_catalog.char_length(interest) between 10 and 1200
      )
    ),
  constraint inquiries_language_check
    check (language in ('es', 'en')),
  constraint inquiries_consent_version_check
    check (
      consent_version = pg_catalog.btrim(consent_version)
      and consent_version ~ '^[A-Za-z0-9_.:-]{1,64}$'
    ),
  constraint inquiries_discriminated_payload_check check (
    (
      kind = 'corporate'
      and job_title is not null
      and requested_seats between 2 and 10
      and interest is null
    )
    or (
      kind = 'sponsor'
      and job_title is null
      and requested_seats is null
      and interest is not null
    )
  ),
  constraint inquiries_attribution_order_check
    check (
      first_touch_at is null
      or last_touch_at is null
      or first_touch_at <= last_touch_at
    ),
  constraint inquiries_utm_source_length_check
    check (utm_source is null or pg_catalog.char_length(utm_source) <= 512),
  constraint inquiries_utm_medium_length_check
    check (utm_medium is null or pg_catalog.char_length(utm_medium) <= 512),
  constraint inquiries_utm_campaign_length_check
    check (utm_campaign is null or pg_catalog.char_length(utm_campaign) <= 512),
  constraint inquiries_utm_term_length_check
    check (utm_term is null or pg_catalog.char_length(utm_term) <= 512),
  constraint inquiries_utm_content_length_check
    check (utm_content is null or pg_catalog.char_length(utm_content) <= 512),
  constraint inquiries_landing_page_length_check
    check (
      landing_page is null
      or (
        pg_catalog.char_length(landing_page) <= 2048
        and landing_page ~ '^/[^?#[:space:]]*$'
        and landing_page !~ '^//'
      )
    ),
  constraint inquiries_referrer_length_check
    check (
      referrer is null
      or (
        pg_catalog.char_length(referrer) <= 2048
        and referrer ~ '^https?://[^/?#[:space:]]+$'
      )
    ),
  constraint inquiries_owner_check
    check (
      owner is null
      or owner ~ '^[a-z0-9_.:-]{1,160}$'
    ),
  constraint inquiries_internal_notes_length_check
    check (
      internal_notes is null
      or pg_catalog.char_length(internal_notes) <= 5000
    ),
  constraint inquiries_retention_check
    check (retention_until >= consented_at::date)
);

create table public.inquiry_notifications (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null
    references public.inquiries (id) on delete cascade,
  channel text not null default 'email',
  template text not null,
  status text not null default 'pending',
  attempt_count smallint not null default 0,
  next_attempt_at timestamptz,
  processing_started_at timestamptz,
  provider_message_id text,
  last_error_code text,
  last_error_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inquiry_notifications_delivery_key
    unique (inquiry_id, channel, template),
  constraint inquiry_notifications_channel_check
    check (channel = 'email'),
  constraint inquiry_notifications_template_check
    check (
      template in ('corporate_internal_v1', 'sponsor_internal_v1')
    ),
  constraint inquiry_notifications_status_check
    check (status in ('pending', 'processing', 'sent', 'retry', 'dead')),
  constraint inquiry_notifications_attempt_count_check
    check (attempt_count between 0 and 5),
  constraint inquiry_notifications_provider_message_id_check
    check (
      provider_message_id is null
      or pg_catalog.char_length(provider_message_id) between 1 and 255
    ),
  constraint inquiry_notifications_error_code_check
    check (
      last_error_code is null
      or last_error_code ~ '^[A-Za-z0-9_.:-]{1,128}$'
    ),
  constraint inquiry_notifications_state_check check (
    (
      status = 'pending'
      and attempt_count = 0
      and next_attempt_at is not null
      and processing_started_at is null
      and sent_at is null
    )
    or (
      status = 'processing'
      and attempt_count between 1 and 5
      and next_attempt_at is null
      and processing_started_at is not null
      and sent_at is null
    )
    or (
      status = 'retry'
      and attempt_count between 1 and 4
      and next_attempt_at is not null
      and processing_started_at is null
      and last_error_code is not null
      and sent_at is null
    )
    or (
      status = 'sent'
      and attempt_count between 1 and 5
      and next_attempt_at is null
      and processing_started_at is null
      and provider_message_id is not null
      and last_error_code is null
      and sent_at is not null
    )
    or (
      status = 'dead'
      and attempt_count between 1 and 5
      and next_attempt_at is null
      and processing_started_at is null
      and last_error_code is not null
      and sent_at is null
    )
  )
);

create table public.inquiry_notification_attempts (
  id bigint generated always as identity primary key,
  notification_id uuid not null
    references public.inquiry_notifications (id) on delete cascade,
  attempt_number smallint not null,
  result text not null,
  provider_message_id text,
  error_code text,
  duration_ms integer not null,
  attempted_at timestamptz not null default now(),
  constraint inquiry_notification_attempts_number_key
    unique (notification_id, attempt_number),
  constraint inquiry_notification_attempts_number_check
    check (attempt_number between 1 and 5),
  constraint inquiry_notification_attempts_result_check
    check (result in ('sent', 'retry', 'dead')),
  constraint inquiry_notification_attempts_provider_message_id_check
    check (
      provider_message_id is null
      or pg_catalog.char_length(provider_message_id) between 1 and 255
    ),
  constraint inquiry_notification_attempts_error_code_check
    check (
      error_code is null
      or error_code ~ '^[A-Za-z0-9_.:-]{1,128}$'
    ),
  constraint inquiry_notification_attempts_duration_check
    check (duration_ms between 0 and 900000),
  constraint inquiry_notification_attempts_result_shape_check check (
    (
      result = 'sent'
      and provider_message_id is not null
      and error_code is null
    )
    or (
      result in ('retry', 'dead')
      and error_code is not null
    )
  )
);

create table public.inquiry_events (
  id bigint generated always as identity primary key,
  inquiry_id uuid not null
    references public.inquiries (id) on delete cascade,
  event_type text not null,
  actor text not null default 'system',
  from_value text,
  to_value text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint inquiry_events_type_check
    check (
      event_type in (
        'created',
        'status_changed',
        'notification_sent',
        'notification_failed',
        'assigned',
        'note_updated',
        'archived'
      )
    ),
  constraint inquiry_events_actor_check
    check (actor ~ '^[a-z0-9_.:-]{1,160}$'),
  constraint inquiry_events_from_value_check
    check (
      from_value is null
      or from_value ~ '^[A-Za-z0-9_.:-]{1,160}$'
    ),
  constraint inquiry_events_to_value_check
    check (
      to_value is null
      or to_value ~ '^[A-Za-z0-9_.:-]{1,160}$'
    ),
  constraint inquiry_events_metadata_check
    check (public.is_safe_inquiry_event_metadata(metadata))
);

create index inquiries_status_created_at_idx
  on public.inquiries (status, created_at desc);
create index inquiries_kind_status_created_at_idx
  on public.inquiries (kind, status, created_at desc);
create index inquiries_next_follow_up_at_idx
  on public.inquiries (next_follow_up_at)
  where next_follow_up_at is not null
    and status in ('new', 'contacted', 'qualified', 'proposal_sent');
create index inquiries_retention_until_idx
  on public.inquiries (retention_until);

create index inquiry_notifications_ready_idx
  on public.inquiry_notifications (next_attempt_at, created_at)
  where status in ('pending', 'retry');
create index inquiry_notifications_processing_idx
  on public.inquiry_notifications (processing_started_at)
  where status = 'processing';

-- The unique indexes begin with their FK columns, so these cover joins and
-- cascades without redundant indexes.
create index inquiry_notification_attempts_notification_id_idx
  on public.inquiry_notification_attempts (notification_id, attempted_at desc);
create index inquiry_events_inquiry_id_idx
  on public.inquiry_events (inquiry_id, created_at desc);

create or replace function public.enqueue_inquiry_notification()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  insert into public.inquiry_notifications (
    inquiry_id,
    channel,
    template,
    status,
    next_attempt_at
  )
  values (
    new.id,
    'email',
    case new.kind
      when 'corporate' then 'corporate_internal_v1'
      else 'sponsor_internal_v1'
    end,
    'pending',
    pg_catalog.clock_timestamp()
  );

  insert into public.inquiry_events (
    inquiry_id,
    event_type,
    actor,
    metadata
  )
  values (
    new.id,
    'created',
    'system',
    pg_catalog.jsonb_build_object(
      'kind', new.kind,
      'language', new.language,
      'source', 'web_form'
    )
  );

  return new;
end;
$function$;

create trigger inquiries_enqueue_notification
after insert on public.inquiries
for each row execute function public.enqueue_inquiry_notification();

create trigger inquiries_set_updated_at
before update on public.inquiries
for each row execute function public.set_updated_at();

create trigger inquiry_notifications_set_updated_at
before update on public.inquiry_notifications
for each row execute function public.set_updated_at();

create or replace function public.audit_inquiry_changes()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if new.status is distinct from old.status then
    insert into public.inquiry_events (
      inquiry_id,
      event_type,
      actor,
      from_value,
      to_value
    )
    values (
      new.id,
      case when new.status = 'archived' then 'archived' else 'status_changed' end,
      'operator',
      old.status,
      new.status
    );
  end if;

  if new.owner is distinct from old.owner then
    insert into public.inquiry_events (
      inquiry_id,
      event_type,
      actor,
      from_value,
      to_value,
      metadata
    )
    values (
      new.id,
      'assigned',
      'operator',
      old.owner,
      new.owner,
      '{"reason":"owner_changed"}'::jsonb
    );
  end if;

  if new.internal_notes is distinct from old.internal_notes then
    insert into public.inquiry_events (
      inquiry_id,
      event_type,
      actor,
      metadata
    )
    values (
      new.id,
      'note_updated',
      'operator',
      '{"reason":"note_updated"}'::jsonb
    );
  end if;

  return new;
end;
$function$;

create trigger inquiries_audit_changes
after update of status, owner, internal_notes on public.inquiries
for each row execute function public.audit_inquiry_changes();

create or replace function public.create_inquiry(
  p_submission_id uuid,
  p_payload_hash text,
  p_kind text,
  p_contact_name text,
  p_email text,
  p_phone text,
  p_company text,
  p_language text,
  p_consent_version text,
  p_consented_at timestamptz,
  p_retention_until date,
  p_job_title text default null,
  p_requested_seats smallint default null,
  p_interest text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_utm_term text default null,
  p_utm_content text default null,
  p_landing_page text default null,
  p_referrer text default null,
  p_first_touch_at timestamptz default null,
  p_last_touch_at timestamptz default null
)
returns table (
  inquiry_id uuid,
  notification_id uuid,
  outcome text
)
language plpgsql
volatile
security invoker
set search_path = ''
as $function$
declare
  v_inquiry_id uuid;
  v_notification_id uuid;
  v_existing_hash bytea;
  v_hash bytea;
  v_outcome text;
begin
  if p_payload_hash is null
     or p_payload_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_payload_hash'
      using errcode = '22023';
  end if;

  v_hash := pg_catalog.decode(p_payload_hash, 'hex');

  insert into public.inquiries (
    submission_id,
    payload_hash,
    kind,
    contact_name,
    email,
    phone,
    company,
    job_title,
    requested_seats,
    interest,
    language,
    consent_version,
    consented_at,
    retention_until,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content,
    landing_page,
    referrer,
    first_touch_at,
    last_touch_at
  )
  values (
    p_submission_id,
    v_hash,
    p_kind,
    pg_catalog.btrim(p_contact_name),
    pg_catalog.lower(pg_catalog.btrim(p_email)),
    pg_catalog.btrim(p_phone),
    pg_catalog.btrim(p_company),
    nullif(pg_catalog.btrim(p_job_title), ''),
    p_requested_seats,
    nullif(pg_catalog.btrim(p_interest), ''),
    p_language,
    pg_catalog.btrim(p_consent_version),
    p_consented_at,
    p_retention_until,
    nullif(pg_catalog.btrim(p_utm_source), ''),
    nullif(pg_catalog.btrim(p_utm_medium), ''),
    nullif(pg_catalog.btrim(p_utm_campaign), ''),
    nullif(pg_catalog.btrim(p_utm_term), ''),
    nullif(pg_catalog.btrim(p_utm_content), ''),
    nullif(pg_catalog.btrim(p_landing_page), ''),
    nullif(pg_catalog.btrim(p_referrer), ''),
    p_first_touch_at,
    p_last_touch_at
  )
  on conflict (submission_id) do nothing
  returning id into v_inquiry_id;

  if v_inquiry_id is null then
    select i.id, i.payload_hash
    into v_inquiry_id, v_existing_hash
    from public.inquiries as i
    where i.submission_id = p_submission_id;

    if v_existing_hash is distinct from v_hash then
      return query
      select v_inquiry_id, null::uuid, 'conflict'::text;
      return;
    end if;

    v_outcome := 'replayed';
  else
    v_outcome := 'created';
  end if;

  select n.id
  into v_notification_id
  from public.inquiry_notifications as n
  where n.inquiry_id = v_inquiry_id
    and n.channel = 'email'
  order by n.created_at
  limit 1;

  return query
  select v_inquiry_id, v_notification_id, v_outcome;
end;
$function$;

create or replace function public.claim_inquiry_notification(
  p_notification_id uuid
)
returns table (
  notification_id uuid,
  inquiry_id uuid,
  attempt_number smallint,
  template text
)
language sql
volatile
security invoker
set search_path = ''
as $function$
  with candidate as (
    select n.id
    from public.inquiry_notifications as n
    where n.id = p_notification_id
      and n.status in ('pending', 'retry')
      and n.next_attempt_at <= pg_catalog.clock_timestamp()
      and n.attempt_count < 5
    for update skip locked
  ),
  claimed as (
    update public.inquiry_notifications as n
    set
      status = 'processing',
      attempt_count = n.attempt_count + 1,
      next_attempt_at = null,
      processing_started_at = pg_catalog.clock_timestamp()
    from candidate as c
    where n.id = c.id
    returning n.id, n.inquiry_id, n.attempt_count, n.template
  )
  select c.id, c.inquiry_id, c.attempt_count, c.template
  from claimed as c;
$function$;

create or replace function public.claim_inquiry_notifications(
  p_limit integer default 10
)
returns table (
  notification_id uuid,
  inquiry_id uuid,
  attempt_number smallint,
  template text
)
language plpgsql
volatile
security invoker
set search_path = ''
as $function$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 10), 1), 50);
  v_stale record;
  v_recovered_status text;
  v_error_code text := 'processing_lease_expired';
begin
  -- Recover abandoned leases before claiming new work. Every expired lease is
  -- recorded as an attempt, so attempt numbering remains complete.
  for v_stale in
    select
      n.id,
      n.inquiry_id,
      n.attempt_count
    from public.inquiry_notifications as n
    where n.status = 'processing'
      and n.processing_started_at
        <= pg_catalog.clock_timestamp() - interval '15 minutes'
    order by n.processing_started_at
    limit v_limit
    for update skip locked
  loop
    v_recovered_status :=
      case when v_stale.attempt_count >= 5 then 'dead' else 'retry' end;

    insert into public.inquiry_notification_attempts (
      notification_id,
      attempt_number,
      result,
      error_code,
      duration_ms
    )
    values (
      v_stale.id,
      v_stale.attempt_count,
      v_recovered_status,
      v_error_code,
      0
    )
    on conflict on constraint inquiry_notification_attempts_number_key
    do nothing;

    update public.inquiry_notifications as n
    set
      status = v_recovered_status,
      next_attempt_at = case
        when v_recovered_status = 'retry'
          then pg_catalog.clock_timestamp()
        else null
      end,
      processing_started_at = null,
      last_error_code = v_error_code,
      last_error_at = pg_catalog.clock_timestamp()
    where n.id = v_stale.id;

    insert into public.inquiry_events (
      inquiry_id,
      event_type,
      actor,
      metadata
    )
    values (
      v_stale.inquiry_id,
      'notification_failed',
      'system',
      pg_catalog.jsonb_build_object(
        'notification_id', v_stale.id,
        'notification_status', v_recovered_status,
        'error_code', v_error_code,
        'attempt_number', v_stale.attempt_count,
        'duration_ms', 0
      )
    );
  end loop;

  return query
  with candidates as (
    select n.id
    from public.inquiry_notifications as n
    where n.status in ('pending', 'retry')
      and n.next_attempt_at <= pg_catalog.clock_timestamp()
      and n.attempt_count < 5
    order by n.next_attempt_at, n.created_at
    limit v_limit
    for update skip locked
  ),
  claimed as (
    update public.inquiry_notifications as n
    set
      status = 'processing',
      attempt_count = n.attempt_count + 1,
      next_attempt_at = null,
      processing_started_at = pg_catalog.clock_timestamp()
    from candidates as c
    where n.id = c.id
    returning n.id, n.inquiry_id, n.attempt_count, n.template
  )
  select c.id, c.inquiry_id, c.attempt_count, c.template
  from claimed as c
  order by c.id;
end;
$function$;

create or replace function public.complete_inquiry_notification(
  p_notification_id uuid,
  p_attempt_number smallint,
  p_result text,
  p_duration_ms integer,
  p_provider_message_id text default null,
  p_error_code text default null,
  p_next_attempt_at timestamptz default null
)
returns table (
  notification_id uuid,
  status text,
  attempt_count smallint
)
language plpgsql
volatile
security invoker
set search_path = ''
as $function$
declare
  v_notification public.inquiry_notifications%rowtype;
  v_existing public.inquiry_notification_attempts%rowtype;
  v_provider_message_id text :=
    nullif(pg_catalog.btrim(p_provider_message_id), '');
  v_error_code text :=
    nullif(pg_catalog.btrim(p_error_code), '');
  v_event_type text;
begin
  select n.*
  into v_notification
  from public.inquiry_notifications as n
  where n.id = p_notification_id
  for update;

  if not found then
    raise exception 'notification_not_found'
      using errcode = 'P0002';
  end if;

  select a.*
  into v_existing
  from public.inquiry_notification_attempts as a
  where a.notification_id = p_notification_id
    and a.attempt_number = p_attempt_number;

  if found then
    if v_existing.result = p_result
       and v_existing.provider_message_id
         is not distinct from v_provider_message_id
       and v_existing.error_code is not distinct from v_error_code
       and v_existing.duration_ms = p_duration_ms then
      return query
      select n.id, n.status, n.attempt_count
      from public.inquiry_notifications as n
      where n.id = p_notification_id;
      return;
    end if;

    raise exception 'notification_completion_conflict'
      using errcode = 'P0001';
  end if;

  if v_notification.status <> 'processing'
     or v_notification.attempt_count <> p_attempt_number then
    raise exception 'notification_not_claimed'
      using errcode = 'P0001';
  end if;

  if p_result not in ('sent', 'retry', 'dead')
     or p_duration_ms is null
     or p_duration_ms < 0
     or p_duration_ms > 900000 then
    raise exception 'invalid_notification_result'
      using errcode = '22023';
  end if;

  if p_result = 'sent' then
    if v_provider_message_id is null
       or v_error_code is not null
       or p_next_attempt_at is not null then
      raise exception 'invalid_sent_result'
        using errcode = '22023';
    end if;
  elsif p_result = 'retry' then
    if v_error_code is null
       or v_error_code !~ '^[A-Za-z0-9_.:-]{1,128}$'
       or p_next_attempt_at is null
       or p_next_attempt_at <= pg_catalog.clock_timestamp()
       or p_attempt_number >= 5 then
      raise exception 'invalid_retry_result'
        using errcode = '22023';
    end if;
  else
    if v_error_code is null
       or v_error_code !~ '^[A-Za-z0-9_.:-]{1,128}$'
       or p_next_attempt_at is not null then
      raise exception 'invalid_dead_result'
        using errcode = '22023';
    end if;
  end if;

  insert into public.inquiry_notification_attempts (
    notification_id,
    attempt_number,
    result,
    provider_message_id,
    error_code,
    duration_ms
  )
  values (
    p_notification_id,
    p_attempt_number,
    p_result,
    v_provider_message_id,
    v_error_code,
    p_duration_ms
  );

  if p_result = 'sent' then
    update public.inquiry_notifications as n
    set
      status = 'sent',
      next_attempt_at = null,
      processing_started_at = null,
      provider_message_id = v_provider_message_id,
      last_error_code = null,
      last_error_at = null,
      sent_at = pg_catalog.clock_timestamp()
    where n.id = p_notification_id;

    v_event_type := 'notification_sent';
  elsif p_result = 'retry' then
    update public.inquiry_notifications as n
    set
      status = 'retry',
      next_attempt_at = p_next_attempt_at,
      processing_started_at = null,
      provider_message_id = null,
      last_error_code = v_error_code,
      last_error_at = pg_catalog.clock_timestamp(),
      sent_at = null
    where n.id = p_notification_id;

    v_event_type := 'notification_failed';
  else
    update public.inquiry_notifications as n
    set
      status = 'dead',
      next_attempt_at = null,
      processing_started_at = null,
      provider_message_id = null,
      last_error_code = v_error_code,
      last_error_at = pg_catalog.clock_timestamp(),
      sent_at = null
    where n.id = p_notification_id;

    v_event_type := 'notification_failed';
  end if;

  insert into public.inquiry_events (
    inquiry_id,
    event_type,
    actor,
    metadata
  )
  values (
    v_notification.inquiry_id,
    v_event_type,
    'system',
    pg_catalog.jsonb_strip_nulls(
      pg_catalog.jsonb_build_object(
        'notification_id', p_notification_id,
        'notification_status', p_result,
        'error_code', v_error_code,
        'attempt_number', p_attempt_number,
        'duration_ms', p_duration_ms
      )
    )
  );

  return query
  select n.id, n.status, n.attempt_count
  from public.inquiry_notifications as n
  where n.id = p_notification_id;
end;
$function$;

alter table public.inquiries enable row level security;
alter table public.inquiry_notifications enable row level security;
alter table public.inquiry_notification_attempts enable row level security;
alter table public.inquiry_events enable row level security;

revoke all on table public.inquiries
  from public, anon, authenticated, service_role;
revoke all on table public.inquiry_notifications
  from public, anon, authenticated, service_role;
revoke all on table public.inquiry_notification_attempts
  from public, anon, authenticated, service_role;
revoke all on table public.inquiry_events
  from public, anon, authenticated, service_role;

grant select, insert, update on table public.inquiries to service_role;
grant select, insert, update on table public.inquiry_notifications
  to service_role;
grant select, insert on table public.inquiry_notification_attempts
  to service_role;
grant select, insert on table public.inquiry_events to service_role;

revoke all on sequence public.inquiry_notification_attempts_id_seq
  from public, anon, authenticated, service_role;
revoke all on sequence public.inquiry_events_id_seq
  from public, anon, authenticated, service_role;
grant usage on sequence public.inquiry_notification_attempts_id_seq
  to service_role;
grant usage on sequence public.inquiry_events_id_seq to service_role;

revoke all on function public.is_safe_inquiry_event_metadata(jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public.enqueue_inquiry_notification()
  from public, anon, authenticated, service_role;
revoke all on function public.audit_inquiry_changes()
  from public, anon, authenticated, service_role;
revoke all on function public.create_inquiry(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  timestamptz,
  date,
  text,
  smallint,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  timestamptz,
  timestamptz
) from public, anon, authenticated, service_role;
revoke all on function public.claim_inquiry_notification(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.claim_inquiry_notifications(integer)
  from public, anon, authenticated, service_role;
revoke all on function public.complete_inquiry_notification(
  uuid,
  smallint,
  text,
  integer,
  text,
  text,
  timestamptz
) from public, anon, authenticated, service_role;

grant execute on function public.is_safe_inquiry_event_metadata(jsonb)
  to service_role;
grant execute on function public.create_inquiry(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  timestamptz,
  date,
  text,
  smallint,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  timestamptz,
  timestamptz
) to service_role;
grant execute on function public.claim_inquiry_notification(uuid)
  to service_role;
grant execute on function public.claim_inquiry_notifications(integer)
  to service_role;
grant execute on function public.complete_inquiry_notification(
  uuid,
  smallint,
  text,
  integer,
  text,
  text,
  timestamptz
) to service_role;

comment on table public.inquiries is
  'Source of truth for corporate-pass and sponsorship inquiries.';
comment on column public.inquiries.payload_hash is
  'SHA-256 of canonical normalized payload v1; exactly 32 bytes.';
comment on column public.inquiries.owner is
  'Non-PII operator slug, for example ops-01.';
comment on table public.inquiry_notifications is
  'Durable email outbox. Workers must claim before contacting Resend.';
comment on column public.inquiry_notifications.processing_started_at is
  'Lease start; cron recovers processing rows after 15 minutes.';
comment on table public.inquiry_notification_attempts is
  'Append-only technical delivery attempts; never stores email content or recipient.';
comment on table public.inquiry_events is
  'Append-only operational history with strict metadata allowlist.';
comment on function public.create_inquiry(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  timestamptz,
  date,
  text,
  smallint,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  timestamptz,
  timestamptz
) is
  'Atomic idempotent insert. Outcomes: created, replayed, conflict.';

commit;
