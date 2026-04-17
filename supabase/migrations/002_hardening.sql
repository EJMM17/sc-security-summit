-- =============================================================
-- SC Security Summit 2026 — Migration 002: Security Hardening
-- =============================================================

-- 1. Revocar insert del rol anon (solo service_role puede insertar)
REVOKE INSERT, SELECT, UPDATE, DELETE ON public.registros FROM anon;
REVOKE INSERT, SELECT, UPDATE, DELETE ON public.registros FROM authenticated;

-- 2. Eliminar la política permisiva si existe
DROP POLICY IF EXISTS allow_public_insert ON public.registros;

-- 3. Asegurar que la política service_role_full_access existe
DROP POLICY IF EXISTS service_role_full_access ON public.registros;
CREATE POLICY service_role_full_access ON public.registros
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Endurecer funciones con search_path (previene secuestro de schema)
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.notify_new_registro() SET search_path = public, pg_temp;

-- 5. Agregar columnas de auditoría y atribución
ALTER TABLE public.registros
  ADD COLUMN IF NOT EXISTS ip_registro   TEXT,
  ADD COLUMN IF NOT EXISTS user_agent    TEXT,
  ADD COLUMN IF NOT EXISTS utm_source    TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium    TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign  TEXT,
  ADD COLUMN IF NOT EXISTS referer       TEXT;

-- 6. Validación adicional: monto debe corresponder al tipo_acceso
ALTER TABLE public.registros DROP CONSTRAINT IF EXISTS registros_monto_valido;
ALTER TABLE public.registros ADD CONSTRAINT registros_monto_valido CHECK (
  (tipo_acceso = 'estudiante' AND monto_mxn = 1200) OR
  (tipo_acceso = 'general'    AND monto_mxn = 5800) OR
  (tipo_acceso = 'vip'        AND monto_mxn = 7200)
);

-- 7. Validación de formato de email a nivel de DB
ALTER TABLE public.registros DROP CONSTRAINT IF EXISTS registros_email_formato;
ALTER TABLE public.registros ADD CONSTRAINT registros_email_formato CHECK (
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- 8. Mover pg_net del schema public a extensions (si no está ya hecho)
CREATE SCHEMA IF NOT EXISTS extensions;
-- nota: si pg_net ya está en public, moverlo requiere recrearlo.
-- por ahora lo dejamos documentado para revisión manual.

-- =============================================================
-- Nota: aplicar vía Supabase Dashboard → SQL Editor, o vía CLI:
--   supabase db push
-- =============================================================
