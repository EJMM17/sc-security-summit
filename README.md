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

Compatible con Vercel (recomendado). El `prebuild` corre `scripts/check-env.mjs`
y aborta el build si faltan env vars o siguen siendo placeholders.

### Sincronizar env vars locales → Vercel

En lugar de pegar valores uno por uno en el dashboard:

```bash
npm i -g vercel
vercel link                  # una sola vez
npm run vercel:env:push      # sube todo .env.local a production + preview
```

Para traer los valores actuales de Vercel a tu `.env.local`:

```bash
npm run vercel:env:pull
```

Lista canónica de variables y reglas de validación: `scripts/env-spec.mjs`.
Guía completa de deploy y troubleshooting: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## Pagos (Conekta v2)

El flujo completo de pago vive en:

- `lib/conekta.ts` — wrapper REST (auth Basic con secret key, sin SDK).
- `app/actions/crear-orden-pago.ts` — Server Action con rate-limit
  (`checkOrdenRateLimit`), capacity check, idempotency por `(folio, método)`.
- `app/api/webhooks/conekta/route.ts` — recibe `order.paid` / `order.expired` /
  `order.canceled`. Always 200 (Sentry registra fallos). Opcional:
  `CONEKTA_WEBHOOK_SECRET` para validar header.
- `app/pago/page.tsx` — UI por método (SPEI clabe, OXXO barcode, tarjeta).
- `app/registro-exitoso/page.tsx` — confirmación con calendario y WhatsApp.

### Diagrama del flujo

```
Form submit
   │
   ▼
Server Action: registrar
   │  rate-limit + Turnstile + Zod + capacity
   │  insert into registros (idempotency_key UNIQUE)
   │  send registration_confirmation email
   ▼
/pago?folio=...
   │  user picks método
   ▼
Server Action: crearOrdenPago
   │  Conekta.createOrder (Idempotency-Key per folio+método)
   │  persist conekta_order_id + spei_clabe / oxxo_barcode / checkout_url
   ▼
Conekta hosted checkout / SPEI deposit / OXXO cash
   │
   ▼
Webhook: order.paid
   │  registros.estado_pago = 'pagado'
   │  audit_log row + sendPaymentConfirmation()
```

---

## Scripts

```bash
npm run dev             # dev server
npm run build           # production build (prebuild valida envs)
npm run typecheck       # tsc --noEmit
npm run lint            # eslint
npm run test            # vitest (unit)
npm run test:run        # alias used by pre-push hook + CI
npm run test:coverage   # vitest with v8 coverage
npm run test:e2e        # playwright (asume http://localhost:3000)
npm run test:e2e:ui     # playwright modo interactivo
npm run check-env       # valida .env.local sin construir
```

---

## Documentación operativa

- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — provisionamiento inicial.
- [`docs/RUNBOOK.md`](docs/RUNBOOK.md) — procedimientos de oncall y emergencias.
- [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) — diagnósticos comunes.
- [`docs/DNS.md`](docs/DNS.md) — SPF / DKIM / DMARC / Vercel apex.

---

## Calidad

- Pre-commit (`.husky/pre-commit`): `lint-staged` (ESLint --fix sobre archivos staged).
- Pre-push (`.husky/pre-push`): `typecheck` + `test:run`.
- CI (`.github/workflows/ci.yml`): typecheck → lint → unit → build → e2e
  (Playwright matrix) → Lighthouse en `main`.
- Dependabot (`.github/dependabot.yml`): npm + GitHub Actions semanales.

## Licencia

MIT. Ver [`LICENSE`](LICENSE).
