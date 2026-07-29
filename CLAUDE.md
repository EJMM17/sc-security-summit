# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SC Security Summit 2026 is the Next.js 15 marketing site for a supply chain security conference in Reynosa, Mexico (Sept 24, 2026). It is a bilingual (Spanish/English) landing page. Individual ticketing is handled off-site by Eventbrite; the site itself only collects corporate-pass and sponsorship inquiries, which are delivered by email through Resend. There is no application database.

## Commands

```bash
npm run dev            # Start dev server at http://localhost:3000
npm run build          # Production build (runs `check-env` first via `prebuild`)
npm run start          # Run production server
npm run lint           # Next.js linter
npm run typecheck      # tsc --noEmit
npm test               # Vitest run (lib/**/*.test.ts + tests/**/*.test.ts)
npm run test:watch     # Vitest watch mode
npm run test:coverage  # Vitest with v8 coverage report
npm run check-env      # Validate required env vars without building
```

`npm run build` runs `scripts/check-env.mjs` first. The script aborts the build if required env vars are missing or still hold placeholder values from `.env.local.example`. Bypass for emergency builds with `SKIP_ENV_VALIDATION=1 npm run build`.

Tests live next to source files (`lib/foo.test.ts` next to `lib/foo.ts`). The CI workflow at `.github/workflows/ci.yml` runs `typecheck → test → build` on every PR.

## Architecture

**Pattern:** Next.js 15 App Router + Server Actions, no database

Two inquiry flows, both ending in an email:
1. `CorporatePassForm.tsx` / `SponsorInquiryForm.tsx` (client) collect data and submit
2. `app/actions/inquiries.ts` (Server Action) runs: honeypot check → rate limit → Zod validation (discriminated union on `kind`) → Resend send to `CONTACT_EMAIL`
3. The form reports success or a typed failure (`invalid`, `rate_limited`, `email_unavailable`)

Ticket purchases leave the site entirely: every pricing CTA links to `EVENTBRITE_URL` (`lib/content.ts`, overridable with `NEXT_PUBLIC_EVENTBRITE_URL`).

**Key files:**
- `lib/content.ts` — single source of truth for all copy: speakers, agenda, pricing tiers, sponsors, FAQ, both languages
- `lib/rate-limit.ts` — Distributed Upstash Redis sliding window (5 req / 15 min per IP). Fail-closed in production — throws if `UPSTASH_REDIS_REST_*` env vars are missing. Falls back to allow-all in dev.
- `lib/email.ts` + `lib/email-templates.ts` — Resend delivery plus `emailShell`/`escapeHtml`, the branded chrome and escaping used by the inquiry emails
- `lib/language.ts` — server-side language detection (`?lang` → `NEXT_LOCALE` cookie → `Accept-Language` → "es"). Mirrored client-side via `setLanguageCookie` server action so SSR `<html lang>` and the React state agree.
- `lib/sentry-scrub.ts` — recursive PII scrubber (email, RFC, phone, card patterns + key-name allowlist) wired into Sentry's `beforeSend` / `beforeBreadcrumb`.
- `scripts/check-env.mjs` — `prebuild` env-var validator
- `instrumentation.ts` + `sentry.{client,server,edge}.config.ts` — Sentry runtime bootstraps, gated behind `SENTRY_DSN` so the SDK is absent from the bundle when unconfigured.

**Routes:**
- `/` — marketing landing, corporate-pass form (`#registro`) and sponsorship form (`#contacto-patrocinio`)
- `/ctpat-oea`, `/seguridad-cadena-suministro`, `/evento-logistica-reynosa`, `/sponsors`, `/media-kit` — SEO landing pages
- `/aviso-de-privacidad`, `/terminos-y-condiciones` — legal (noindex)
- `/api/health` — liveness probe for uptime monitors; no external dependency

**Bilingual support:** All components accept a `language?: "es" | "en"` prop. Text objects are keyed by language throughout.

## Environment Variables

Public (browser-safe, `NEXT_PUBLIC_` prefix):
```
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_EVENTBRITE_URL   # optional; falls back to the URL hardcoded in lib/content.ts
```

Server-only (never expose to client):
```
CONTACT_EMAIL               # inbox that receives corporate-pass and sponsorship inquiries
RESEND_API_KEY
EMAIL_FROM                  # optional override; default "SC Security Summit <hola@scsecuritysummit.com>"
UPSTASH_REDIS_REST_URL      # required in production for distributed rate limiting
UPSTASH_REDIS_REST_TOKEN
SENTRY_DSN                  # optional; SDK no-ops when unset
SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN  # only used by Vercel for source-map upload
```

Copy `.env.local.example` to `.env.local` to get started. The `prebuild` hook validates these at build time — placeholder values from the example file are explicitly rejected.

## Database

**There is none at runtime.** The site was built on a Supabase `registros` table for individual
registration; that flow was retired when ticketing moved to Eventbrite. `/supabase/migrations/`
is kept only as the historical record of the table, and the rows collected before the cutover
still live in the Supabase project — reachable through the Supabase console, not from this app.
Do not reintroduce a database dependency without an explicit decision to do so.

## Security Conventions

The inquiry forms use layered bot/spam protection without external CAPTCHA: honeypot field (`name="website"` hidden from real users), distributed Upstash rate limiting, and server-side Zod validation. Do not weaken these layers without adding an equivalent.

Security headers are split between `next.config.ts` (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Permitted-Cross-Origin-Policies) and `middleware.ts` (nonce-based CSP per-request, including `form-action`, `base-uri`, `frame-ancestors`, `object-src`). If adding new external script or font sources, update the CSP allowlist in `middleware.ts`. Validate any CSP change at https://csp-evaluator.withgoogle.com.

`RESEND_API_KEY` and `CONTACT_EMAIL` are server-only — they must stay inside Server Actions (`app/actions/inquiries.ts`) and never reach a client component.

## Styling

Tailwind CSS v4 with PostCSS. Design tokens (colors, spacing) use CSS custom properties defined in `app/globals.css`. Prefer CSS variables over hardcoded Tailwind values for brand colors.

## Content Updates

To update speakers, pricing, sponsor tiers, FAQ, or landing page copy, edit `lib/content.ts` — do **not** hardcode text into components. Every entry exists in both `es` and `en`; update both. Speaker images live in `/public/images/` and are referenced by filename in `lib/content.ts`.
