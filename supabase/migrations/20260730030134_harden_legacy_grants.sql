-- SC Security Summit 2026
-- Remove inherited browser-role privileges from the retired registration
-- domain. This migration changes ACLs and view security only; it never changes
-- rows.
--
-- Forward plan:
--   Humans operate legacy records through Supabase Studio as postgres. The
--   current server application has no dependency on legacy tables/functions.
--
-- Operational rollback:
--   If a documented server-only legacy dependency is discovered, add only its
--   exact service_role privilege in a new migration. Never restore privileges
--   to PUBLIC, anon or authenticated, and never roll back by editing this file.

begin;

alter table public.registros enable row level security;
alter table public.admins enable row level security;
alter table public.app_config enable row level security;
alter table public.app_secrets enable row level security;
alter table public.audit_log enable row level security;
alter table public.email_events enable row level security;

drop policy if exists allow_service_select on public.registros;
drop policy if exists allow_service_update on public.registros;
drop policy if exists deny_anon_all on public.registros;
drop policy if exists service_role_all on public.registros;
drop policy if exists service_role_full_access on public.registros;
drop policy if exists deny_anon_all_admins on public.admins;
drop policy if exists service_role_full_access_admins on public.admins;
drop policy if exists service_role_app_config on public.app_config;
drop policy if exists service_role_secrets on public.app_secrets;
drop policy if exists service_role_audit on public.audit_log;
drop policy if exists deny_anon_all_email_events on public.email_events;

revoke all on table public.registros
  from public, anon, authenticated, service_role;
revoke all on table public.admins
  from public, anon, authenticated, service_role;
revoke all on table public.app_config
  from public, anon, authenticated, service_role;
revoke all on table public.app_secrets
  from public, anon, authenticated, service_role;
revoke all on table public.audit_log
  from public, anon, authenticated, service_role;
revoke all on table public.email_events
  from public, anon, authenticated, service_role;
revoke all on table public.admin_registros_view
  from public, anon, authenticated, service_role;

-- postgres is the controlled Studio/maintenance identity. Explicit grants keep
-- the intended operator path obvious even where postgres already owns objects.
grant all privileges on table public.registros to postgres;
grant all privileges on table public.admins to postgres;
grant all privileges on table public.app_config to postgres;
grant all privileges on table public.app_secrets to postgres;
grant all privileges on table public.audit_log to postgres;
grant all privileges on table public.email_events to postgres;
grant select on table public.admin_registros_view to postgres;

-- No current application path needs service_role access to retired objects.
-- New-domain grants remain explicit in add_inquiry_persistence.

revoke all privileges on all sequences in schema public
  from public, anon, authenticated;
grant all privileges on all sequences in schema public to postgres;

revoke all privileges on all functions in schema public
  from public, anon, authenticated;
grant execute on all functions in schema public to postgres;

do $block$
declare
  v_function record;
begin
  for v_function in
    select p.oid::regprocedure as identity
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'get_cupos_disponibles',
        'notify_new_registro',
        'set_updated_at',
        'update_updated_at_column'
      )
  loop
    execute format(
      'revoke all privileges on function %s from service_role',
      v_function.identity
    );
  end loop;
end;
$block$;

alter function public.set_updated_at() security invoker;
alter function public.set_updated_at() set search_path = '';
alter function public.update_updated_at_column() security invoker;
alter function public.update_updated_at_column() set search_path = '';
alter function public.get_cupos_disponibles() security invoker;
alter function public.get_cupos_disponibles() set search_path = '';

alter view public.admin_registros_view set (security_invoker = true);

-- Make future objects deny-by-default. Every server API migration must grant
-- service_role explicitly after creating its tables/functions/sequences.
alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on functions from public, anon, authenticated, service_role;

comment on view public.admin_registros_view is
  'Retired operator view; security_invoker prevents owner-privilege bypass.';

commit;
