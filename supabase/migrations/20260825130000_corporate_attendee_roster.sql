-- SC Security Summit 2026
-- Corporate blocks: a named roster and no upper seat limit.
--
-- Product change:
--   A corporate request used to be a number between 2 and 10. It is now a
--   roster: the buyer names every person who will attend, one name per access,
--   because the DC-3 certificate is issued per participant and the team was
--   collecting those names by email anyway. The upper limit is gone: blocks
--   are quoted with a 25% discount from the fifth access up, with no ceiling.
--
-- Design notes:
--   * Names live in their own table, keyed by seat number, so the roster is
--     ordered, cannot exceed the requested accesses and cascades with the
--     inquiry's retention. It carries no contact data: a participant's name is
--     the minimum the certificate needs.
--   * create_inquiry() takes the roster as an array and writes it in the same
--     transaction as the inquiry. A replay keeps the original roster; a
--     submission whose roster changed is already a payload-hash conflict.
--   * The old 23-argument create_inquiry is dropped rather than left as an
--     overload: two candidates with the same named arguments would make the
--     PostgREST call ambiguous.
--
-- Operational rollback:
--   Restore create_inquiry from 20260730024502 and stop sending p_attendees.
--   Keep the table: rosters captured during the deployment window are the only
--   copy of those names.

begin;

-- ---------------------------------------------------------------------------
-- Seat range
-- ---------------------------------------------------------------------------

alter table public.inquiries
  drop constraint inquiries_discriminated_payload_check;

alter table public.inquiries
  add constraint inquiries_discriminated_payload_check check (
    (
      kind = 'corporate'
      and job_title is not null
      and requested_seats between 2 and 200
      and interest is null
    )
    or (
      kind = 'sponsor'
      and job_title is null
      and requested_seats is null
      and interest is not null
    )
  );

comment on column public.inquiries.requested_seats is
  'Accesses in a corporate block. Two or more; 200 is a technical guard, not a commercial ceiling.';

-- ---------------------------------------------------------------------------
-- Roster
-- ---------------------------------------------------------------------------

create table public.inquiry_attendees (
  inquiry_id uuid not null
    references public.inquiries (id) on delete cascade,
  seat_number smallint not null,
  full_name text not null,
  created_at timestamptz not null default now(),
  constraint inquiry_attendees_pkey primary key (inquiry_id, seat_number),
  constraint inquiry_attendees_seat_number_check
    check (seat_number between 1 and 200),
  constraint inquiry_attendees_full_name_check
    check (
      full_name = pg_catalog.btrim(full_name)
      and pg_catalog.char_length(full_name) between 3 and 160
    )
);

comment on table public.inquiry_attendees is
  'People named in a corporate block, one row per requested access. Deleted with the inquiry it belongs to.';
comment on column public.inquiry_attendees.seat_number is
  'Position in the roster, 1..requested_seats. Ordering is the buyer''s own.';

alter table public.inquiry_attendees enable row level security;

revoke all on table public.inquiry_attendees
  from public, anon, authenticated, service_role;
grant select, insert on table public.inquiry_attendees to service_role;

-- ---------------------------------------------------------------------------
-- create_inquiry: same contract plus the roster
-- ---------------------------------------------------------------------------

drop function public.create_inquiry(
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
);

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
  p_attendees text[] default null,
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

  -- A corporate block names the people who will attend, one per requested
  -- access. Checking the count here means a caller cannot store a block whose
  -- roster silently disagrees with the number of accesses it asks for.
  if p_kind = 'corporate' then
    if p_attendees is null
       or pg_catalog.array_length(p_attendees, 1)
          is distinct from p_requested_seats::integer then
      raise exception 'attendees_required'
        using errcode = '22023';
    end if;
  elsif p_attendees is not null then
    raise exception 'attendees_not_expected'
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

    -- Only a first submission writes the roster. A replay already has it, and
    -- a payload whose roster changed is a conflict, never an overwrite.
    if p_attendees is not null then
      insert into public.inquiry_attendees (inquiry_id, seat_number, full_name)
      select
        v_inquiry_id,
        entry.ordinality::smallint,
        pg_catalog.btrim(entry.full_name)
      from pg_catalog.unnest(p_attendees)
        with ordinality as entry(full_name, ordinality);
    end if;
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
  text[],
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
  text[],
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

commit;
