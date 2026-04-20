# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SC Security Summit 2026 is a Next.js 15 event registration platform for a supply chain security conference in Reynosa, Mexico (Sept 24–25, 2026). It serves as a bilingual (Spanish/English) landing page with integrated registration backed by Supabase.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run start    # Run production server
npm run lint     # Next.js linter
```

No test runner is configured — validation is handled via Zod schemas and TypeScript strict mode.

## Architecture

**Pattern:** Next.js 15 App Router + Server Actions + Supabase PostgreSQL

The registration flow is:
1. `RegistroForm.tsx` (client) collects data and submits
2. `app/actions/registro.ts` (Server Action) runs: honeypot check → rate limit → Cloudflare Turnstile verification → Zod validation → Supabase insert
3. On success, a `folio` number (format: `SCSS2026-XXXXX-XXXX`) is returned with confetti/toast feedback

**Key files:**
- `lib/schemas.ts` — Zod schema for the registration form; CFDI (invoice) fields are conditionally required when `requiere_cfdi=true`
- `lib/supabase.ts` — Two clients: public anon (limited) and admin service_role (server-only, full insert/read)
- `lib/rate-limit.ts` — In-memory per-IP rate limiter (5 req / 15 min). **Known limitation:** not distributed; needs migration to Vercel KV or Upstash Redis for multi-region
- `lib/turnstile.ts` — Cloudflare Turnstile bot verification
- `lib/constants.ts` + `lib/site-content.ts` — Single source of truth for pricing tiers, speaker data, sponsors, FAQ copy

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
```

Copy `.env.local.example` to `.env.local` to get started.

## Database

Supabase PostgreSQL table `registros`. Row Level Security is enabled — only `service_role` can SELECT/UPDATE; anon key is INSERT-only. Schema and migration are in `/supabase/`.

Key business rules enforced at the DB level:
- `email` is UNIQUE (prevents duplicate registrations)
- `folio` is UNIQUE
- `tipo_acceso` is an ENUM: `estudiante | general | vip`
- `estado_pago` is an ENUM: `pendiente | pagado | cancelado`

## Security Conventions

The form uses layered bot/spam protection: honeypot field (`name="website"` hidden from real users), in-memory rate limiting, and Cloudflare Turnstile. Do not remove any of these layers without adding an equivalent.

Security headers are configured in `next.config.ts` (CSP, X-Frame-Options, etc.). If adding new external script or font sources, update the CSP allowlist there.

The `SUPABASE_SERVICE_ROLE_KEY` must only ever be used in Server Actions or API routes — never import `lib/supabase.ts`'s admin client in any client component.

## Styling

Tailwind CSS v4 with PostCSS. Design tokens (colors, spacing) use CSS custom properties defined in `app/globals.css`. Prefer CSS variables over hardcoded Tailwind values for brand colors.

## Content Updates

To update speakers, pricing, sponsor tiers, FAQ, or landing page copy, edit `lib/constants.ts` or `lib/site-content.ts` — do **not** hardcode text into components. Speaker images live in `/public/images/` and are referenced by filename in `site-content.ts`.
