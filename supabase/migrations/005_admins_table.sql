-- =============================================================
-- SC Security Summit 2026 — Migration 005: Admins table
-- =============================================================
-- Replaces the env-based ADMIN_EMAILS allowlist with a proper
-- database table for admin users. Passwords are bcrypt-hashed
-- in the application layer; the DB never sees plaintext.
--
-- Apply with: supabase db push
-- =============================================================

CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nombre TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS hardening (same pattern as public.registros)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.admins FROM anon, authenticated;

CREATE POLICY service_role_full_access_admins ON public.admins
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY deny_anon_all_admins ON public.admins
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Index for login lookups by email
CREATE INDEX IF NOT EXISTS admins_email_idx ON public.admins (email);

-- =============================================================
-- Seed your first admin (run manually after migration):
--
--   The password hash below is for 'admin123' with bcrypt cost 12.
--   Change it immediately after first login.
--
-- INSERT INTO public.admins (email, password_hash, nombre)
-- VALUES (
--   'admin@example.com',
--   '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW',
--   'Administrador Principal'
-- )
-- ON CONFLICT (email) DO NOTHING;
--
-- To generate a new hash from a password in Node.js:
--   const bcrypt = require('bcryptjs');
--   console.log(bcrypt.hashSync('your-password', 12));
-- =============================================================
