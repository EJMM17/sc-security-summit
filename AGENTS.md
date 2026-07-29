# SC Security Summit 2026 — Agent Guide

> This file is written for AI coding agents. It assumes zero prior knowledge of the project.

---

## Project Overview

SC Security Summit 2026 is a **Next.js 15** marketing site for a supply-chain security conference in Reynosa, Mexico (Sept 24, 2026). It is a bilingual (Spanish/English) landing page.

Two things to internalize before changing anything:

1. **Individual ticketing is off-site.** Every access CTA links to Eventbrite. The site does not sell, price-check or confirm anything.
2. **There is no database.** The site's only write path is an email: the corporate-pass and sponsorship forms send an inquiry to `CONTACT_EMAIL` through Resend. Nothing is persisted.

The earlier build had a Supabase-backed registration flow (folios, `/admin` dashboard, payment reconciliation). It was retired when ticketing moved to Eventbrite. `supabase/migrations/` remains only as the historical record — do not wire it back up without an explicit decision.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v4 + PostCSS |
| Fonts | Google Fonts (Inter, Oswald) via `next/font` |
| Validation | Zod |
| Rate Limiting | Upstash Redis (`@upstash/ratelimit`, `@upstash/redis`) |
| Bot Protection | Honeypot + Upstash rate limiting + server-side validation |
| Email | Resend |
| Error Tracking | Sentry (`@sentry/nextjs`) |
| Analytics | GTM/GA4 + Vercel Speed Insights |
| Testing | Vitest 4 + Playwright |
| Icons | Lucide React |
| Toasts | Sonner |

---

## Project Structure

```
app/                          # Next.js App Router
  layout.tsx                  # Root layout: SEO metadata, JSON-LD, fonts, CSP nonce
  page.tsx                    # Landing page — composes the marketing sections
  globals.css                 # Tailwind v4 import + the design system (CSS variables, animations)
  (marketing)/_components/    # Hero, WhyAttend, Pillars, NetworkingHub, Speakers, Agenda,
                              # Gallery, Value, Audience, Pricing, Sponsors, FinalCTA,
                              # Registro, Location, Faq, Footer, Header
  (marketing)/_components/_primitives/  # PrimaryCTA, SectionIntro, WaveSeparator, PremiumCheck
  actions/
    inquiries.ts              # Server Action: corporate-pass + sponsorship → Resend
    language.ts               # Server Action: set language cookie
  api/health/route.ts         # Liveness probe (no external dependency)
  ctpat-oea/, seguridad-cadena-suministro/, evento-logistica-reynosa/,
  sponsors/, media-kit/       # SEO landing pages
  aviso-de-privacidad/, terminos-y-condiciones/   # Legal (noindex)

components/                   # Shared/client components
  SpeakersCarousel.tsx        # Speaker carousel (autoplay + keyboard + dots)
  CorporatePassForm.tsx       # Corporate-pass request form
  SponsorInquiryForm.tsx      # Sponsorship request form
  CountdownTimer.tsx, AnimatedCounter.tsx, ScrollReveal.tsx, HeaderScroll.tsx,
  MobileNav.tsx, MouseGlow.tsx, HeroGradientMesh.tsx, MarqueeStrip.tsx,
  AmbientCanvas(.Lazy).tsx, ScrollProgress.tsx, WhatsAppButton.tsx, FAQAccordion.tsx
  Analytics.tsx, ConsentMode.tsx, CookieConsent.tsx, MetaPixel.tsx,
  LinkedInInsight.tsx, InteractionTracker.tsx, AttributionCapture.tsx

lib/
  content.ts                  # SSOT for ALL copy, speakers, agenda, pricing, sponsors, FAQ (es + en)
  content.test.ts             # Guards the shape of that content
  email.ts                    # Resend sender (lazy singleton, never throws)
  email-templates.ts          # escapeHtml + emailShell (branded chrome)
  rate-limit.ts               # Upstash sliding window (5 req / 15 min per IP)
  language.ts                 # Server-side language detection
  attribution.ts              # First/last-touch UTM capture (client-side only)
  sentry-scrub.ts             # PII redactor for Sentry events

tests/                        # Cross-cutting tests + vitest setup
e2e/landing.spec.ts           # Playwright smoke test of the landing page
scripts/check-env.mjs         # Prebuild env-var validator
supabase/migrations/          # Historical record of the retired registration table

sentry.{client,server,edge}.config.ts   # Sentry SDK init (gated by DSN)
instrumentation.ts            # Wires Sentry per runtime
middleware.ts                 # Nonce-based CSP on every request
next.config.ts                # Next config + security headers + Sentry wrapping
```

---

## Build and Test Commands

```bash
npm run dev            # dev server on :3000
npm run build          # production build (prebuild runs check-env)
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm test               # vitest (lib/**/*.test.ts + tests/**/*.test.ts)
npm run test:coverage  # vitest + v8 coverage
npm run test:e2e       # playwright (assumes http://localhost:3000)
npm run check-env      # validate env vars without building
```

---

## Environment Variables

| Variable | Required? | Description |
|---|---|---|
| `RESEND_API_KEY` | Yes | Without it, no inquiry ever reaches the team |
| `CONTACT_EMAIL` | Yes | Inbox that receives corporate-pass and sponsorship requests |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical URL for SEO/metadata |
| `NEXT_PUBLIC_EVENTBRITE_URL` | Recommended | Overrides the Eventbrite URL hardcoded in `lib/content.ts` |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Production | Distributed rate limiting |
| `EMAIL_FROM` | Optional | Sender; domain must be verified in Resend |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | Optional | SDK no-ops when unset |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | Optional | Source-map upload (Vercel only) |
| `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_LINKEDIN_PARTNER_ID` | Optional | Measurement; see `docs/TRACKING.md` |

