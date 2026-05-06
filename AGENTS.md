# SC Security Summit 2026 — Agent Guide

> This file is written for AI coding agents. It assumes zero prior knowledge of the project.

---

## Project Overview

SC Security Summit 2026 is a **Next.js 15** event registration platform for a supply-chain security conference in Reynosa, Mexico (Sept 24–25, 2026). It is a bilingual (Spanish/English) marketing landing page with an integrated registration flow backed by **Supabase PostgreSQL**.

The site is deployed on **Vercel** and serves public pages (`/`, `/recuperar-folio`, `/terminos-y-condiciones`, `/aviso-de-privacidad`) plus an admin dashboard (`/admin/*`) for organizers to manage registrations and export CSVs.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v4 + PostCSS |
| Fonts | Google Fonts (Inter, Oswald) via `next/font` |
| Database | Supabase PostgreSQL |
| ORM / Client | `@supabase/supabase-js` |
| Validation | Zod |
| Rate Limiting | Upstash Redis (`@upstash/ratelimit`, `@upstash/redis`) |
| Bot Protection | Cloudflare Turnstile |
| Email | Resend |
| Error Tracking | Sentry (`@sentry/nextjs`) |
| Analytics | Vercel Speed Insights |
| Testing | Vitest 4 + `@vitest/coverage-v8` |
| Icons | Lucide React |
| Toasts | Sonner |

---

## Project Structure

```
app/                          # Next.js App Router
  layout.tsx                  # Root layout: SEO metadata, JSON-LD schemas, Google Fonts, nonce CSP, Turnstile script
  page.tsx                    # Landing page (marketing + registration form)
  globals.css                 # Tailwind v4 import + extensive custom design system (CSS variables, animations, component classes)
  loading.tsx                 # Global loading UI
  manifest.ts                 # Web app manifest
  robots.ts                   # robots.txt generation
  sitemap.ts                  # sitemap.xml generation
  actions/
    registro.ts               # Server Action: registration flow orchestrator
    recuperar-folio.ts        # Server Action: folio reissue
    admin.ts                  # Server Action: mark-paid, CSV export
    language.ts               # Server Action: set language cookie
  admin/
    layout.tsx                # Admin layout: auth gate
    page.tsx                  # Admin landing (redirects to /admin/registros)
    login/page.tsx            # Admin login page
    login/AdminLoginForm.tsx  # Login form component (email + password)
    registros/page.tsx        # Registration dashboard (search, filter, paginate, stats)
    registros/RegistroRow.tsx # Table row component with detail modal + notes
    registros/Pagination.tsx  # Pagination controls
    registros/RegistroDetail.tsx # Detail modal with full audit trail
    registros/export.csv/route.ts  # CSV export route handler
    admins/page.tsx           # Admin user management (CRUD)
    admins/AdminForm.tsx      # Create admin form
    admins/AdminList.tsx      # Admin list with edit/delete
  api/health/route.ts         # Health probe (Supabase liveness, 3s budget)
  aviso-de-privacidad/page.tsx
  recuperar-folio/page.tsx
  terminos-y-condiciones/page.tsx

components/                   # React components (all client or shared)
  RegistroForm.tsx            # Main registration form (client, bilingual)
  RecuperarFolioForm.tsx      # Folio recovery form
  FAQAccordion.tsx
  CountdownTimer.tsx
  AnimatedCounter.tsx
  ScrollReveal.tsx
  HeaderScroll.tsx
  MobileNav.tsx
  MouseGlow.tsx
  HeroGradientMesh.tsx
  MarqueeStrip.tsx
  AmbientCanvas.tsx / AmbientCanvasLazy.tsx
  ScrollProgress.tsx
  WhatsAppButton.tsx

lib/                          # Shared utilities and business logic
  supabase.ts                 # Two clients: public anon + admin service_role
  schemas.ts                  # Zod schema for registration + price map
  schemas.test.ts             # Zod schema unit tests
  folio.ts                    # Folio generator (SCSS2026-{base36 ts}-{6 hex})
  folio.test.ts               # Folio unit tests (including 10k collision sweep)
  rate-limit.ts / ratelimit.ts # Upstash Redis sliding-window rate limiter
  turnstile.ts                # Cloudflare Turnstile verification
  email.ts                    # Resend email sender (lazy singleton)
  email-templates.ts          # Bilingual HTML/text email builders
  admin-auth.ts               # Password-based sessions for /admin (bcrypt + HMAC cookies)
  admin-auth.test.ts          # Admin auth unit tests
  language.ts                 # Server-side language detection
  sentry-scrub.ts             # PII redactor for Sentry events
  sentry-scrub.test.ts        # Scrubber unit tests
  constants.ts                # Event constants, sponsor data, stats, pricing tiers
  site-content.ts             # FAQ, speakers, pricing, stats, hub features, social proof

server/use-cases/
  create-lead.ts              # Core registration use case (DB insert + emails)

scripts/
  check-env.mjs               # Prebuild env-var validator
  env-spec.mjs                # Canonical env-var specs (required/optional/rules)
  optimize-images.mjs         # Image optimization script

supabase/migrations/
  002_hardening.sql           # Revoke anon grants, RLS policy, audit columns, CHECK constraints
  003_rls_explicit_deny.sql   # Defense-in-depth deny policy for anon/authenticated
  004_admin_columns.sql       # Paid/cancelled tracking columns + indexes

sentry.client.config.ts       # Sentry browser SDK init (gated by DSN)
sentry.server.config.ts       # Sentry Node.js SDK init
sentry.edge.config.ts         # Sentry Edge SDK init
instrumentation.ts            # Next.js instrumentation hook (wires Sentry per runtime)
middleware.ts                 # Nonce-based CSP headers on every request
next.config.ts                # Next config + security headers + Sentry wrapping
env.ts                        # Zod-based env validation + feature flags
postcss.config.mjs            # Tailwind v4 PostCSS plugin
vitest.config.ts              # Vitest config (node env, lib/**/*.test.ts)
```

