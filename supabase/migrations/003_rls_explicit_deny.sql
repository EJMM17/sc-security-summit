-- =============================================================
-- SC Security Summit 2026 — Migration 003: Explicit RLS deny
-- =============================================================
-- Defense-in-depth on top of migration 002.
--
-- Migration 002 already REVOKEs INSERT/SELECT/UPDATE/DELETE from anon and
-- authenticated, and creates `service_role_full_access` for service_role.
-- However, a future operator could accidentally GRANT or create a permissive
-- policy. An explicit DENY policy ensures that any row-level evaluation for
-- anon/authenticated returns false even if grants are mistakenly restored.
--
-- service_role bypasses RLS entirely (BYPASSRLS attribute), so this policy
-- does NOT affect server-side admin operations.
-- =============================================================

DROP POLICY IF EXISTS deny_anon_all ON public.registros;
CREATE POLICY deny_anon_all ON public.registros
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- =============================================================
-- Verification (run manually after applying):
--
--   -- Should return 0 rows even with anon JWT:
--   SET ROLE anon;
--   SELECT count(*) FROM public.registros;
--   RESET ROLE;
--
--   -- Should fail with: "new row violates row-level security policy":
--   SET ROLE anon;
--   INSERT INTO public.registros (folio, nombre, apellido, email, empresa,
--     cargo, tipo_acceso, monto_mxn, estado_pago)
--     VALUES ('SCSS2026-TEST-DENY', 'X', 'Y', 'x@y.z', 'A', 'B',
--     'general', 5800, 'pendiente');
--   RESET ROLE;
-- =============================================================
