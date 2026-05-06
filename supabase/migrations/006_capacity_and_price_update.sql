-- =============================================================
-- SC Security Summit 2026 — Migration 006: Price update + capacity RPC
-- =============================================================
-- 1. Update general access price 2200 -> 2500 (sin IVA)
-- 2. Add capacity tracking via app_config row + get_cupos_disponibles RPC
-- =============================================================

-- ── 1. Refresh price CHECK constraint ────────────────────────────────────────
ALTER TABLE public.registros DROP CONSTRAINT IF EXISTS registros_monto_valido;
ALTER TABLE public.registros ADD CONSTRAINT registros_monto_valido CHECK (
  (tipo_acceso = 'estudiante' AND monto_mxn = 850)  OR
  (tipo_acceso = 'general'    AND monto_mxn = 2500) OR
  (tipo_acceso = 'vip'        AND monto_mxn = 4800)
);

-- ── 2. Capacity configuration table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_config (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_config FROM anon, authenticated;

INSERT INTO public.app_config (key, value)
VALUES ('capacity_total', '500'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ── 3. RPC: get_cupos_disponibles ────────────────────────────────────────────
-- Returns remaining seats: capacity_total - count(estado_pago != 'cancelado').
-- SECURITY DEFINER so service_role + edge functions can call without table grants.
CREATE OR REPLACE FUNCTION public.get_cupos_disponibles()
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  total    INTEGER;
  consumed INTEGER;
BEGIN
  SELECT COALESCE((value)::text::int, 500) INTO total
  FROM public.app_config WHERE key = 'capacity_total';

  SELECT COUNT(*)::int INTO consumed
  FROM public.registros
  WHERE estado_pago <> 'cancelado';

  RETURN GREATEST(total - consumed, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.get_cupos_disponibles() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_cupos_disponibles() TO service_role;
