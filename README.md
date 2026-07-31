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

Para desarrollo con Supabase local:

```dotenv
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SECRET_KEY=<clave-local-generada-por-supabase>
```

Resend, `CONTACT_EMAIL`, Upstash, cron, Sentry y analytics de marketing están
prohibidos en local. Production requiere el conjunto completo descrito en
`.env.local.example`, incluido `NEXT_PUBLIC_SITE_URL` y
`ENFORCE_ENV_VALIDATION=1`.

Los deployments Vercel que no son Production son vistas visuales desconectadas:
deben omitir Supabase, Resend, Upstash, cron, analytics de marketing y
telemetría de Vercel/Sentry. Los formularios aparecen deshabilitados,
`/api/health` responde `503` y ninguna solicitud se procesa. Las pruebas usan
Supabase loopback/CI y adaptadores controlados; los proveedores reales se
verifican solo mediante smoke controlado después del rebuild Production.

`SUPABASE_URL` acepta solo loopback HTTP en desarrollo o una raíz HTTPS bajo
el host Summit fijado en `config/deployment-contract.json` en Production.
El rate limiter consume exclusivamente `KV_REST_API_URL` y
`KV_REST_API_TOKEN`, creadas por la integración Upstash conectada desde Vercel
Storage mediante el recurso `summit-rate-limit-production`, conectado solo a
Production. El recurso Redis anterior permanece archivado y no debe
reconectarse. `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` son aliases
manuales retirados y están prohibidos. `KV_URL`, `REDIS_URL` y
`KV_REST_API_READ_ONLY_TOKEN` son variables administradas por el proveedor que
la aplicación no consume; no se replican ni rotan manualmente. Ningún secreto
lleva `NEXT_PUBLIC_`.

Nunca uses `vercel env rm NAME preview` para quitar Preview de una entrada
multi-target: puede eliminar la entrada completa. Primero haz un inventario y
respalda su metadata; después edita sus targets en Dashboard/API. Para Upstash,
cambia la conexión o rota credenciales desde Vercel Storage. El procedimiento
detallado está en `docs/DEPLOYMENT.md`.

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

Playwright usa `http://localhost:3000` por defecto. Un smoke contra un
deployment debe declarar `PLAYWRIGHT_BASE_URL` de forma explícita;
`NEXT_PUBLIC_SITE_URL` nunca selecciona el destino de pruebas y, cuando existe
`PLAYWRIGHT_BASE_URL`, Playwright no intenta iniciar `.next` ni el puerto local.

Los overrides de `postcss` y `sharp` en `package.json` son controles de
seguridad intencionales para las copias transitivas de Next.js 15.5.22. No los
retires ni ejecutes `npm audit fix --force`: primero actualiza a una versión
estable de Next.js que incluya las correcciones, reconstruye el lockfile y
exige `npm audit` + build + E2E verdes.

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
aprobación legal registrada → backup → historial/advisors → 3 migraciones por timestamp
→ tombstone 410 → verificación DB/advisors → app → smoke tests → monitoreo
```

El cron `*/5 * * * *` requiere Vercel Pro y `CRON_SECRET`. El plan Pro fue
confirmado el 2026-07-29; vuelve a confirmarlo si cambia la suscripción.

El aviso `2026-07-30`, la retención de 18 meses, el proceso ARCO y el
procedimiento de eliminación/anonimización fueron aprobados el 2026-07-30.
Esta aprobación no sustituye los gates independientes de backup, verificación
de base, facturación de Vercel, migraciones y despliegue.

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
