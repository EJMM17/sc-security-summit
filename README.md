# SC Security Summit 2026 — Next.js App

**Stack:** Next.js 15 · TypeScript · Zod · Supabase · Lucide React

---

## Setup rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=https://www.scsecuritysummit.com
```

> **Dónde obtener las keys:** Supabase Dashboard → Settings → API  
> Usa `service_role` (no `anon`). Esta key NUNCA llega al browser.

### 3. Crear tabla en Supabase

1. Ve a Supabase Dashboard → SQL Editor
2. Copia y ejecuta el contenido de `supabase-migration.sql`

### 4. Dev server

```bash
npm run dev
# → http://localhost:3000
```

---

## Estructura de archivos

```
app/
  layout.tsx              ← Metadata SEO global + Google Fonts
  page.tsx                ← Landing page completa
  globals.css             ← CSS variables + tipografía
  actions/
    registro.ts           ← Server Action (Zod + Supabase)
  registro/
    page.tsx              ← Página de registro con formulario

components/
  Navbar.tsx              ← Nav sticky responsive
  RegistroForm.tsx        ← Form cliente con useFormState

lib/
  supabase.ts             ← Cliente admin (service_role)
  schemas.ts              ← Zod schema + precios

supabase-migration.sql    ← DDL para crear tabla registros
.env.local.example        ← Template de variables de entorno
```

---

## Secciones de la landing

| Sección | ID | Descripción |
|---|---|---|
| Hero | — | Título, fecha, sede, CTAs |
| Tres Pilares | `#acerca` | CTPAT/OEA · Networking · Tecnología |
| Bento Grid | `#perfiles` | Asistentes + Proveedores (cuadrícula modular) |
| Conferencistas | `#conferencistas` | 4 cards con perfil verificado |
| Pricing | `#accesos` | Estudiante · General (recomendado) · VIP |
| Patrocinadores | `#patrocinadores` | Platino · Oro · Plata · Aliado Estratégico |
| Registro | `/registro` | Form con Server Action + Zod + Supabase |

---

## SEO configurado

- `metadata.title` con template
- `metadata.description`
- `metadata.alternates.canonical`
- `openGraph` (og:title, og:description, og:image, og:url)
- `twitter:card` summary_large_image
- `robots` con directivas googleBot

> Agrega el archivo `/public/og-image.jpg` (1200×630px) para completar el OG.

---

## Supabase — tabla `registros`

| Campo | Tipo | Descripción |
|---|---|---|
| folio | TEXT UNIQUE | `SCSS2026-XXXXX-XXXX` |
| email | TEXT UNIQUE | Previene registros duplicados |
| tipo_acceso | ENUM | `estudiante \| general \| vip` |
| monto_mxn | INTEGER | Precio al momento del registro |
| estado_pago | ENUM | `pendiente \| pagado \| cancelado` |

### Seguridad

- RLS habilitado — acceso público bloqueado
- Solo `service_role` puede insertar/leer
- Validación de negocio en Server Action (Zod) antes de tocar DB
- `SUPABASE_SERVICE_ROLE_KEY` nunca expuesta al cliente

---

## Deploy

```bash
npm run build
```

Compatible con Vercel (recomendado). Agrega las env vars en el dashboard de Vercel.
