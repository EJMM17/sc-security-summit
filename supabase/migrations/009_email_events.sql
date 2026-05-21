-- =============================================================
-- SC Security Summit 2026 — Migration 009: email_events audit table
-- =============================================================
-- Append-only audit trail for every transactional email attempt
-- (confirmation, resend, recovery). Used for observability and to
-- enforce idempotency on the registration confirmation email.
--
-- `folio` is intentionally NOT a foreign key: the audit row must
-- survive even if a registro is deleted.
--
-- RLS is enabled and locked down — only service_role (which bypasses
-- RLS) may read/write. anon/authenticated are explicitly denied so an
-- accidental future GRANT cannot expose email/PII to the client.
-- =============================================================

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  folio text,
  email text not null,
  type text not null,
  provider text not null default 'resend',
  status text not null,
  provider_message_id text,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists email_events_folio_idx
  on public.email_events (folio);
create index if not exists email_events_email_idx
  on public.email_events (email);
create index if not exists email_events_type_status_idx
  on public.email_events (type, status);

-- Idempotency guard: at most one *successful* confirmation email per folio.
create unique index if not exists email_events_registration_sent_once_idx
  on public.email_events (folio, type)
  where status = 'sent' and type = 'registration_confirmation';

-- =============================================================
-- Row Level Security
-- =============================================================
alter table public.email_events enable row level security;

revoke all on public.email_events from anon, authenticated;

-- Defense-in-depth: explicit deny for anon/authenticated even if a
-- permissive grant is mistakenly restored later. service_role has
-- BYPASSRLS, so server-side writes are unaffected.
drop policy if exists deny_anon_all_email_events on public.email_events;
create policy deny_anon_all_email_events on public.email_events
  for all
  to anon, authenticated
  using (false)
  with check (false);