---

## Build and Test Commands

```bash
npm run dev              # Dev server at http://localhost:3000
npm run build            # Production build (runs check-env first via prebuild)
npm run start            # Production server
npm run lint             # Next.js linter (ESLint)
npm run typecheck        # tsc --noEmit
npm test                 # Vitest run (lib/**/*.test.ts)
npm run test:watch       # Vitest watch mode
npm run test:coverage    # Vitest with v8 coverage report
npm run check-env        # Validate required env vars without building
```

`npm run build` runs `scripts/check-env.mjs` first. The script aborts the build if required env vars are missing or still hold placeholder values from `.env.local.example`. Bypass for emergency builds with `SKIP_ENV_VALIDATION=1 npm run build`.

---

## Environment Variables

Env validation lives in `env.ts` (Zod schema). Variables are split into **strict** (build fails if missing) and **optional** (graceful degradation at runtime).

### Strict (required)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (server-only, never expose to client) |

### Optional (graceful degradation)

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key for transactional email |
| `EMAIL_FROM` | Sender address (default: `SC Security Summit <hola@scsecuritysummit.com.mx>`) |
| `CONTACT_EMAIL` | Organizer contact email (used for notifications) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Distributed rate limiting |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile bot protection |
| `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` | Canonical site URLs |
| `SENTRY_DSN` | Sentry DSN (SDK no-ops when unset) |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | Sentry source-map upload (Vercel only) |
| `ADMIN_SESSION_SECRET` | HMAC secret for admin session cookies (≥32 chars, required in production) |
| `BCRYPT_ROUNDS` | bcrypt cost factor (default 12) |

Feature flags are derived in `env.ts` via the `features` object:
- `features.ratelimit` — requires Upstash Redis vars
- `features.email` — requires Resend key + `EMAIL_FROM`
- `features.turnstile` — requires both Turnstile keys

Copy `.env.local.example` to `.env.local` to get started. Use `npm run vercel:env:push` to sync local env vars to Vercel (production + preview).

---

## Database

