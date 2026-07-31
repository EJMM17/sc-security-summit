-- SC Security Summit 2026
-- Permanently retire the registration database webhook and pg_net dependency.
--
-- The hosted trigger is disabled, but its function still contains obsolete
-- authentication material. Dropping pg_net with RESTRICT makes this migration
-- fail safely if an undiscovered dependency remains: the surrounding
-- transaction then preserves the trigger and function for investigation.
--
-- Operational rollback:
--   Roll back the application or Edge Function deployment if necessary. Do not
--   recreate this trigger/function, do not reinstall pg_net, and never restore
--   the embedded secret. A replacement must use a new reviewed migration and a
--   managed secret.

begin;

drop trigger if exists trg_send_confirmation_email on public.registros;
drop function if exists public.notify_new_registro();
drop extension if exists pg_net restrict;

commit;
