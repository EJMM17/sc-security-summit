# CLAUDE.md

Read `AGENTS.md` first. Canonical current state:
`docs/PROJECT_CONTEXT.md`. Deployment gates: `docs/DEPLOYMENT.md`.

## Product boundary

- Eventbrite owns all individual tickets, payments, refunds and check-in.
- Supabase stores only corporate-pass and sponsorship inquiries.
- Persistence happens before email and defines receipt.
- Resend failure queues a notification; it does not lose the inquiry.
- Do not reuse historical `public.registros` or recreate the retired `/admin`.

## Request flow

```text
components/*Form
  → app/actions/inquiries.ts
  → server/use-cases/submit-inquiry.ts
     → server/repositories/inquiry-repository.ts
     → server/services/inquiry-notifier.ts
```

The client owns a stable `submission_id`. The database compares it with a
versioned canonical payload hash:

- same ID + same hash = safe replay;
- same ID + different hash = `idempotency_conflict`;
- never overwrite the original.

Supabase access stays in server-only modules. Components and the Server Action
must not issue database queries directly.

## Commands

```bash
npm ci
npm run env:contract
npm run check-env
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e

npx supabase db start
npx supabase db reset --local
npx supabase test db --local
npx supabase db lint --local --level error --fail-on error
```

Playwright targets `http://localhost:3000` by default. Set the test-only
`PLAYWRIGHT_BASE_URL` explicitly for a controlled deployed smoke test;
`NEXT_PUBLIC_SITE_URL` is application metadata, not an E2E target. With an
explicit deployed URL, Playwright does not start a local `.next` server.

The `postcss` and `sharp` overrides in `package.json` are deliberate security
controls for vulnerable transitive versions still selected by Next.js
15.5.22. Never remove them or run `npm audit fix --force`; wait for a stable
Next.js release with patched ranges, then validate the rebuilt lockfile,
audit, build, image optimization and E2E suite.

Use Node 22.x. Node 20 reached end of life and is no longer supported by the
pinned Supabase JavaScript client.

## Environment

`scripts/env-spec.mjs` is the SSOT; `.env.local.example` must match it.

Vercel Production requires Supabase, Resend, Contact Email,
`KV_REST_API_URL`/`KV_REST_API_TOKEN`, `CRON_SECRET`,
`NEXT_PUBLIC_SITE_URL` and `ENFORCE_ENV_VALIDATION=1`. The KV pair is
provisioned and rotated by `summit-rate-limit-production`, connected only to
Production in Vercel Storage. The previous Redis resource stays archived;
manual `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` aliases are retired.

`KV_URL`, `REDIS_URL` and `KV_REST_API_READ_ONLY_TOKEN` are provider-managed
outputs that this app does not consume. Do not add manual duplicates. Never
use `vercel env rm NAME preview` on a multi-target entry; inventory and back up
metadata first, then edit targets in Dashboard/API or change the Storage
connection.

Secrets are server-only. Use `SUPABASE_SECRET_KEY`, never a
`NEXT_PUBLIC_SUPABASE_*` secret. Every non-Production Vercel deployment is a
visual-only, disconnected environment: integrations and marketing analytics
including Sentry are forbidden, forms are disabled and health returns 503.
Tests use local/CI Supabase and controlled adapters; real providers are
exercised only by controlled Production smoke tests.

`SKIP_ENV_VALIDATION=1` is reserved for GitHub Actions build steps. It is
rejected locally and on Vercel.

## Database changes

- Create versioned migrations; never edit an applied migration.
- Run local reset, pgTAP, lint and type generation.
- `lib/database.types.ts` is generated, never hand-edited.
- Keep RLS enabled and revoke `anon`/`authenticated`.
- Test negative access.
- Avoid `SECURITY DEFINER`; never add a permissive policy as a quick fix.
- Never run `supabase db reset --linked` on Production.
- Apply compatible migrations before deploying code that uses them.

## Notification worker

The immediate attempt and
`/api/cron/inquiry-notifications` share one processor. Cron runs every five
minutes on Vercel Pro, authenticates with `CRON_SECRET`, and processes 1–25
rows (default 10).

Vercel can deliver a cron more than once. Preserve leases, atomic claims and
idempotency. Do not log PII or return it from the route.

## Privacy

`INQUIRY_CONSENT_VERSION` in `lib/inquiries/constants.ts` is canonical.
`2026-07-29-draft` and 18-month retention remain pending legal approval.
Production persistence is gated on that approval.

Never place names, email, phone, interest, notes, recipient, subject or email
body in Sentry, Vercel logs, attempts or events.

Sentry is optional, Production-only and error-only. Disable traces, replay,
logs and metrics; rebuild outgoing events from the technical allowlist. Basic
consent mode keeps every analytics/pixel/product-telemetry integration and
interaction tracker unmounted until `all`. The server clears hidden
attribution unless that submitted decision is exactly `all`.

## Content and UI

All marketing copy, prices, speakers and agenda live in `lib/content.ts` in
parallel `es`/`en` entries. Design tokens live in `app/globals.css`.

Keep honeypot, Upstash and Zod. Forms release `sending` in `finally` and clear
only after persistence succeeds.

## Operations

There is no v1 admin UI. Operators use Supabase Studio with MFA and may edit
only `status`, `owner`, `internal_notes` and `next_follow_up_at`.

See `docs/INQUIRY_OPERATIONS.md` and `docs/RUNBOOK.md`.
