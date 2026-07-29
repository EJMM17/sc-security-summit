# SC Security Summit 2026 — Next.js App

**Stack:** Next.js 15 (App Router) · TypeScript · Zod · Resend · Upstash · Lucide React

Sitio de marketing bilingüe (ES/EN) del summit. La venta de accesos individuales ocurre
**fuera del sitio, en Eventbrite**; el sitio solo captura solicitudes de **pase corporativo**
y de **patrocinio**, que se entregan por correo vía Resend. No hay base de datos en runtime.

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

Lo mínimo para que los formularios funcionen:

```
RESEND_API_KEY=re_...                  # https://resend.com → API Keys
CONTACT_EMAIL=hola@scsecuritysummit.com
NEXT_PUBLIC_SITE_URL=https://www.scsecuritysummit.com
NEXT_PUBLIC_EVENTBRITE_URL=https://www.eventbrite.com.mx/e/...
```

Sin `RESEND_API_KEY` el formulario acepta el envío pero el correo no sale.
`UPSTASH_REDIS_REST_URL` / `_TOKEN` son obligatorias en producción: el rate limiting
falla cerrado si no están.

### 3. Dev server

```bash
npm run dev
# → http://localhost:3000
```

---

## Estructura de archivos

```
app/
  layout.tsx                  ← Metadata SEO global + fuentes
  page.tsx                    ← Landing (compone las secciones de _components)
  globals.css                 ← CSS variables + tipografía
  (marketing)/_components/    ← Hero, Speakers, Agenda, Pricing, Sponsors, Registro…
  actions/
    inquiries.ts              ← Server Action: pase corporativo + patrocinio → Resend
    language.ts               ← Cookie de idioma
  api/health/route.ts         ← Liveness probe (sin dependencias externas)

components/
  SpeakersCarousel.tsx        ← Carrusel de conferencistas
  CorporatePassForm.tsx       ← Solicitud de pase corporativo
  SponsorInquiryForm.tsx      ← Solicitud de patrocinio

lib/
  content.ts                  ← SSOT de TODO el copy (ES/EN), precios y agenda
  email.ts / email-templates.ts ← Envío Resend + chrome de marca y escaping
  rate-limit.ts               ← Sliding window en Upstash Redis
  language.ts                 ← Detección de idioma en servidor
```

---

## Secciones de la landing

| Sección | ID | Descripción |
|---|---|---|
| Hero | — | Título, logos de presentadores, fecha y sede, countdown |
| Por qué asistir / Pilares | `#acerca` | CTPAT/OEA · Networking · Tecnología |
| Conferencistas | `#speakers` | Carrusel con headline y descripción por ponente |
| Agenda | `#agenda` | 4 bloques del día |
| Accesos | `#accesos` | VIP · Plus · General · Estudiante → CTA a Eventbrite |
| Patrocinadores | `#patrocinadores` | Paquete + formulario en `#contacto-patrocinio` |
| Pase corporativo | `#registro` | Hasta 10 accesos Plus; el envío llega a `CONTACT_EMAIL` |

Todo el texto vive en `lib/content.ts`, con entradas paralelas `es` / `en`.
No se escribe copy directamente en los componentes.

---

## SEO configurado

- `metadata.title` con template
- `metadata.description`
- `metadata.alternates.canonical` + hreflang
- `openGraph` (og:title, og:description, og:image, og:url)
- `twitter:card` summary_large_image
- JSON-LD del evento, incluidas las `offers` derivadas de `lib/content.ts`
- `robots` con directivas googleBot

---

## Datos y persistencia

El sitio **no escribe en ninguna base de datos**. El flujo de registro individual
(tabla `registros` en Supabase, folios, dashboard `/admin`) se retiró cuando la
venta se movió a Eventbrite. `supabase/migrations/` se conserva únicamente como
registro histórico; los datos capturados antes del corte siguen en el proyecto de
Supabase y se consultan desde su consola.

---

## Deploy

```bash
npm run build
```

Compatible con Vercel (recomendado). El `prebuild` corre `scripts/check-env.mjs`,
que avisa si faltan variables y aborta en modo estricto
(`ENFORCE_ENV_VALIDATION=1`). Bypass de emergencia: `SKIP_ENV_VALIDATION=1 npm run build`.

### Sincronizar env vars locales → Vercel

```bash
npm i -g vercel
vercel link                  # una sola vez
vercel env add VARIABLE      # agrega/rota variables en production y preview
vercel env pull .env.local   # trae los valores actuales
```

Guía completa de deploy y troubleshooting: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

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
- [`docs/TRACKING.md`](docs/TRACKING.md) — GTM/GA4 y eventos de medición.

---

## Calidad

- Pre-commit (`.husky/pre-commit`): `lint-staged` (ESLint --fix sobre archivos staged).
- Pre-push (`.husky/pre-push`): `typecheck` + `test:run`.
- CI (`.github/workflows/ci.yml`): typecheck → lint → unit → build → e2e
  (Playwright matrix) → Lighthouse en `main`.
- Dependabot (`.github/dependabot.yml`): npm + GitHub Actions semanales.

## Licencia

MIT. Ver [`LICENSE`](LICENSE).
