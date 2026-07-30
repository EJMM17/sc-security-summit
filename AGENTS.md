# SC Security Summit 2026 — Agent Guide

> Canonical current state: `docs/PROJECT_CONTEXT.md` (reviewed 2026-07-29).
> Deployment order and gates: `docs/DEPLOYMENT.md`.
> Database design record: `docs/SUPABASE_INQUIRIES_IMPLEMENTATION_PLAN.md`.

## Product boundaries

SC Security Summit 2026 is a bilingual Next.js 15 marketing site for the
September 24, 2026 event in Reynosa, Mexico.

Internalize these boundaries before changing code:

1. Individual ticketing is off-site in Eventbrite. The app does not sell,
   price-check, refund, confirm, or store individual orders.
2. Supabase stores only corporate-pass and sponsorship inquiries.
3. Supabase persistence defines receipt. Resend is a recoverable notification
   channel after persistence.
4. Do not reuse historical `public.registros`, folios, payment fields, or the
   retired `/admin` architecture.
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
  aviso-de-privacidad/            Privacy notice (currently a legal draft)

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

Node 22.x and npm 10+ are required. Node 20 reached end of life and is no
longer supported by the pinned Supabase JavaScript client.

## Environment contract

`scripts/env-spec.mjs` is the only source of truth. `.env.local.example` is
generated from it. `.env.example` must not exist.

Required in Vercel Preview and Production:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `RESEND_API_KEY`
- `CONTACT_EMAIL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `ENFORCE_ENV_VALIDATION=1`

Production also requires `CRON_SECRET` and `NEXT_PUBLIC_SITE_URL`.

Rules:

- Preview uses a Supabase project/branch isolated from Production.
- Prefer modern `sb_secret_…`; never add `NEXT_PUBLIC_` to a secret.
- Upstash URL/token and Supabase URL/key are indivisible pairs.
- `INQUIRY_NOTIFICATION_BATCH_SIZE` is optional, 1–25, default 10.
- `SKIP_ENV_VALIDATION=1` is allowed only on GitHub Actions build steps.
- Vercel rejects `SKIP_ENV_VALIDATION`.
- GitHub contains no Production integration secrets.

When adding an env var: edit `scripts/env-spec.mjs`, print/sync the template,
run `npm run env:contract`, then update only the necessary Vercel environments.

## Database contract

New tables:

- `public.inquiries`
- `public.inquiry_notifications`
- `public.inquiry_notification_attempts`
- `public.inquiry_events`

Internal RPCs:

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
  `essential` must keep the fields empty and remove legacy attribution stores.

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

Upstash fails closed in Preview/Production. Do not weaken a layer without an
equivalent replacement and tests.

## Privacy

The canonical consent version is
`lib/inquiries/constants.ts::INQUIRY_CONSENT_VERSION`.

`2026-07-29-draft` and the proposed 18-month retention period are not legal
approval. Do not deploy persistence to Production until the privacy owner
approves the notice, retention, ARCO process and deletion/anon procedure.

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
- unit + pgTAP replay/retry behavior, followed by controlled end-to-end
  submission smoke tests only in an isolated Preview.

CI runs application quality in parallel with a local Supabase database
contract. Coverage enforces at least 85% for statements, branches, functions
and lines across the critical inquiry modules. The database job uses pinned CLI
`2.110.0`, never Production.

## Deployment

Vercel Cron calls `/api/cron/inquiry-notifications` every five minutes. This
requires Pro; Hobby rejects schedules more frequent than daily. Confirm the
plan and `CRON_SECRET` before deploying.

Production sequence:

1. legal/retention approval;
2. verified backup;
3. verify the seven historical `registros` rows;
4. retire the legacy registration webhook/`pg_net` via its separate migration
   and deploy the JWT-protected HTTP 410 tombstone;
5. migration history/advisors check;
6. additive DB migration;
7. DB verification, including the seven historical rows;
8. Vercel deploy;
9. one controlled corporate and sponsor submission;
10. verify inquiry, outbox, attempt, event and email;
11. monitor for 24 hours.

Rollback preserves new tables/data and reverts the application. Never use an
automatic `DROP`. Vercel Instant Rollback does not restore cron configuration;
check/disable the cron separately.

## Human operation

There is no `/admin` in v1. Operators use Supabase Studio with individual
accounts and MFA. They may edit only `status`, `owner`, `internal_notes` and
`next_follow_up_at` in `inquiries`.

Canonical SOP: `docs/INQUIRY_OPERATIONS.md`.

## Documentation

- `docs/PROJECT_CONTEXT.md` — current architecture
- `docs/DEPLOYMENT.md` — gates and deployment
- `docs/INQUIRY_OPERATIONS.md` — Studio operation
- `docs/RUNBOOK.md` — incidents and continuity
- `docs/TROUBLESHOOTING.md` — symptom diagnosis
- `docs/TRACKING.md` — analytics/attribution
- `docs/DNS.md` — Vercel and email DNS
- `docs/history/` — historical evidence only