Supabase PostgreSQL table: `public.registros`.

Row Level Security (RLS) is enabled. Only the `service_role` role can `SELECT/INSERT/UPDATE/DELETE`. An explicit `deny_anon_all` policy ensures `anon` and `authenticated` roles are blocked at the row level even if grants are accidentally restored.

Key columns:
- `folio` (TEXT UNIQUE) — format `SCSS2026-XXXXX-XXXX`
- `email` (TEXT UNIQUE) — prevents duplicate registrations
- `tipo_acceso` — ENUM `estudiante | general | vip`
- `monto_mxn` — INTEGER, CHECK-constrained to tier prices (1200 / 5800 / 7200)
- `estado_pago` — ENUM `pendiente | pagado | cancelado`
- `requiere_cfdi`, `rfc`, `razon_social`, `codigo_postal_fiscal` — Mexican invoice data
- Audit/tracking: `ip_registro`, `user_agent`, `referer`, `utm_source`, `utm_medium`, `utm_campaign`
- Admin tracking: `pagado_en`, `pagado_por`, `pago_nota`, `cancelado_en`, `cancelado_por`, `cancelacion_nota`

Migrations are in `/supabase/migrations/` and must be applied via Supabase Dashboard SQL Editor or `supabase db push`.

---

## Security Conventions

The registration form uses **layered bot/spam protection**:
1. **Honeypot field** (`name="website"`, hidden from real users)
2. **Distributed rate limiting** (Upstash Redis, 5 req / 15 min per IP)
3. **Cloudflare Turnstile** challenge

Do not remove any of these layers without adding an equivalent replacement.

Security headers are split:
- `next.config.ts` sets: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Permitted-Cross-Origin-Policies
- `middleware.ts` sets: **nonce-based CSP** per-request (`script-src 'self' 'nonce-...'`, `style-src 'self' 'unsafe-inline'`, etc.)

If adding new external scripts or font sources, update the CSP allowlist in `middleware.ts` and validate at https://csp-evaluator.withgoogle.com.

**Critical:** `SUPABASE_SERVICE_ROLE_KEY` must only ever be used in Server Actions or API routes. Never import `lib/supabase.ts`'s admin client in any client component.

PII is scrubbed from Sentry events via `lib/sentry-scrub.ts` (emails, RFCs, phone numbers, credit-card patterns, and known sensitive keys).

---

## Code Style Guidelines

- **TypeScript strict mode** is enabled. No `any` without explicit justification.
- **Path alias:** `@/` maps to the project root (configured in `tsconfig.json` and `vitest.config.ts`).
- **Server-only modules** that touch env vars or secrets start with `import "server-only";`.
- **Lazy singletons** for optional third-party clients (Resend, Upstash Redis) so missing env vars don't throw during `next build`.
- **Bilingual components** accept a `language?: "es" | "en"` prop. Text objects are keyed by language throughout.
- **Content updates** (speakers, pricing, sponsors, FAQ, landing copy) go in `lib/constants.ts` or `lib/site-content.ts`. Do not hardcode marketing text into components.
- **Design tokens** (colors, spacing, shadows, radii) use CSS custom properties in `app/globals.css`. Prefer CSS variables over hardcoded Tailwind values for brand colors.
- **Tailwind v4** uses `@import "tailwindcss"` and `@theme` blocks in CSS. No `tailwind.config.js`.

---

## Testing Instructions

Tests live next to source files: `lib/foo.test.ts` next to `lib/foo.ts`.

Run tests:
```bash
npm test                # single run
npm run test:watch      # watch mode
npm run test:coverage   # with v8 coverage report
```

Coverage config (`vitest.config.ts`):
- Includes: `lib/**/*.ts`
- Excludes: `lib/**/*.test.ts`, `lib/site-content.ts`, `lib/constants.ts`

Current test suites:
- `lib/folio.test.ts` — folio format, determinism, 10k collision sweep
- `lib/schemas.test.ts` — Zod validation happy paths, field validation, CFDI conditional logic
- `lib/admin-auth.test.ts` — bcrypt password hashing, admin credentials verification
- `lib/sentry-scrub.test.ts` — PII redaction for strings, objects, nested structures, depth limits

