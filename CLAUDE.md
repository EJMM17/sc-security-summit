# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SC Security Summit 2026 is a Next.js 15 event registration and payment platform for a 2-day supply chain security conference in Reynosa, Tamaulipas, Mexico (Sept 24–25, 2026). It is a bilingual (Spanish/English) marketing site with integrated registration, Conekta-powered payments (SPEI, card, OXXO, manual transfer), and an operator admin dashboard — all backed by Supabase PostgreSQL.

Node version: **20.x** (`.nvmrc`). Package manager: **npm >=10.0.0**.

## Commands

```bash
npm run dev              # Start dev server at http://localhost:3000
npm run build            # Production build (runs `check-env` first via `prebuild`)
npm run start            # Run production server
npm run lint             # Next.js ESLint
npm run typecheck        # tsc --noEmit
npm test                 # Vitest run (unit tests, alias for test:run)
npm run test:run         # Vitest one-shot
npm run test:watch       # Vitest watch mode
npm run test:coverage    # Vitest with v8 coverage report
npm run test:e2e         # Playwright E2E (Chromium, Firefox, WebKit, mobile)
npm run test:e2e:ui      # Playwright with interactive UI
npm run check-env        # Validate required env vars without building
```

`npm run build` runs `scripts/check-env.mjs` first. It aborts if required env vars are missing or still hold example-file placeholders. Bypass with `SKIP_ENV_VALIDATION=1 npm run build`.

Unit tests live next to source files (`lib/foo.test.ts` beside `lib/foo.ts`). Integration tests are in `tests/`. E2E tests are in `e2e/`. CI (`.github/workflows/ci.yml`) runs `typecheck → lint → test → build` on every PR, plus E2E on PR/main and Lighthouse CI on main.

Husky pre-commit hook runs `eslint --fix` on staged `.ts`/`.tsx` files.

## Architecture

**Pattern:** Next.js 15 App Router + Server Actions + Supabase PostgreSQL

### Registration & Payment Flow

1. `components/RegistroForm.tsx` (client) collects data; `RegistroIdempotencyField` injects a UUID idempotency key.
2. `app/actions/registro.ts` (Server Action) runs: honeypot check → rate limit → Cloudflare Turnstile verification → idempotency key lookup → Zod validation → `server/use-cases/create-lead.ts` (Supabase insert + bilingual emails) → folio returned.
3. On success the user is redirected to `/pago?folio=…` to choose a payment method.
4. `app/actions/crear-orden-pago.ts` runs: rate limit → capacity check → Conekta v2 order creation (or manual-transfer fallback) → Supabase update → redirect to `/pago` with payment details or to Conekta hosted checkout for card payments.
5. `app/api/webhooks/conekta/route.ts` receives Conekta signed webhooks, verifies HMAC signature, and marks registrations `pagado` / `cancelado` / `expired`. Webhook events are idempotent via `conekta_order_id`.

### Key Files

**Core libs:**
- `lib/schemas.ts` — Zod schema for the registration form; CFDI fields conditionally required when `requiere_cfdi=true`
- `lib/folio.ts` — folio generator (`SCSS2026-{base36 ts}-{6 hex}`); 12 unit tests including a 10 k no-collision sweep
- `lib/supabase.ts` — two clients: public anon (read-only) and admin `service_role` (server-only); never import admin client in client components
- `lib/rate-limit.ts` — Upstash Redis sliding window; `checkRateLimit` (5 req/15 min for registration), `checkOrdenRateLimit` (5 req/15 min for payment orders). Gracefully degrades when Redis vars are absent.
- `lib/turnstile.ts` — Cloudflare Turnstile bot verification
- `lib/conekta.ts` — lightweight typed Conekta v2 REST wrapper (no official SDK); `getConekta()` returns `null` when `CONEKTA_API_KEY` is unset so the site degrades to manual transfer
- `lib/idempotency.ts` — Redis-backed idempotency for registration (UUID key, 1h TTL, best-effort)
- `lib/email.ts` + `lib/email-templates.ts` — Resend transactional emails with retry (3 attempts, 1s/3s backoff): registration confirmation (bilingual), organizer notification, payment confirmation, payment reminder, waitlist notification. Fail-safe: send errors never break a persisted registration.
- `lib/admin-auth.ts` — bcrypt + HMAC-signed session cookies (7-day TTL, HttpOnly/Secure/SameSite=Strict). Admin users are stored in the `admins` DB table. `ADMIN_SESSION_SECRET` must be ≥32 chars in production.
- `lib/language.ts` — server-side language detection (`?lang` → `NEXT_LOCALE` cookie → `Accept-Language` → "es"); mirrored client-side via `setLanguageCookie` server action
- `lib/sentry-scrub.ts` — recursive PII scrubber (email, RFC, phone, card patterns) wired into Sentry `beforeSend`/`beforeBreadcrumb`
- `lib/registro-form-state.ts` — serializes/deserializes form flash state for redirect-based error display
- `lib/content.ts` — content lookup helpers; exports `PRECIOS` (`estudiante: 850`, `general: 2500`, `vip: 4800` MXN)
- `lib/constants.ts` + `lib/site-content.ts` — single source of truth for all event copy, speaker data, FAQ, sponsor tiers, nav links, UI text
- `env.ts` — Zod-validated env module. Exports `env` (typed vars) and `features` (feature flags: `ratelimit`, `email`, `turnstile`, `conekta`). Use `features.*` to gate optional integrations; use `requireEnv("KEY")` inside handlers when a value is truly required at runtime.
- `scripts/check-env.mjs` — `prebuild` validator
- `instrumentation.ts` + `sentry.{client,server,edge}.config.ts` — Sentry bootstraps, gated behind `SENTRY_DSN`

