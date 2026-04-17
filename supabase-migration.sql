-- =============================================================
-- SC Security Summit 2026 — Supabase Migration v2
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
  -- CFDI / Facturación
  requiere_cfdi         BOOLEAN NOT NULL DEFAULT false,
  rfc                   TEXT,
  razon_social          TEXT,
  codigo_postal_fiscal  TEXT,
  -- Internal
  notas_internas        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS registros_email_idx        ON public.registros(email);
CREATE INDEX IF NOT EXISTS registros_tipo_acceso_idx  ON public.registros(tipo_acceso);
CREATE INDEX IF NOT EXISTS registros_estado_pago_idx  ON public.registros(estado_pago);
CREATE INDEX IF NOT EXISTS registros_created_at_idx   ON public.registros(created_at DESC);
CREATE INDEX IF NOT EXISTS registros_requiere_cfdi_idx ON public.registros(requiere_cfdi);

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

-- Solo el service_role puede insertar/leer/actualizar
CREATE POLICY "service_role_full_access" ON public.registros
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Constraint de unicidad de email
ALTER TABLE public.registros
  ADD CONSTRAINT IF NOT EXISTS registros_email_unique UNIQUE (email);

-- =============================================================
-- MIGRACIÓN ADICIONAL (si la tabla ya existe — agregar columnas CFDI):
-- ALTER TABLE public.registros ADD COLUMN IF NOT EXISTS requiere_cfdi BOOLEAN NOT NULL DEFAULT false;
-- ALTER TABLE public.registros ADD COLUMN IF NOT EXISTS rfc TEXT;
-- ALTER TABLE public.registros ADD COLUMN IF NOT EXISTS razon_social TEXT;
-- ALTER TABLE public.registros ADD COLUMN IF NOT EXISTS codigo_postal_fiscal TEXT;
-- =============================================================

-- =============================================================
-- Para verificar la tabla:
-- SELECT * FROM public.registros ORDER BY created_at DESC;
--
-- Estadísticas por tipo de acceso:
-- SELECT tipo_acceso, count(*), sum(monto_mxn) FROM registros GROUP BY tipo_acceso;
--
-- Registros que requieren CFDI:
-- SELECT folio, nombre, apellido, empresa, rfc, razon_social FROM registros WHERE requiere_cfdi = true;
-- =============================================================
