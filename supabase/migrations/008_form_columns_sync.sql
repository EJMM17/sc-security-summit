-- =============================================================
-- SC Security Summit 2026 — Migration 008: Form/Schema Sync
--
-- Purpose: idempotent consolidation of every column the registration
-- Server Action writes into public.registros, so production cannot
-- silently fall behind the application. All operations are
-- IF NOT EXISTS / DROP-then-CREATE, safe to re-run.
--
-- Apply via:  Supabase Dashboard → SQL Editor → paste & run
--   (or)     supabase db push   when a CLI is wired up
-- =============================================================

-- 1. Core columns (covered by initial migration + 002)
ALTER TABLE public.registros
  ADD COLUMN IF NOT EXISTS folio                 TEXT,
  ADD COLUMN IF NOT EXISTS nombre                TEXT,
  ADD COLUMN IF NOT EXISTS apellido              TEXT,
  ADD COLUMN IF NOT EXISTS email                 TEXT,
  ADD COLUMN IF NOT EXISTS telefono              TEXT,
  ADD COLUMN IF NOT EXISTS empresa               TEXT,
  ADD COLUMN IF NOT EXISTS cargo                 TEXT,
  ADD COLUMN IF NOT EXISTS tipo_acceso           TEXT,
  ADD COLUMN IF NOT EXISTS monto_mxn             INTEGER,
  ADD COLUMN IF NOT EXISTS estado_pago           TEXT DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS credencial_estudiantil BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMPTZ;

-- 2. CFDI / Facturación
ALTER TABLE public.registros
  ADD COLUMN IF NOT EXISTS requiere_cfdi         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rfc                   TEXT,
  ADD COLUMN IF NOT EXISTS razon_social          TEXT,
  ADD COLUMN IF NOT EXISTS codigo_postal_fiscal  TEXT;

-- 3. Auditoría / atribución (migration 002 + 20260505 columns)
ALTER TABLE public.registros
  ADD COLUMN IF NOT EXISTS ip_registro           TEXT,
  ADD COLUMN IF NOT EXISTS user_agent            TEXT,
  ADD COLUMN IF NOT EXISTS referer               TEXT,
  ADD COLUMN IF NOT EXISTS utm_source            TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium            TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign          TEXT,
  ADD COLUMN IF NOT EXISTS metodo_pago           TEXT DEFAULT 'transferencia_manual',
  ADD COLUMN IF NOT EXISTS pagado_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notas_internas        TEXT;

-- 4. Constraints (drop+recreate so they're current)
ALTER TABLE public.registros DROP CONSTRAINT IF EXISTS registros_tipo_acceso_check;
ALTER TABLE public.registros
  ADD CONSTRAINT registros_tipo_acceso_check
  CHECK (tipo_acceso IN ('estudiante', 'general', 'vip'));

ALTER TABLE public.registros DROP CONSTRAINT IF EXISTS registros_estado_pago_check;
ALTER TABLE public.registros
  ADD CONSTRAINT registros_estado_pago_check
  CHECK (estado_pago IN ('pendiente', 'pagado', 'cancelado'));

ALTER TABLE public.registros DROP CONSTRAINT IF EXISTS registros_metodo_pago_check;
ALTER TABLE public.registros
  ADD CONSTRAINT registros_metodo_pago_check
  CHECK (metodo_pago IN ('spei', 'tarjeta', 'oxxo', 'transferencia_manual'));

-- 5. Uniqueness (idempotent — only add if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'registros_email_unique'
  ) THEN
    ALTER TABLE public.registros ADD CONSTRAINT registros_email_unique UNIQUE (email);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'registros_folio_unique'
  ) THEN
    ALTER TABLE public.registros ADD CONSTRAINT registros_folio_unique UNIQUE (folio);
  END IF;
END$$;

-- 6. Índices que la app espera
CREATE INDEX IF NOT EXISTS registros_email_idx        ON public.registros(email);
CREATE INDEX IF NOT EXISTS registros_tipo_acceso_idx  ON public.registros(tipo_acceso);
CREATE INDEX IF NOT EXISTS registros_estado_pago_idx  ON public.registros(estado_pago);
CREATE INDEX IF NOT EXISTS registros_created_at_idx   ON public.registros(created_at DESC);
CREATE INDEX IF NOT EXISTS registros_requiere_cfdi_idx ON public.registros(requiere_cfdi);
CREATE INDEX IF NOT EXISTS registros_estado_pago_created_at_idx
  ON public.registros(estado_pago, created_at DESC);

-- 7. RLS sanity (deny anon/authenticated; service_role only)
ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, SELECT, UPDATE, DELETE ON public.registros FROM anon;
REVOKE INSERT, SELECT, UPDATE, DELETE ON public.registros FROM authenticated;

DROP POLICY IF EXISTS service_role_full_access ON public.registros;
CREATE POLICY service_role_full_access ON public.registros
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================
-- Post-apply sanity checks:
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'registros'
--   ORDER BY ordinal_position;
--
--   SELECT conname, pg_get_constraintdef(oid)
--   FROM pg_constraint
--   WHERE conrelid = 'public.registros'::regclass;
-- =============================================================
