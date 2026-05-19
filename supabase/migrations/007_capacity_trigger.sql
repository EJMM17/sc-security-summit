-- =============================================================
-- SC Security Summit 2026 — Migration 007: DB-level capacity enforcement
-- =============================================================
-- Enables the capacity trigger at the database level so that
-- over-booking cannot occur even if the application is bypassed.
-- Depends on: get_cupos_disponibles() from migration 006.
-- =============================================================

CREATE OR REPLACE FUNCTION public.check_capacity_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (SELECT public.get_cupos_disponibles()) <= 0 THEN
    RAISE EXCEPTION 'capacity_exceeded'
      USING DETAIL = 'No hay lugares disponibles.',
            HINT   = 'CAPACITY_EXCEEDED';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.check_capacity_before_insert() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_capacity_before_insert() TO service_role;

DROP TRIGGER IF EXISTS enforce_capacity ON public.registros;
CREATE TRIGGER enforce_capacity
  BEFORE INSERT ON public.registros
  FOR EACH ROW EXECUTE FUNCTION public.check_capacity_before_insert();