Build-time checks live in `scripts/check-env.mjs`. Copy `.env.local.example` to `.env.local` to get started, then mirror values into Vercel (production + preview).

---

## Security Conventions

The inquiry forms use **layered bot/spam protection**:
1. **Honeypot field** (`name="website"`, hidden from real users)
2. **Distributed rate limiting** (Upstash Redis, 5 req / 15 min per IP)
3. **Server-side Zod validation** (discriminated union on `kind`)

Do not weaken any of these layers without adding an equivalent replacement.

Security headers are split:
- `next.config.ts` sets HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Permitted-Cross-Origin-Policies
- `middleware.ts` sets a **nonce-based CSP** per request

If adding external scripts or font sources, update the CSP allowlist in `middleware.ts` and validate at https://csp-evaluator.withgoogle.com.

**Critical:** `RESEND_API_KEY` and `CONTACT_EMAIL` are server-only. They belong in Server Actions, never in a client component.

PII is scrubbed from Sentry events via `lib/sentry-scrub.ts` (emails, RFCs, phone numbers, credit-card patterns, and known sensitive keys).

---

## Code Style Guidelines

- **TypeScript strict mode.** No `any` without explicit justification.
- **Path alias:** `@/` maps to the project root (`tsconfig.json` + `vitest.config.ts`).
- **Server-only modules** that touch secrets start with `import "server-only";`.
- **Lazy singletons** for optional third-party clients (Resend, Upstash) so missing env vars never throw during `next build`.
- **Bilingual components** accept a `language: "es" | "en"` prop; text objects are keyed by language.
- **Content updates** (speakers, pricing, sponsors, FAQ, landing copy) go in `lib/content.ts`, in **both** `es` and `en`. Never hardcode marketing text into components.
- **Design tokens** (colors, spacing, shadows, radii) are CSS custom properties in `app/globals.css`. Prefer them over hardcoded Tailwind values for brand colors.
- **Tailwind v4** uses `@import "tailwindcss"` and `@theme` blocks in CSS. There is no `tailwind.config.js`.

---

## Testing Instructions

Unit tests live next to their source (`lib/foo.test.ts`) or in `tests/` when they cross modules.

Current suites:
- `lib/content.test.ts` — content SSOT: speaker carousel copy, the four access tiers, agenda blocks
- `lib/language.test.ts` — language detection precedence
- `lib/sentry-scrub.test.ts` — PII redaction
- `tests/email.test.ts` — Resend sender behavior with/without an API key
- `tests/email-templates.test.ts` — escaping and the branded email shell
- `e2e/landing.spec.ts` — Playwright: hero, presenter logos, carousel, section order, prices, Eventbrite CTA, both forms

CI (`.github/workflows/ci.yml`) runs typecheck → test → build on every PR.

---

## Deployment Process

Target platform: **Vercel**.

```bash
npm run check-env && npm run typecheck && npm test && npm run build
```

- `scripts/check-env.mjs` runs as a `prebuild` hook. Default: warnings only. Strict: `ENFORCE_ENV_VALIDATION=1`. Bypass: `SKIP_ENV_VALIDATION=1`.
- Sentry source maps upload only when `SENTRY_AUTH_TOKEN` is present. The `/monitoring` tunnel route proxies Sentry events around ad blockers.
- The app is stateless, so rolling back to a previous Vercel deployment is always safe.

---

## Key Architecture Decisions

1. **Server Actions over API routes** for form submissions (`app/actions/inquiries.ts`).
2. **One content source.** `lib/content.ts` holds every string, price and agenda entry for both languages; components take data, never literals.
3. **Email is the product's write path.** A failed Resend send loses the lead — it is surfaced to the user as `email_unavailable` rather than swallowed.
4. **Rate limiting fails closed in production**: `lib/rate-limit.ts` throws if Upstash vars are missing outside development.
5. **Health endpoint has no dependencies**, so it reports on the app itself and never on a third party.
6. **CSP nonce** is generated per request in `middleware.ts` with the Web Crypto API (Edge-compatible) and applied to inline scripts via `headers()`.
7. **Images are local.** Everything is served from `/public/images`; no remote domains are configured. Use `next/image` with local paths.

---

## Routes Reference

| Route | Purpose |
|---|---|
| `/` | Marketing landing; `#registro` corporate-pass form, `#contacto-patrocinio` sponsorship form |
| `/ctpat-oea`, `/seguridad-cadena-suministro`, `/evento-logistica-reynosa` | SEO landing pages |
| `/sponsors` | Sponsorship detail page |
| `/media-kit` | Press/media assets |
| `/api/health` | Liveness probe |
| `/terminos-y-condiciones`, `/aviso-de-privacidad` | Legal (noindex) |

---

## Operational Docs

- `docs/DEPLOYMENT.md` — Vercel deploy guide, env sync, adding new env vars
- `docs/RUNBOOK.md` — Event-week playbook (monitoring, SOPs, disaster recovery)
- `docs/TROUBLESHOOTING.md` — Symptom → cause → fix
- `docs/TRACKING.md` — GTM/GA4 setup and the dataLayer contract
- `docs/DNS.md` — SPF / DKIM / DMARC / Vercel apex
- `CLAUDE.md` — Additional guidance for Claude Code

---

## Node Version

Node 20.x (enforced in `package.json` `engines` and `.nvmrc`).
