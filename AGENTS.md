# SC Security Summit 2026 — Agent Guide

> Canonical current state: `docs/PROJECT_CONTEXT.md` (reviewed 2026-07-30).
> Deployment order and gates: `docs/DEPLOYMENT.md`.
> Database design record: `docs/SUPABASE_INQUIRIES_IMPLEMENTATION_PLAN.md`.

## Product boundaries

SC Security Summit 2026 is a bilingual Next.js 15 marketing site for the
September 24, 2026 event in Reynosa, Mexico.

Internalize these boundaries before changing code:

1. Individual tickets are sold on site with MercadoPago Checkout Pro
   (`docs/PAYMENTS.md`). The app prices, stores and confirms those orders. It
   does not refund or check in: refunds are operated from the MercadoPago
   panel and Eventbrite still owns check-in for tickets sold there. Only the
   pricing section links to `/checkout`; the generic CTAs still link to
   Eventbrite.
2. Supabase stores corporate-pass and sponsorship inquiries, and ticket
   orders. Published prices are the IVA-exclusive taxable base.
3. Supabase persistence defines receipt. Resend is a recoverable notification
   channel after persistence.
4. Do not reuse historical `public.registros`, folios, payment fields, or the
   retired `/admin` architecture that was built on them. The current `/admin`
   is a separate, credential-gated panel over `inquiries` (see Human
   operation).
5. The browser never connects to Supabase. All database access is server-only.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript 5 strict |
| Styling | Tailwind CSS v4 + PostCSS |
| Database | Supabase PostgreSQL |
| Client | `@supabase/supabase-js`, server-only |
| Validation | Zod |
| Rate limiting | Upstash Redis |
| Email | Resend |
| Error tracking | Sentry |
| Analytics | GTM/GA4 + Vercel Speed Insights |
| Tests | Vitest, Playwright, pgTAP |
| Deployment | Vercel Pro |

## Critical request flow

```text
form → honeypot → Zod → Upstash → create_inquiry RPC
                                  ├─ inquiry row
                                  ├─ outbox row
                                  └─ created event
                               → immediate Resend attempt

Vercel Cron (5 min) → same notification processor → retry/dead
```

Outcomes:

- persistence + email: success, `notification: sent`;
- persistence + email failure: success, `notification: queued`;
- persistence failure: `storage_unavailable`, do not call Resend;
- identical replay: return the original inquiry;
- same UUID with a different canonical payload: `idempotency_conflict`, never
  overwrite the original.

## Project map

```text
app/
  (marketing)/_components/        Landing sections
  actions/inquiries.ts            FormData adapter and typed public result
  api/cron/inquiry-notifications/ Authenticated retry route
  aviso-de-privacidad/            Approved privacy notice

components/
  CorporatePassForm.tsx
  SponsorInquiryForm.tsx

lib/
  content.ts                      SSOT for bilingual marketing copy
  inquiries/
    constants.ts                  Consent version
    schema.ts                     Zod + FormData parsing + inferred types
    canonical-payload.ts          Versioned canonicalization and SHA-256 input
    result.ts                     Public result union
  supabase-server.ts              Lazy server-only client
  database.types.ts               Generated; never hand-edit
  rate-limit.ts
  email.ts / email-templates.ts

server/
  use-cases/submit-inquiry.ts
  repositories/inquiry-repository.ts
  services/inquiry-notifier.ts
  services/inquiry-observability.ts

supabase/
  config.toml
  migrations/                     Reproducible baseline + forward migrations
  tests/database/                 pgTAP contract/security tests

scripts/
  env-spec.mjs                    Environment SSOT
  check-env.mjs                   Contract/runtime validator
```

## Commands

```bash
npm run dev
npm run env:contract
npm run check-env
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm run test:e2e

npx supabase db start
npx supabase db reset --local
npx supabase test db --local
npx supabase db lint --local --level error --fail-on error
```

