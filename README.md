# SC Security Summit 2026

Sitio bilingüe en Next.js 15 para el evento del 24 de septiembre de 2026 en
Reynosa, Tamaulipas.

- Los accesos individuales se venden y administran en Eventbrite.
- Los formularios corporate y sponsor se conservan en Supabase.
- Resend notifica al equipo después de persistir.
- El cron de Vercel reintenta notificaciones fallidas.

Contexto canónico: [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md).

## Setup

Requisitos: Node 22.x, npm 10+ y Docker para trabajar con la base local.

```bash
npm ci
cp .env.local.example .env.local
npm run env:contract
npm run check-env
npm run dev
```

Abre <http://localhost:3000>.

`.env.local.example` es la única plantilla. Su fuente es
`scripts/env-spec.mjs`; no crees `.env.example`.

## Variables mínimas

Para probar el flujo completo:

```dotenv
SUPABASE_URL=
SUPABASE_SECRET_KEY=
RESEND_API_KEY=
CONTACT_EMAIL=hola@scsecuritysummit.com
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Vercel Preview y Production requieren esas variables y
`ENFORCE_ENV_VALIDATION=1`. Production también requiere `CRON_SECRET`.

Preview debe usar una base Supabase aislada de Production. Ningún secreto lleva
`NEXT_PUBLIC_`.

`SKIP_ENV_VALIDATION=1` está reservado al paso build de GitHub Actions; el
validador lo rechaza en Vercel y en una terminal local.

## Arquitectura

```text
CorporatePassForm / SponsorInquiryForm
  → Server Action
     → honeypot + Zod + Upstash
     → submit-inquiry use case
        → Supabase RPC idempotente
        → intento de Resend

Vercel Cron (5 min)
  → mismo procesador de notificación
  → retry/backoff/dead
```

La solicitud se considera recibida cuando quedó persistida. Si Resend falla,
la interfaz devuelve éxito con `notification: queued` y la outbox conserva el
trabajo.

## Estructura

```text
app/
  (marketing)/_components/          Secciones de la landing
  actions/inquiries.ts              Adaptador Server Action
  api/cron/inquiry-notifications/   Worker autenticado

components/
  CorporatePassForm.tsx
  SponsorInquiryForm.tsx

lib/
  content.ts                        Copy ES/EN, agenda, accesos, sponsors
  inquiries/                        Schema, canonicalización, resultado
  supabase-server.ts                Cliente server-only
  database.types.ts                 Tipos generados

server/
  use-cases/submit-inquiry.ts
  repositories/inquiry-repository.ts
  services/inquiry-notifier.ts

supabase/
  migrations/
  tests/database/
```

## Scripts

```bash
npm run dev             # Next.js dev
npm run env:contract    # valida spec + plantilla, sin secretos
npm run check-env       # valida valores locales/runtime
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm run test:e2e
```

Base local:

```bash
npx supabase db start
npx supabase db reset --local
npx supabase test db --local
npx supabase db lint --local --level error --fail-on error
npx supabase gen types --local --lang typescript --schema public > lib/database.types.ts
git diff --exit-code -- lib/database.types.ts
```

No edites `lib/database.types.ts` manualmente.

## Reglas de cambio

- Marketing: actualiza `lib/content.ts` en `es` y `en`.
- Base: migración versionada → pgTAP → reset local → lint → tipos.
- App: la Server Action no consulta Supabase directamente; usa el caso de uso.
- Seguridad: conserva honeypot, Upstash y Zod.
- Privacidad: no envíes payloads o PII a logs/Sentry.
- Migraciones aplicadas: nunca se editan.
- Production: nunca ejecutes `supabase db reset --linked`.

## CI

GitHub Actions:

- valida el contrato env sin secretos;
- ejecuta TypeScript, ESLint, coverage Vitest, build y Playwright;
- exige 85% mínimo en statements, branches, functions y lines del flujo
  crítico;
- reconstruye Supabase local con CLI fijado;
- ejecuta pgTAP y lint;
- verifica que los tipos generados no cambien;
- ejecuta Lighthouse en `main`.

Solo los pasos build usan `SKIP_ENV_VALIDATION=1`, porque los secretos viven en
Vercel, no en GitHub.

## Despliegue

Lee [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) antes de desplegar.

Orden:

```text
backup → migración aditiva → advisors → app → smoke tests → monitoreo
```

El cron `*/5 * * * *` requiere Vercel Pro y `CRON_SECRET`. El plan Pro fue
confirmado el 2026-07-29; vuelve a confirmarlo si cambia la suscripción.

El aviso `2026-07-29-draft` y la retención propuesta de 18 meses siguen
pendientes de aprobación legal. No se debe habilitar persistencia en
Production hasta cerrar ese gate.

## Operación

La v1 no reconstruye `/admin`. Operaciones usa Supabase Studio con cuenta
individual y MFA.

- [`docs/INQUIRY_OPERATIONS.md`](docs/INQUIRY_OPERATIONS.md)
- [`docs/RUNBOOK.md`](docs/RUNBOOK.md)
- [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)

## Más documentación

- [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) — arquitectura vigente
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — gates y despliegue
- [`docs/TRACKING.md`](docs/TRACKING.md) — GTM/GA4 y atribución
- [`docs/DNS.md`](docs/DNS.md) — Vercel, SPF, DKIM y DMARC
- [`docs/SUPABASE_INQUIRIES_IMPLEMENTATION_PLAN.md`](docs/SUPABASE_INQUIRIES_IMPLEMENTATION_PLAN.md) — diseño y decisiones
- [`docs/history/`](docs/history/) — evidencia histórica

## Licencia

Consulta [LICENSE](LICENSE).
