-- =============================================================
-- SC Security Summit 2026 — Migration 005: Update price tiers
-- =============================================================
-- Replaces the monto_mxn CHECK constraint from migration 002 to
-- reflect the current business prices:
--   Estudiante $850 · General $2,200 · VIP $4,800 (MXN, sin IVA)
-- =============================================================

ALTER TABLE public.registros DROP CONSTRAINT IF EXISTS registros_monto_valido;
ALTER TABLE public.registros ADD CONSTRAINT registros_monto_valido CHECK (
  (tipo_acceso = 'estudiante' AND monto_mxn = 850)  OR
  (tipo_acceso = 'general'    AND monto_mxn = 2200) OR
  (tipo_acceso = 'vip'        AND monto_mxn = 4800)
);
