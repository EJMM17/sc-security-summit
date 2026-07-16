-- =============================================================
-- SC Security Summit 2026 — Migration 011: códigos de descuento
-- =============================================================
-- Fase 1 del plan Openpay (docs/PLAN_OPENPAY_DESCUENTOS.md):
--   1. Tabla codigos_descuento (RLS bloqueado, solo service_role).
--   2. Funciones redimir_codigo / liberar_codigo — la redención es un
--      UPDATE atómico condicionado, por lo que dos registros simultáneos
--      nunca pueden rebasar max_usos.
--   3. registros: columnas codigo_descuento / descuento_mxn.
--   4. registros_monto_valido pasa de "precio exacto por tier" a
--      "monto cobrado + descuento = precio de lista" — la integridad
--      del precio se conserva con descuentos.
--   5. metodo_pago admite 'cortesia' (descuento del 100 %).
-- =============================================================

-- ── 1. Tabla de códigos ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.codigos_descuento (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          TEXT NOT NULL UNIQUE
                    CHECK (codigo ~ '^[A-Z0-9_-]{4,32}$'),
  descripcion     TEXT,
  tipo_descuento  TEXT NOT NULL CHECK (tipo_descuento IN ('porcentaje', 'monto_fijo')),
  -- porcentaje: 1–100. monto_fijo: MXN > 0 (se topa al precio del tier al aplicar).
  valor           NUMERIC(10,2) NOT NULL CHECK (valor > 0),
  aplica_a        TEXT[] DEFAULT NULL
                    CHECK (aplica_a IS NULL OR aplica_a <@ ARRAY['estudiante','general','vip']),
  max_usos        INTEGER DEFAULT NULL CHECK (max_usos IS NULL OR max_usos > 0),
  usos            INTEGER NOT NULL DEFAULT 0 CHECK (usos >= 0),
  valido_desde    TIMESTAMPTZ NOT NULL DEFAULT now(),
  valido_hasta    TIMESTAMPTZ DEFAULT NULL,
  activo          BOOLEAN NOT NULL DEFAULT true,
  created_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.codigos_descuento
  ADD CONSTRAINT codigos_descuento_porcentaje_max
  CHECK (tipo_descuento <> 'porcentaje' OR valor <= 100);

CREATE INDEX IF NOT EXISTS codigos_descuento_activo_idx
  ON public.codigos_descuento (activo, valido_hasta);

-- updated_at automático (reutiliza la función de la migración base)
DROP TRIGGER IF EXISTS set_updated_at_codigos ON public.codigos_descuento;
CREATE TRIGGER set_updated_at_codigos
  BEFORE UPDATE ON public.codigos_descuento
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ── RLS: mismo patrón que 009_email_events ───────────────────────────────────
ALTER TABLE public.codigos_descuento ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.codigos_descuento FROM anon, authenticated;

DROP POLICY IF EXISTS deny_anon_all_codigos ON public.codigos_descuento;
CREATE POLICY deny_anon_all_codigos ON public.codigos_descuento
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- ── 2. Redención atómica ─────────────────────────────────────────────────────
-- Devuelve (tipo_descuento, valor) si el código es válido para el tier y
-- consume un uso; no devuelve filas si es inválido/agotado/vencido.
CREATE OR REPLACE FUNCTION public.redimir_codigo(
  p_codigo TEXT,
  p_tipo_acceso TEXT
)
RETURNS TABLE (tipo_descuento TEXT, valor NUMERIC)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.codigos_descuento c
     SET usos = c.usos + 1
   WHERE c.codigo = p_codigo
     AND c.activo
     AND now() >= c.valido_desde
     AND (c.valido_hasta IS NULL OR now() <= c.valido_hasta)
     AND (c.max_usos IS NULL OR c.usos < c.max_usos)
     AND (c.aplica_a IS NULL OR p_tipo_acceso = ANY(c.aplica_a))
  RETURNING c.tipo_descuento, c.valor;
$$;

-- Compensación: si el INSERT del registro falla después de redimir,
-- se libera el uso consumido.
CREATE OR REPLACE FUNCTION public.liberar_codigo(p_codigo TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.codigos_descuento
     SET usos = GREATEST(usos - 1, 0)
   WHERE codigo = p_codigo;
$$;

REVOKE ALL ON FUNCTION public.redimir_codigo(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.liberar_codigo(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redimir_codigo(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.liberar_codigo(TEXT) TO service_role;

-- ── 3. Columnas en registros ─────────────────────────────────────────────────
ALTER TABLE public.registros
  ADD COLUMN IF NOT EXISTS codigo_descuento TEXT,
  ADD COLUMN IF NOT EXISTS descuento_mxn    INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS registros_codigo_descuento_idx
  ON public.registros (codigo_descuento)
  WHERE codigo_descuento IS NOT NULL;

-- ── 4. Integridad de precio con descuento ────────────────────────────────────
-- Antes: monto_mxn debía ser el precio exacto del tier (006).
-- Ahora: lo cobrado + el descuento debe cuadrar con el precio de lista.
ALTER TABLE public.registros DROP CONSTRAINT IF EXISTS registros_monto_valido;
ALTER TABLE public.registros ADD CONSTRAINT registros_monto_valido CHECK (
  monto_mxn >= 0 AND descuento_mxn >= 0 AND (
    (tipo_acceso = 'estudiante' AND monto_mxn + descuento_mxn = 850)  OR
    (tipo_acceso = 'general'    AND monto_mxn + descuento_mxn = 2500) OR
    (tipo_acceso = 'vip'        AND monto_mxn + descuento_mxn = 4800)
  )
);

-- ── 5. metodo_pago admite cortesía (descuento 100 %) ─────────────────────────
ALTER TABLE public.registros DROP CONSTRAINT IF EXISTS registros_metodo_pago_check;
ALTER TABLE public.registros
  ADD CONSTRAINT registros_metodo_pago_check
  CHECK (metodo_pago IN ('spei', 'tarjeta', 'oxxo', 'transferencia_manual', 'cortesia'));

-- =============================================================
-- Post-apply sanity checks:
--   SELECT proname, prosecdef FROM pg_proc WHERE proname IN ('redimir_codigo','liberar_codigo');
--   INSERT INTO codigos_descuento (codigo, tipo_descuento, valor, max_usos)
--     VALUES ('PRUEBA-20', 'porcentaje', 20, 5);
--   SELECT * FROM redimir_codigo('PRUEBA-20', 'general');  -- consume 1 uso
--   SELECT liberar_codigo('PRUEBA-20');                    -- lo devuelve
--   DELETE FROM codigos_descuento WHERE codigo = 'PRUEBA-20';
-- =============================================================
