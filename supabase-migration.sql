-- =============================================================
-- SC Security Summit 2026 — Supabase Migration
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================

-- 1. Tabla de registros
CREATE TABLE IF NOT EXISTS public.registros (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  folio                 TEXT NOT NULL UNIQUE,
  nombre                TEXT NOT NULL,
  apellido              TEXT NOT NULL,
  email                 TEXT NOT NULL,
  telefono              TEXT,
  empresa               TEXT NOT NULL,
  cargo                 TEXT NOT NULL,
  tipo_acceso           TEXT NOT NULL CHECK (tipo_acceso IN ('estudiante', 'general', 'vip')),
  monto_mxn             INTEGER NOT NULL,
  estado_pago           TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'pagado', 'cancelado')),
  credencial_estudiantil BOOLEAN NOT NULL DEFAULT false,
  notas_internas        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS registros_email_idx ON public.registros(email);
CREATE INDEX IF NOT EXISTS registros_tipo_acceso_idx ON public.registros(tipo_acceso);
CREATE INDEX IF NOT EXISTS registros_estado_pago_idx ON public.registros(estado_pago);
CREATE INDEX IF NOT EXISTS registros_created_at_idx ON public.registros(created_at DESC);

-- 3. Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.registros;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.registros
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Row Level Security
ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros FORCE ROW LEVEL SECURITY;

-- Política estricta: solo service_role puede operar sobre registros.
-- Esta política cubre SELECT/INSERT/UPDATE/DELETE.
-- El rol service_role se usa en Server Actions del backend, nunca en el browser.
DROP POLICY IF EXISTS "service_role_full_access" ON public.registros;
CREATE POLICY "service_role_full_access" ON public.registros
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Política para usuarios autenticados (authenticated): sin acceso directo.
-- No se crean políticas para authenticated/anon, por lo que RLS bloquea
-- lectura/escritura por defecto para clientes de navegador.
-- FORCE ROW LEVEL SECURITY asegura que incluso el owner de la tabla
-- respete las políticas RLS.

-- 5. Constraint de unicidad de email por edición
ALTER TABLE public.registros
  ADD CONSTRAINT registros_email_unique UNIQUE (email);

-- =============================================================
-- Para verificar la tabla:
-- SELECT * FROM public.registros ORDER BY created_at DESC;
-- 
-- Para ver estadísticas por tipo de acceso:
-- SELECT tipo_acceso, count(*), sum(monto_mxn) FROM registros GROUP BY tipo_acceso;
-- =============================================================
