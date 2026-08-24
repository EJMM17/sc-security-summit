# CLAUDE.md

Read `AGENTS.md` first. Canonical current state:
`docs/PROJECT_CONTEXT.md`. Deployment gates: `docs/DEPLOYMENT.md`.

## Product boundary

- Individual tickets are sold on site with MercadoPago Checkout Pro. See
  `docs/PAYMENTS.md`. Eventbrite is retired: no link, no `EVENTBRITE_URL`, no
  `NEXT_PUBLIC_EVENTBRITE_URL`. Tickets sold there before the cut stay valid
  and are operated from Eventbrite's own panel.
- Supabase stores corporate-pass and sponsorship inquiries, and ticket orders.
- Persistence happens before email and before MercadoPago; it defines receipt.
- Resend failure queues a notification; it does not lose the inquiry.
- Do not reuse historical `public.registros`. The legacy `/admin` built on it
  stays retired; the current `/admin` is a separate panel over `inquiries`.

## Payments and IVA

Published prices are the IVA-exclusive taxable base; 16% is added on top.
`lib/payments/catalog.ts` is the single source of truth for money and the
browser never sends an amount — it sends a tier and a quantity. All arithmetic
is integer cents with half-up rounding, and the tax is computed once over the
whole line, never per unit.

Fiscal data is captured only when the buyer requests a CFDI, validated against
the RFC person type, and stored in its own table. The site does not stamp the
CFDI; the team issues it manually within 72 hours.

The webhook verifies the MercadoPago HMAC signature, rejects notifications
older than five minutes, re-reads the payment from the API rather than trusting
the body, and is idempotent. `MERCADOPAGO_ACCESS_TOKEN` accepts a live
`APP_USR-` token only in Vercel Production and a `TEST-` token everywhere else.

Seat capacity (`public.ticket_capacity`) is opt-in: a scope with no row is
unlimited. `create_ticket_order` takes an advisory lock before checking it and
answers `sold_out` without storing an order; a replay is answered before the
check so a sold-out event never rejects an existing buyer.

An order becoming `paid` enqueues a buyer receipt and an internal notice in
`ticket_order_notifications`, an outbox with the same lease, attempt and
idempotency contract as the inquiry one. One cron drains both queues.

`/admin/ordenes` lists and details orders. Its writes are restricted to
`invoice_status`, `cfdi_uuid`, `owner` and `internal_notes`; capacity is
read-only there and configured in Studio.

Never log buyer identity, RFC, legal name or postal code, and never put fiscal
identifiers in an email.

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
Consent version `2026-08-24` covers on-site payments, the fiscal-data
category and a five-year retention for purchase records (CFF art. 30);
inquiries keep 18 months. **This version is not yet approved by the privacy
owner** — that approval is a blocking gate before selling. The previous
`2026-07-30` version and its approval remain the record for inquiries
submitted before the cut. Production remains gated independently on backup,
database verification, Vercel billing, migrations and deployment checks.

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

`/admin` is an internal panel over `inquiries`: list, filters, detail and the
notification state of each request. It unlocks only when `ADMIN_PASSWORD` and
`ADMIN_SESSION_SECRET` are both set, and answers 404 otherwise, so Preview
never exposes it. Its writes are restricted to `status`, `owner`,
`internal_notes` and `next_follow_up_at` — the same fields Supabase Studio
allows. Supabase Studio with MFA remains valid for anything the panel does not
cover.

See `docs/INQUIRY_OPERATIONS.md`, `docs/PAYMENTS.md` and `docs/RUNBOOK.md`.
