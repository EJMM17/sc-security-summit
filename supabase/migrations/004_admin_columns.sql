-- =============================================================
-- SC Security Summit 2026 — Migration 004: Admin tracking columns
-- =============================================================
-- Columns the /admin dashboard writes when an operator marks a
-- registration paid or cancelled. Nullable + idempotent.
--
-- Apply with: supabase db push
-- =============================================================

ALTER TABLE public.registros
  ADD COLUMN IF NOT EXISTS pagado_en          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pagado_por         TEXT,
  ADD COLUMN IF NOT EXISTS pago_nota          TEXT,
  ADD COLUMN IF NOT EXISTS cancelado_en       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelado_por      TEXT,
  ADD COLUMN IF NOT EXISTS cancelacion_nota   TEXT;

-- Index for the dashboard's "filter by estado_pago" query — small table
-- today, but the dashboard sorts by created_at within each status filter.
CREATE INDEX IF NOT EXISTS registros_estado_pago_idx
  ON public.registros (estado_pago, created_at DESC);

-- Index for the search filter ILIKE %q% on folio / email / empresa.
-- pg_trgm is overkill for ~1k rows; the planner uses seq scan anyway.
-- We add btree on (created_at) for ordering and rely on small table size.
CREATE INDEX IF NOT EXISTS registros_created_at_idx
  ON public.registros (created_at DESC);
