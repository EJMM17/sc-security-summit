-- =============================================================
-- FASE 2: SUPABASE ENTERPRISE MIGRATION
-- Apply via: supabase db push   (or paste in SQL Editor → Production)
-- Idempotent — safe to re-run.
-- =============================================================

-- 2.1 Columnas de pagos --------------------------------------------------------
ALTER TABLE public.registros
  ADD COLUMN IF NOT EXISTS metodo_pago TEXT DEFAULT 'spei'
    CHECK (metodo_pago IN ('spei', 'tarjeta', 'oxxo', 'transferencia_manual')),
  ADD COLUMN IF NOT EXISTS conekta_order_id TEXT,
  ADD COLUMN IF NOT EXISTS conekta_charge_id TEXT,
  ADD COLUMN IF NOT EXISTS conekta_checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS spei_clabe TEXT,
  ADD COLUMN IF NOT EXISTS spei_reference TEXT,
  ADD COLUMN IF NOT EXISTS oxxo_barcode_url TEXT,
  ADD COLUMN IF NOT EXISTS oxxo_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pagado_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS conekta_payment_status TEXT DEFAULT 'pending'
    CHECK (conekta_payment_status IN ('pending', 'paid', 'expired', 'canceled', 'failed')),
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'registros_idempotency_key_unique'
  ) THEN
    ALTER TABLE public.registros
      ADD CONSTRAINT registros_idempotency_key_unique UNIQUE (idempotency_key);
  END IF;
END$$;

-- 2.2 Índices performance ------------------------------------------------------
CREATE INDEX IF NOT EXISTS registros_conekta_order_id_idx       ON public.registros(conekta_order_id);
CREATE INDEX IF NOT EXISTS registros_metodo_pago_idx            ON public.registros(metodo_pago);
CREATE INDEX IF NOT EXISTS registros_conekta_payment_status_idx ON public.registros(conekta_payment_status);
CREATE INDEX IF NOT EXISTS registros_pagado_at_idx              ON public.registros(pagado_at DESC);
CREATE INDEX IF NOT EXISTS registros_idempotency_key_idx        ON public.registros(idempotency_key);
CREATE INDEX IF NOT EXISTS registros_ip_address_idx             ON public.registros(ip_address);

-- 2.3 Capacidad y cupos --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_cupos_disponibles()
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  total_pagados INTEGER;
  capacidad     INTEGER := 500;
BEGIN
  SELECT COUNT(*) INTO total_pagados
  FROM public.registros
  WHERE estado_pago = 'pagado';
  RETURN GREATEST(capacidad - total_pagados, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.get_cupos_disponibles() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_cupos_disponibles() TO service_role;

-- 2.4 Trigger opcional de capacidad (descomentar para hard-block en DB) -------
-- CREATE OR REPLACE FUNCTION public.check_capacity()
-- RETURNS TRIGGER
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = public, pg_temp
-- AS $$
-- BEGIN
--   IF (SELECT public.get_cupos_disponibles()) <= 0 THEN
--     RAISE EXCEPTION 'Capacidad agotada.';
--   END IF;
--   RETURN NEW;
-- END;
-- $$;
-- DROP TRIGGER IF EXISTS ensure_capacity ON public.registros;
-- CREATE TRIGGER ensure_capacity BEFORE INSERT ON public.registros
--   FOR EACH ROW EXECUTE FUNCTION public.check_capacity();

-- 2.5 Vista admin optimizada ---------------------------------------------------
CREATE OR REPLACE VIEW public.admin_registros_view AS
SELECT
  id, folio, nombre, apellido, email, telefono, empresa, cargo,
  tipo_acceso, monto_mxn, estado_pago, metodo_pago, conekta_payment_status,
  conekta_order_id, spei_clabe, spei_reference, pagado_at, created_at,
  requiere_cfdi, rfc, razon_social, ip_address
FROM public.registros
ORDER BY created_at DESC;

REVOKE ALL ON public.admin_registros_view FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.admin_registros_view TO service_role;

-- 2.6 Audit log ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evento TEXT NOT NULL,
  folio TEXT,
  usuario_email TEXT,
  ip TEXT,
  user_agent TEXT,
  detalles JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_log_folio_idx      ON public.audit_log(folio);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON public.audit_log(created_at DESC);

-- 2.7 Secrets de app (fallback si Vercel falla) -------------------------------
CREATE TABLE IF NOT EXISTS public.app_secrets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.8 Comentarios documentación -----------------------------------------------
COMMENT ON COLUMN public.registros.conekta_order_id IS 'ID de orden Conekta v2';
COMMENT ON COLUMN public.registros.spei_clabe       IS 'CLABE interbancaria SPEI';
COMMENT ON COLUMN public.registros.idempotency_key  IS 'UUID para prevenir duplicados';

-- 2.9 Row Level Security reforzado --------------------------------------------
ALTER TABLE public.registros   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

-- 2.10 Políticas (service_role ya tiene bypass; defensa en profundidad) -------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'registros' AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY "service_role_all" ON public.registros
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'audit_log' AND policyname = 'service_role_audit'
  ) THEN
    CREATE POLICY "service_role_audit" ON public.audit_log
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'app_secrets' AND policyname = 'service_role_secrets'
  ) THEN
    CREATE POLICY "service_role_secrets" ON public.app_secrets
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END$$;