The CI workflow at `.github/workflows/ci.yml` runs `lint → build` on every PR to `main`. Tests are run locally via `npm test`.

---

## Deployment Process

Target platform: **Vercel**.

Pre-deploy checklist:
```bash
npm run check-env       # all required vars present locally
npm run typecheck       # TS clean
npm test                # unit tests green
npm run build           # full prod build succeeds locally
```

### Env sync workflow

```bash
# 1. Ensure local .env.local is correct
npm run check-env

# 2. Push to Vercel (production + preview)
npm run vercel:env:push

# 3. Pull from Vercel (when joining from a new machine)
npm run vercel:env:pull
```

### Build-time env validation

- `scripts/check-env.mjs` runs as a `prebuild` hook.
- Default: warnings only (does not block deploys).
- Strict mode: set `ENFORCE_ENV_VALIDATION=1` to fail the build on missing vars.
- Bypass: `SKIP_ENV_VALIDATION=1 npm run build`.

### Sentry source maps

Source map uploads only happen when `SENTRY_AUTH_TOKEN` is present in the environment (set in Vercel → Project Settings → Environment Variables). Local builds skip the upload step. The `/monitoring` tunnel route proxies Sentry events around ad blockers.

---

## Key Architecture Decisions

1. **Server Actions over API routes** for form submissions. The registration flow is entirely within `app/actions/registro.ts` → `server/use-cases/create-lead.ts`.
2. **Use-case layer** (`server/use-cases/`) isolates business logic from Next.js routing/server-action plumbing.
3. **Fail-safe email sending**: `Promise.allSettled` ensures a send failure cannot break the persisted registration. Errors are logged to Sentry but not surfaced to the user.
4. **Rate limiting fail-closed in production**: if Upstash Redis vars are missing in production, the rate limiter warns but does not block. In practice, production should always have Redis configured.
5. **Admin auth is password-based with bcrypt**: no Supabase Auth or NextAuth dependency. Credentials are stored in `public.admins` (bcrypt-hashed). Sessions are HMAC-signed cookies lasting 7 days (`HttpOnly + Secure + SameSite=Strict`).
6. **Health endpoint** (`/api/health`) dynamically imports `@/lib/supabase` inside the handler so Next.js build-time static analysis never evaluates env-dependent code.
7. **CSP nonce** is generated per-request in `middleware.ts` using the Web Crypto API (Edge Runtime compatible). The nonce is passed to `layout.tsx` via `headers()` and applied to inline `<script>` tags.
8. **Image optimization**: all images are served locally from `/public/images`. No remote domains are configured in `next.config.ts`. Use `next/image` with local paths.

---

## Routes Reference

| Route | Purpose |
|---|---|
| `/` | Marketing landing + registration form |
| `/recuperar-folio` | Passwordless folio reissue (rate-limited, neutral anti-enumeration messages) |
| `/admin/login` | Operator login (email + password) |
| `/admin/registros` | Registration dashboard (search, filter, paginate, stats, mark paid, cancel) |
| `/admin/admins` | Admin user management (create, edit, delete) |
| `/admin/registros/export.csv` | RFC 4180 CSV export with UTF-8 BOM |
| `/api/health` | Liveness probe (returns 503 on Supabase failure) |
| `/terminos-y-condiciones` | Terms and conditions |
| `/aviso-de-privacidad` | Privacy notice |

---

## Operational Docs

- `docs/DEPLOYMENT.md` — Detailed Vercel deploy guide, env sync, strict mode, adding new env vars
- `docs/RUNBOOK.md` — Operational playbook for event week (monitoring, SOPs, payment reconciliation, check-in, disaster recovery)
- `docs/TROUBLESHOOTING.md` — Common issues and fixes
- `CLAUDE.md` — Additional guidance for Claude Code

---

## Node Version

Node 20.x (enforced in `package.json` `engines` and `.nvmrc`).