Playwright targets `http://localhost:3000` by default. Set the test-only
`PLAYWRIGHT_BASE_URL` explicitly for a controlled deployed smoke test; never
use `NEXT_PUBLIC_SITE_URL` to choose the E2E target.

The `postcss` and `sharp` overrides in `package.json` intentionally replace
vulnerable transitive copies still selected by Next.js 15.5.22. Do not remove
them or run `npm audit fix --force`. Remove them only after a stable Next.js
release carries patched ranges and the lockfile, audit, build, image
optimization and E2E suite all pass without them.

Node 22.x and npm 10+ are required. Node 20 reached end of life and is no
longer supported by the pinned Supabase JavaScript client.

## Environment contract

`scripts/env-spec.mjs` is the only source of truth. `.env.local.example` is
generated from it. `.env.example` must not exist.

Required in Vercel Production:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `RESEND_API_KEY`
- `CONTACT_EMAIL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `ENFORCE_ENV_VALIDATION=1`
- `CRON_SECRET`
- `NEXT_PUBLIC_SITE_URL`

Optional in Production, forbidden in Preview, configured together:

- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

Also optional and forbidden in Preview, configured together:

- `MERCADOPAGO_ACCESS_TOKEN` — live `APP_USR-` token in Vercel Production, a
  `TEST-` sandbox token in every other environment
- `MERCADOPAGO_WEBHOOK_SECRET`

Without both, the checkout fails closed with `provider_unavailable` and every
webhook notification is rejected. The MercadoPago public key is not part of the
contract: Checkout Pro only needs the server access token.

Rules:

- Every non-Production Vercel deployment is visual-only and fail-closed.
- Visual deployments must omit Supabase, Resend, Upstash, cron, retired
  `NEXT_PUBLIC_SUPABASE_*` values, and marketing analytics IDs.
- Their forms are disabled and health intentionally returns 503.
- Integrated tests use local/CI Supabase and controlled adapters. Real
  providers are exercised only by controlled smoke tests after a Production
  rebuild.
- Prefer modern `sb_secret_…`; never add `NEXT_PUBLIC_` to a secret.
- Supabase URL/key, Resend key/contact inbox, and
  `KV_REST_API_URL`/`KV_REST_API_TOKEN` and
  `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` are indivisible pairs.
- The Upstash integration connected through Vercel Storage owns and rotates
  the Production KV variables. Its active resource is
  `summit-rate-limit-production`, connected only to Production; the previous
  Redis resource remains archived and must not be reconnected. Manual
  `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` aliases are retired and
  forbidden. The app does not consume provider-managed
  `KV_URL`, `REDIS_URL`, or `KV_REST_API_READ_ONLY_TOKEN`; do not recreate,
  rename, or rotate them manually.
- Production `SUPABASE_URL` must match the exact Summit host in
  `config/deployment-contract.json`; other Supabase projects fail closed.
- Outside Vercel Production, only loopback Supabase is allowed. Resend,
  Upstash, cron and marketing analytics are disabled and forbidden.
- `INQUIRY_NOTIFICATION_BATCH_SIZE` is optional, 1–25, default 10.
- `SKIP_ENV_VALIDATION=1` is allowed only on GitHub Actions build steps.
- Vercel rejects `SKIP_ENV_VALIDATION`.
- GitHub contains no Production integration secrets.
- Vercel scope changes affect only new deployments. Before claiming Preview is
  isolated, audit historical deployment snapshots and coordinate revocation or
  rotation of any credential that was previously shared with Production.
- The environment spec governs current application variables, not unrelated
  legacy secrets. Audit the complete Vercel Preview inventory as an external
  deployment gate.
- Never run `vercel env rm NAME preview` against a multi-target entry. Inventory
  and back up its metadata first, then edit the target array in Vercel
  Dashboard/API. For integration-managed KV entries, change the project
  connection or rotate from Vercel Storage.

When adding an env var: edit `scripts/env-spec.mjs`, print/sync the template,
run `npm run env:contract`, then update only the necessary Vercel environments.
Provider-managed variables that the app does not read stay outside the app
contract.

## Database contract

New tables:

- `public.ticket_orders`
- `public.ticket_order_invoice_details`
- `public.ticket_order_events`
- `public.inquiries`
- `public.inquiry_notifications`
- `public.inquiry_notification_attempts`
- `public.inquiry_events`

Internal RPCs:

- `create_ticket_order`
- `attach_ticket_order_preference`
- `record_ticket_order_payment`
- `create_inquiry`
- `claim_inquiry_notification`
- `claim_inquiry_notifications`
- `complete_inquiry_notification`

Security rules:

- enable RLS on every new public table;
- revoke access from `anon` and `authenticated`;
- test negative SELECT/INSERT/UPDATE/DELETE access with pgTAP;
- no permissive public insert policy;
- no public `SECURITY DEFINER` workaround;
- functions set a safe explicit `search_path`;
- never log payloads or provider errors containing PII;
- do not store IP or user-agent in inquiries.
- never capture or submit attribution without explicit marketing consent;
  `essential` must keep the fields empty and remove legacy attribution stores;
- treat hidden attribution fields as untrusted: the server discards them unless
  the submitted marketing-consent decision is exactly `all`.

Migration rules:

1. Create migrations with the pinned Supabase CLI.
2. Test with local reset, pgTAP and lint.
3. Regenerate `lib/database.types.ts`; do not edit it manually.
4. Run Security and Performance Advisors.
5. Apply compatible migrations before application code.
6. Never edit an applied migration.
7. Use expand → migrate → contract for destructive evolution.
8. Never run `supabase db reset --linked` on Production.

Only one designated person performs remote migration operations after a
verified backup and dry run.

## Application conventions

- Strict TypeScript; no unjustified `any`.
- `@/` maps to the repository root.
- Secret-bearing modules begin with `import "server-only";`.
- Third-party clients are lazy so import/build without secrets does not throw.
- Components do not import Supabase or repository modules.
- The Server Action translates input/results; the use case owns ordering.
- All Supabase queries stay in `server/repositories/`.
- Immediate and cron notification use the same processor.
- Client forms keep a stable `submission_id` across retries.
- Clear form state only after confirmed persistence.
- Always release the UI sending state in `finally`.

Marketing content belongs in `lib/content.ts`, in both `es` and `en`. Do not
hardcode copy into components. Brand tokens belong in `app/globals.css`.

## Bot and abuse controls

Keep all three layers:

1. hidden `website` honeypot;
2. Upstash sliding window, 5 requests / 15 minutes / IP;
3. server-side Zod validation.

Upstash runs and fails closed only in Vercel Production. Preview disables the
forms and the Server Action rejects before parsing. Do not weaken a layer
without an equivalent replacement and tests.

Visual Preview deployments do not mount Vercel Analytics, Speed Insights,
`InteractionTracker`, attribution capture or Sentry. Every Sentry variable is
Production-only. In Production, Sentry is error-only: no tracing, replay, logs,
metrics, request/user data, headers, bodies, query parameters, breadcrumbs,
free-form messages, source context or stack variables. Keep the `Preview
isolation` CI browser test green when changing layout, consent, analytics or
forms.

## Privacy

The canonical consent version is
`lib/inquiries/constants.ts::INQUIRY_CONSENT_VERSION`.

The privacy owner approved consent version `2026-07-30`, the 18-month
retention period, the ARCO process and the deletion/anonymization procedure on
2026-07-30. This approval does not satisfy the independent backup, database,
Vercel billing, migration, merge or Production deployment gates.

PII rules:

- Sentry and Vercel logs receive IDs/codes only;
- notification attempts never store recipient, subject or body;
- events never contain names, email, phone, free-form interest or notes;
- exports require authorization, minimum fields and a deletion date.

## Tests

Required coverage includes:

- Zod boundaries and discriminated fields;
- canonical payload stability;
- honeypot and rate limiting;
- persistence before notification;
- queued email failure;
- storage failure without Resend;
- identical replay and UUID conflict;
- cron auth, batch clamp and idempotent processing;
- PII redaction;
- pgTAP constraints, triggers, RPCs, RLS and grants;
- Playwright ES/EN, mobile/desktop and consent-gated attribution;
- unit + pgTAP replay/retry behavior, followed by controlled end-to-end smoke
  tests only after rebuilding the approved commit as Production.

CI runs application quality in parallel with a local Supabase database
contract. Coverage enforces at least 85% for statements, branches, functions
and lines across the critical inquiry modules. The database job uses pinned CLI
`2.110.0`, never Production.

## Deployment

Vercel Cron calls `/api/cron/inquiry-notifications` every five minutes. This
requires Pro; Hobby rejects schedules more frequent than daily. Confirm the
plan and `CRON_SECRET` before deploying.

Production sequence:

1. confirm the recorded legal/retention approval remains current;
2. verified backup;
3. verify the ten legitimate historical `registros` rows;
4. reconcile local/remote migration history and review Security/Performance
   Advisors;
5. confirm that the only pending versions are
   `20260730024502_add_inquiry_persistence`,
   `20260730030134_harden_legacy_grants` and
   `20260730030137_retire_legacy_registration_webhook`;
6. apply those three migrations in timestamp order; the third retires the
   webhook and executes `DROP EXTENSION pg_net RESTRICT`, so any dependency
   aborts and rolls back the cut;
7. deploy the JWT-protected HTTP 410 tombstone and verify the database,
   Advisors and ten historical rows again;
8. Vercel deploy;
9. one controlled corporate and sponsor submission;
10. verify inquiry, outbox, attempt, event and email;
11. monitor for 24 hours.

Rollback preserves new tables/data and reverts the application. Never use an
automatic `DROP`. Vercel Instant Rollback does not restore cron configuration;
check/disable the cron separately.

## Human operation

`/admin` is an internal panel over `inquiries`. It lists requests with status,
kind and search filters, shows one request in detail with the state of its
email notification, and writes only `status`, `owner`, `internal_notes` and
`next_follow_up_at`. Submitted data, consent, attribution, hashes and
timestamps are read-only, and the panel never edits the notification tables.

Rules:

- the panel unlocks only when `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` are
  both configured; otherwise every `/admin` route answers 404, which keeps it
  absent from every visual-only Preview;
- access is a password plus an HMAC-signed, HttpOnly, SameSite=Lax session
  cookie with an 8-hour lifetime; login attempts pass through the same Upstash
  limiter as the public forms;
- Supabase access stays in `server/repositories/admin-inquiry-repository.ts`;
  client components import shapes from `lib/admin/types.ts` so the elevated key
  never reaches the browser;
- `/admin` mounts no analytics, pixels, attribution capture or marketing
  chrome, and `robots.txt` disallows it.

Supabase Studio with individual accounts and MFA remains valid for anything the
panel does not cover, under the same field restrictions.

Canonical SOP: `docs/INQUIRY_OPERATIONS.md`.

## Documentation

- `docs/PROJECT_CONTEXT.md` — current architecture
- `docs/DEPLOYMENT.md` — gates and deployment
- `docs/INQUIRY_OPERATIONS.md` — Studio operation
- `docs/PAYMENTS.md` — MercadoPago checkout, IVA and CFDI capture
- `docs/RUNBOOK.md` — incidents and continuity
- `docs/TROUBLESHOOTING.md` — symptom diagnosis
- `docs/TRACKING.md` — analytics/attribution
- `docs/DNS.md` — Vercel and email DNS
- `docs/history/` — historical evidence only