**Server use-cases:**
- `server/use-cases/create-lead.ts` — orchestrates Supabase insert + email dispatch for the registration flow

**Actions:**
- `app/actions/registro.ts` — registration form processing (redirects to `/pago` on success)
- `app/actions/crear-orden-pago.ts` — Conekta order creation + Supabase update + payment redirect
- `app/actions/admin.ts` — admin login, logout, mark-paid, mark-cancelled, export operations
- `app/actions/recuperar-folio.ts` — rate-limited folio recovery email (neutral-message anti-enumeration)
- `app/actions/reenviar-instrucciones.ts` — resend payment instructions email

### Routes

- `/` — marketing landing page + registration form
- `/pago` — payment method selection and payment instructions (SPEI CLABE, OXXO barcode, card redirect, manual transfer)
- `/registro-exitoso` — post-payment confirmation page
- `/recuperar-folio` — passwordless folio reissue
- `/aviso-de-privacidad` — privacy notice
- `/terminos-y-condiciones` — terms and conditions
- `/admin/login` — bcrypt email+password login
- `/admin/registros` — operator dashboard (filter, search, pagination, mark-paid, mark-cancelled)
- `/admin/registros/export.csv` — RFC 4180 CSV export with UTF-8 BOM
- `/admin/admins` — admin user management (create, edit, activate/deactivate)
- `/api/health` — Supabase liveness probe, 3s budget, returns 503 on failure
- `/api/webhooks/conekta` — Conekta payment webhook (HMAC verified, idempotent)

**Bilingual support:** All components accept a `language?: "es" | "en"` prop. Text objects are keyed by language in `lib/content.ts` and `lib/site-content.ts`.

## Environment Variables

Validated by `env.ts` (Zod) at startup. Supabase vars are **required** (hard failure). All others degrade gracefully when absent.

