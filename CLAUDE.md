# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SC Security Summit 2026 is a Next.js 15 event registration platform for a supply chain security conference in Reynosa, Mexico (Sept 24–25, 2026). It serves as a bilingual (Spanish/English) landing page with integrated registration backed by Supabase.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build (runs `check-env` first via `prebuild`)
npm run start      # Run production server
npm run lint       # Next.js linter
npm run check-env  # Validate required env vars without building
```

`npm run build` runs `scripts/check-env.mjs` first. The script aborts the build if required env vars are missing or still hold placeholder values from `.env.local.example`. Bypass for emergency builds with `SKIP_ENV_VALIDATION=1 npm run build`.

No test runner is configured — validation is handled via Zod schemas and TypeScript strict mode.

## Architecture

**Pattern:** Next.js 15 App Router + Server Actions + Supabase PostgreSQL

The registration flow is:
1. `RegistroForm.tsx` (client) collects data and submits
2. `app/actions/registro.ts` (Server Action) runs: honeypot check → rate limit → Cloudflare Turnstile verification → Zod validation → Supabase insert → bilingual confirmation + organizer notification emails (Resend, awaited via `Promise.allSettled` so a send failure cannot break the persisted registration)
3. On success, a `folio` number (format: `SCSS2026-XXXXX-XXXX`) is returned with confetti/toast feedback

**Key files:**
- `lib/schemas.ts` — Zod schema for the registration form; CFDI (invoice) fields are conditionally required when `requiere_cfdi=true`
- `lib/supabase.ts` — Two clients: public anon (limited) and admin service_role (server-only, full insert/read)
- `lib/rate-limit.ts` — Distributed Upstash Redis sliding window (5 req / 15 min per IP). Fail-closed in production — throws if `UPSTASH_REDIS_REST_*` env vars are missing. Falls back to allow-all in dev.
- `lib/turnstile.ts` — Cloudflare Turnstile bot verification
- `lib/email.ts` + `lib/email-templates.ts` — Resend transactional emails. Bilingual ES/EN attendee confirmation, ES-only organizer notification. Fail-safe: send errors are logged but do not surface to the user once the registration is persisted.
- `lib/constants.ts` + `lib/site-content.ts` — Single source of truth for pricing tiers, speaker data, sponsors, FAQ copy
- `scripts/check-env.mjs` — `prebuild` env-var validator

**Bilingual support:** All components accept a `language?: "es" | "en"` prop. Text objects are keyed by language throughout.

## Environment Variables

Public (browser-safe, `NEXT_PUBLIC_` prefix):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_TURNSTILE_SITE_KEY
NEXT_PUBLIC_SITE_URL
```

Server-only (never expose to client):
```
SUPABASE_SERVICE_ROLE_KEY
TURNSTILE_SECRET_KEY
CONTACT_EMAIL
RESEND_API_KEY
EMAIL_FROM                  # optional override; default "SC Security Summit <noreply@scsecuritysummit.com>"
UPSTASH_REDIS_REST_URL      # required in production for distributed rate limiting
UPSTASH_REDIS_REST_TOKEN
```

Copy `.env.local.example` to `.env.local` to get started. The `prebuild` hook validates these at build time — placeholder values from the example file are explicitly rejected.

## Database

Supabase PostgreSQL table `registros`. Row Level Security is enabled — only `service_role` can SELECT/UPDATE/INSERT/DELETE. Schema and migrations are in `/supabase/migrations/`:

- `002_hardening.sql` — revokes all grants from `anon`/`authenticated`, hardens function `search_path`, adds audit columns, enforces price-per-tier and email-format CHECK constraints.
- `003_rls_explicit_deny.sql` — defense-in-depth deny policy on `anon`/`authenticated` so a future accidental GRANT cannot bypass RLS at row level.

Key business rules enforced at the DB level:
- `email` is UNIQUE (prevents duplicate registrations)
- `folio` is UNIQUE
- `tipo_acceso` is an ENUM: `estudiante | general | vip`
- `estado_pago` is an ENUM: `pendiente | pagado | cancelado`

## Security Conventions

The form uses layered bot/spam protection: honeypot field (`name="website"` hidden from real users), distributed Upstash rate limiting, and Cloudflare Turnstile. Do not remove any of these layers without adding an equivalent.

Security headers are split between `next.config.ts` (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Permitted-Cross-Origin-Policies) and `middleware.ts` (nonce-based CSP per-request, including `form-action`, `base-uri`, `frame-ancestors`, `object-src`). If adding new external script or font sources, update the CSP allowlist in `middleware.ts`. Validate any CSP change at https://csp-evaluator.withgoogle.com.

The `SUPABASE_SERVICE_ROLE_KEY` must only ever be used in Server Actions or API routes — never import `lib/supabase.ts`'s admin client in any client component.

## Styling

Tailwind CSS v4 with PostCSS. Design tokens (colors, spacing) use CSS custom properties defined in `app/globals.css`. Prefer CSS variables over hardcoded Tailwind values for brand colors.

## Content Updates

To update speakers, pricing, sponsor tiers, FAQ, or landing page copy, edit `lib/constants.ts` or `lib/site-content.ts` — do **not** hardcode text into components. Speaker images live in `/public/images/` and are referenced by filename in `site-content.ts`.