Public (browser-safe, `NEXT_PUBLIC_` prefix):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_TURNSTILE_SITE_KEY
NEXT_PUBLIC_SITE_URL            # canonical URL (e.g. https://www.scsecuritysummit.com)
NEXT_PUBLIC_APP_URL             # optional alias for SITE_URL
NEXT_PUBLIC_SENTRY_DSN          # optional, for client-side Sentry
```

Server-only (never expose to client):
```
SUPABASE_SERVICE_ROLE_KEY
TURNSTILE_SECRET_KEY
RESEND_API_KEY
EMAIL_FROM                      # default "SC Security Summit <hola@scsecuritysummit.com.mx>"
CONTACT_EMAIL                   # organizer notification recipient
UPSTASH_REDIS_REST_URL          # required in production for rate limiting + idempotency
UPSTASH_REDIS_REST_TOKEN
CONEKTA_API_KEY                 # Conekta v2 secret key; payments fall back to manual transfer when absent
CONEKTA_WEBHOOK_SECRET          # HMAC secret for webhook signature verification
SENTRY_DSN                      # optional; SDK no-ops when unset
SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN  # only for Vercel source-map upload
ADMIN_SESSION_SECRET            # ≥32 chars; signs session cookies for /admin/*
BCRYPT_ROUNDS                   # optional, default 12
```

Copy `.env.local.example` to `.env.local` to get started. Placeholder values from the example file are explicitly rejected by the prebuild hook.

## Database

Supabase PostgreSQL. RLS is enabled on all tables — only `service_role` can SELECT/UPDATE/INSERT/DELETE. Migrations are in `supabase/migrations/`:

- `002_hardening.sql` — revokes grants from `anon`/`authenticated`, hardens `search_path`, adds audit columns, enforces price-per-tier and email-format CHECK constraints
- `003_rls_explicit_deny.sql` — defense-in-depth DENY policy for `anon`/`authenticated`
- `004_admin_columns.sql` — `pagado_*`, `cancelado_*` tracking columns; indexes on `(estado_pago, created_at DESC)` and `created_at`
- `005_admins_table.sql` — `admins` table (id, email UNIQUE, password_hash, nombre, active, created_at); RLS hardened; index on email
- `005_update_prices.sql` — price update migration
- `006_capacity_and_price_update.sql` — updates `monto_mxn` CHECK constraint to current prices; adds `app_config` table; adds `get_cupos_disponibles()` SECURITY DEFINER RPC
- `20260505_enterprise_v1.sql` — comprehensive schema with payment columns (conekta_order_id, conekta_charge_id, spei_clabe, oxxo_barcode_url, etc.), `audit_log` table, `app_secrets` table, `admin_registros_view`, additional indexes

**Tables:**
- `registros` — attendee records; `email` UNIQUE, `folio` UNIQUE
- `admins` — admin users with bcrypt-hashed passwords
- `app_config` — key/value configuration (e.g., `capacity_total: 500`)
- `audit_log` — audit trail of admin and system actions
- `app_secrets` — fallback secrets storage

**Key DB business rules:**
- `tipo_acceso` ENUM: `estudiante | general | vip`
- `estado_pago` ENUM: `pendiente | pagado | cancelado`
- `metodo_pago`: `spei | tarjeta | oxxo | transferencia_manual`
- Price CHECK: estudiante=850, general=2500, vip=4800 MXN
- `get_cupos_disponibles()` RPC returns `capacity_total − count(non-cancelled registrations)`

## Security Conventions

**Bot/spam protection:** honeypot field (`name="website"`), Upstash rate limiting, Cloudflare Turnstile. Do not remove any layer without an equivalent replacement.

**Security headers:** split between `next.config.ts` (HSTS preload, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) and `middleware.ts` (nonce-based CSP per-request with `form-action`, `base-uri`, `frame-ancestors 'none'`, `object-src 'none'`). If adding new external script or font sources, update the CSP allowlist in `middleware.ts`. Validate changes at https://csp-evaluator.withgoogle.com.

**Admin auth:** bcrypt (cost 12 by default, configurable via `BCRYPT_ROUNDS`) + HMAC-signed session cookies. Admin users live in the `admins` DB table, not env vars.

**Service role key:** only ever use in Server Actions or API routes; never import `supabaseAdmin` in a client component.

**Webhook security:** Conekta webhook handler at `/api/webhooks/conekta` verifies HMAC-SHA256 signature before processing any event.

**PII in observability:** `lib/sentry-scrub.ts` strips email, RFC, phone, and card patterns before events reach Sentry.

## Styling

Tailwind CSS v4 with PostCSS (`postcss.config.mjs`). Design tokens (colors, spacing) use CSS custom properties in `app/globals.css`. Prefer CSS variables over hardcoded Tailwind values for brand colors.

## Content Updates

To update speakers, pricing, sponsor tiers, FAQ, nav links, or any landing page copy, edit `lib/constants.ts`, `lib/site-content.ts`, or `lib/content.ts` — do **not** hardcode text in components. Speaker images live in `/public/images/` referenced by filename in `site-content.ts`. Prices are the single source of truth in `lib/content.ts` (`PRECIOS`) and enforced by a DB CHECK constraint.

## Components

UI components live in `components/`. Notable ones:
- `RegistroForm.tsx` — main registration form (client)
- `RegistroIdempotencyField.tsx` — injects UUID idempotency key into the form
- `RecuperarFolioForm.tsx` — folio recovery form
- `AmbientCanvas.tsx` / `AmbientCanvasLazy.tsx` — WebGL animated background (lazy-loaded to avoid LCP impact)
- `CountdownTimer.tsx` — live event countdown
- `LanguageSwitcher.tsx` — ES/EN toggle with cookie persistence
- `CookieConsent.tsx` — GDPR-style cookie banner
- `ServiceWorkerRegister.tsx` — PWA service worker registration
- `HeaderScroll.tsx` / `MobileNav.tsx` — responsive navigation

## Testing

- **Unit tests:** Vitest v4. Files: `lib/*.test.ts`, `tests/webhook-conekta.test.ts`. Run with `npm test`.
- **E2E tests:** Playwright. Files: `e2e/*.spec.ts` (registro, webhook, admin flows). Run with `npm run test:e2e`.
- **Stubs:** `tests/stubs/server-only.ts` makes `server-only` imports safe in Vitest.
- **Setup:** `tests/setup.ts` for test environment initialization.

## Deployment

- Hosted on **Vercel** (`vercel.json`). Preview deployments on all branches.
- CI: `.github/workflows/ci.yml` — typecheck, lint, unit tests, build; E2E on PR/main; Lighthouse CI on main against `lighthouse-budget.json`.
- Dependabot: `.github/dependabot.yml` keeps dependencies updated.
- Operational docs: `docs/DEPLOYMENT.md`, `docs/DNS.md`, `docs/RUNBOOK.md`, `docs/TROUBLESHOOTING.md`.
