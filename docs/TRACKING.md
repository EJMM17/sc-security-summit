# Tracking, Attribution & Conversion Measurement

This document is the single source of truth for how SC Security Summit 2026
measures traffic, attribution and conversions. It covers the dataLayer
contract, environment variables, the GTM configuration that must happen
**outside** the codebase, and how to validate everything.

> TL;DR — **Google Tag Manager is the single measurement entrypoint.** GA4,
> Google Ads and (optionally) Meta/LinkedIn are configured *inside* GTM.
> The site only pushes a clean, documented `dataLayer` contract.

---

## 1. Environment variables

All are `NEXT_PUBLIC_*` (build-time, browser-safe). Set them in Vercel →
Project Settings → Environment Variables (Production **and** Preview), then
redeploy. None are hardcoded.

| Variable | Purpose | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager container (`GTM-XXXXXXX`) | **Primary entrypoint.** When set, gtag.js is *not* loaded directly. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 (`G-XXXXXXXXXX`) | Optional. Only loaded **directly** when `NEXT_PUBLIC_GTM_ID` is absent. With GTM present, configure GA4 inside GTM instead. |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel base code | Loaded directly by `components/MetaPixel.tsx`. Leave empty to disable. |
| `NEXT_PUBLIC_LINKEDIN_PARTNER_ID` | LinkedIn Insight Tag | Loaded directly by `components/LinkedInInsight.tsx`. Leave empty to disable. |
| `SENTRY_DSN` | Error monitoring (optional) | Unrelated to marketing; SDK no-ops when unset. |

### Avoiding double counting (important)

`components/Analytics.tsx` enforces the single-entrypoint rule: **if
`NEXT_PUBLIC_GTM_ID` is present it does not inject `gtag.js`.** So:

- ✅ Recommended: set only `NEXT_PUBLIC_GTM_ID`; add a GA4 Configuration tag
  inside GTM.
- ⚠️ If you set **both** env vars *and* also add GA4 inside GTM, you would
  double count — but the code prevents the direct loader from running while
  GTM is present, so the only place GA4 can live is GTM. Keep it that way.
- Meta Pixel & LinkedIn are loaded **directly** (not via GTM). Do **not** also
  add Meta/LinkedIn base tags inside GTM, or events will fire twice.

---

## 2. dataLayer contract

The app pushes the following events. Everything else (GA4 events, Google Ads
conversions, Meta CompleteRegistration, LinkedIn conversion) is mapped from
these inside GTM.

### Conversion (success page `/registro-exitoso`)

Fired **once per folio** (`useRef` + per-folio `sessionStorage` guard).

```js
// GA4 standard lead event — map to GA4 "generate_lead" + Google Ads conversion
{
  event: "generate_lead",
  lead_type: "event_registration",
  tipo_acceso: "general" | "vip" | "estudiante",
  value: 2500,                 // MXN, before tax
  currency: "MXN",
  transaction_id: "SCSS2026-XXXXX-XXXX",  // folio — use for dedup in Ads
  user_data: {                 // present only when available (Enhanced Conversions)
    sha256_email_address: "…",
    sha256_phone_number: "…",
    sha256_first_name: "…",
    sha256_last_name: "…"
  }
}

// Legacy event (kept for any existing GTM triggers)
{
  event: "registro_completo",
  tipo_acceso: "general",
  monto_mxn: 2500,
  folio: "SCSS2026-XXXXX-XXXX"
}
```

### Engagement / micro-conversions (site-wide)

Emitted by `components/InteractionTracker.tsx` (delegated click listener — no
button markup changed) and `components/RegistroFormEnhancer.tsx`.

| Event | When | Parameters |
| --- | --- | --- |
| `form_start` | First interaction with the registration form | `cta_location`, `page_path`, `language` |
| `form_error` | Server-side validation returned errors | `error_fields`, `error_count`, `page_path`, `language` |
| `click_register` | Click any link to `#registro` | `cta_location`, `page_path`, `language` |
| `click_sponsor` | Sponsorship mailto / `/sponsors` / `#patrocinadores` | `cta_location`, `page_path`, `language` |
| `click_whatsapp` | WhatsApp link click (off success page) | `cta_location`, `page_path`, `language` |
| `click_calendar` | "Add to calendar" on `/registro-exitoso` | `cta_location`, `page_path`, `language` |
| `share_whatsapp` | WhatsApp share on `/registro-exitoso` | `cta_location`, `page_path`, `language` |

`cta_location` is the nearest section `id` (e.g. `patrocinadores`, `registro`).

---

## 3. Attribution capture

`lib/attribution.ts` + `components/AttributionCapture.tsx` persist **first
touch** and **last touch** to `localStorage` and a first-party cookie
(`scss_attr`, 90 days, SameSite=Lax). Captured on every page load, so an
Ad → browse → register journey keeps its attribution.

**Captured params:** `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`,
`utm_content`, `gclid`, `gbraid`, `wbraid`, `fbclid`, `li_fat_id`, `msclkid`,
plus `landing_page`, `referrer`, `first_touch_timestamp`,
`last_touch_timestamp`.

These ride along as **hidden inputs** in the registration form (UTMs/click IDs
from last touch; landing page/referrer from first touch) and are persisted to
the `registros` table by the server action.

### Database

Apply `supabase/migrations/010_attribution_columns.sql` (Supabase Dashboard →
SQL Editor, or `supabase db push`). The columns are nullable `TEXT`/`TIMESTAMPTZ`.

> Forward-compatible: if the migration hasn't run yet, `createLead` retries the
> insert **without** the attribution columns, so registrations never break — a
> Sentry warning (`create_lead.attribution_columns_missing`) flags it.

---

## 4. Enhanced Conversions (Google Ads)

The conversion `user_data` is **SHA-256 hashed in the browser**
(`lib/enhanced-conversions.ts`) with Google's normalization (trim, lowercase
email/names, strip phone formatting). Raw PII is never pushed to the dataLayer.

Flow: on submit we stash normalized values in `sessionStorage`; on the success
page we hash them, attach to the `generate_lead` push, then clear storage.

**GTM/Google Ads setup required (external):**

1. In Google Ads → Conversions → turn on **Enhanced Conversions for leads**.
2. In GTM, on the Google Ads Conversion tag, set **User-Provided Data** to read
   the already-hashed fields from `{{DLV - user_data}}` (Data Layer Variable).
3. Confirm the diagnostics in Google Ads show enhanced conversions received.

> Prefer doing the hashing/match in GTM only if you switch to pushing
> unhashed user data. We chose frontend hashing for privacy; keep the GTM tag
> configured to accept SHA-256 input.

---

## 5. GTM configuration checklist (do this in GTM, not in code)

1. **Conversion Linker** tag → trigger **All Pages**. (Required for gclid/
   gbraid/wbraid/Ads cookies.)
2. **GA4 Configuration** tag (Measurement ID `G-…`) → All Pages.
3. **GA4 Event** tag → event name `generate_lead`, trigger = Custom Event
   `generate_lead`. Map `value`, `currency`, `transaction_id`, `tipo_acceso`.
4. **GA4 Event** tags for the micro-events (`form_start`, `click_register`,
   etc.) as desired.
5. **Google Ads Conversion** tag → trigger Custom Event `generate_lead`; set
   value `{{DLV - value}}`, currency `MXN`, transaction ID `{{DLV - transaction_id}}`
   (for dedup); attach User-Provided Data for Enhanced Conversions.
6. **Google Ads Remarketing** tag → All Pages.
7. (Optional) Meta & LinkedIn — **only if you remove the direct pixels** in
   `components/MetaPixel.tsx` / `components/LinkedInInsight.tsx`. By default
   those fire directly, so do not duplicate them in GTM.

### Recommended Data Layer Variables

`value`, `currency`, `transaction_id`, `tipo_acceso`, `lead_type`,
`user_data`, `cta_location`, `page_path`, `language`, `error_count`.

---

## 6. Validation

| Tool | Checks |
| --- | --- |
| **GTM Preview / Tag Assistant** | Tags fire on the right events; `generate_lead` fires once. |
| **GA4 DebugView** | `generate_lead` + micro-events arrive with parameters. |
| **Meta Pixel Helper** | `PageView` + `CompleteRegistration` fire once. |
| **LinkedIn Insight Tag** (browser extension / Campaign Manager) | Insight tag active; conversion fires. |
| **Browser console** | No CSP violations (see below). |
| **Network tab** | `collect?...` (GA4), `google.com/ads`, `fbevents`, `px.ads.linkedin.com` requests succeed. |

### Manual smoke test

1. Visit `/?utm_source=google&utm_medium=cpc&utm_campaign=test&gclid=ABC123`.
2. Navigate around, then register.
3. On `/registro-exitoso`, confirm `generate_lead` fires **once** (refresh →
   does not fire again).
4. Inspect the `registros` row: UTMs, `gclid`, `landing_page`, touch timestamps
   are populated.
5. Confirm no console CSP errors.

### Avoiding double counting — recap

- Only one GA4 path: GTM (direct gtag is disabled when GTM is set).
- Meta/LinkedIn fire **directly**, not in GTM.
- `generate_lead` is de-duplicated per folio via `sessionStorage`.

---

## 7. CSP (Content-Security-Policy)

CSP is nonce-based and set per request in `middleware.ts`. The marketing
allowlist already includes:

- **script-src:** `googletagmanager.com`, `google-analytics.com`,
  `googleadservices.com`, `googleads.g.doubleclick.net`, `connect.facebook.net`,
  `snap.licdn.com`
- **img-src:** Google/Ads/DoubleClick conversion + remarketing pixels,
  `facebook.com`, `px.ads.linkedin.com`
- **connect-src:** GA4 incl. regional `*.google-analytics.com` /
  `*.analytics.google.com`, Ads/DoubleClick beacons, Meta, LinkedIn
- **frame-src:** `td.doubleclick.net`, `bid.g.doubleclick.net` (remarketing)

**If you add a new vendor**, add its host to the matching directive in
`middleware.ts` and re-validate at <https://csp-evaluator.withgoogle.com>.
Never add `'unsafe-inline'` to `script-src` — the nonce mechanism works.

### Reading CSP errors

Console shows: `Refused to load the script 'https://…' because it violates
the following Content Security Policy directive: "script-src …"`. The directive
named is the one to extend.

---

## 8. Consent Mode v2

Implemented and wired to the cookie banner:

- `components/ConsentMode.tsx` sets the **default** consent state before GTM /
  GA / Ads / pixels load (`strategy="beforeInteractive"`, nonce for CSP).
  Defaults are **denied** (`ad_storage`, `ad_user_data`, `ad_personalization`,
  `analytics_storage`), with `functionality_storage` / `security_storage`
  granted. Returning visitors who previously accepted get `granted` applied as
  the default immediately (read from `localStorage`).
- `url_passthrough` is on and `ads_data_redaction` is enabled while consent is
  denied (better modeling, no ad cookies).
- `components/CookieConsent.tsx` calls `gtag('consent','update', …)` on the
  user's choice: **Aceptar todas → granted**, **Solo esenciales → denied**, and
  pushes a `consent_update` dataLayer event.

> Default-denied is the privacy-first / compliant choice: with Consent Mode,
> GTM still sends cookieless pings so GA4/Ads can model conversions. If the
> client prefers analytics-on-by-default, change the defaults in
> `ConsentMode.tsx` (and review legal copy in the banner).

**GTM setup required (external):** In GTM → Container Settings, enable
**Consent Overview / "Require additional consent for tags"**, then set each
tag's **Consent Settings** to require the right consent type (GA4 →
`analytics_storage`; Ads/remarketing → `ad_storage`, `ad_user_data`,
`ad_personalization`). The Conversion Linker should be set to fire regardless
(it respects consent automatically). Optionally configure consent **regions**.

## 9. Pending external tasks (not code)

- [ ] Create / confirm the GTM container and set `NEXT_PUBLIC_GTM_ID`.
- [ ] Configure GA4, Google Ads Conversion + Remarketing, Conversion Linker,
      Enhanced Conversions inside GTM (section 5).
- [ ] Set per-tag **Consent Settings** in GTM (section 8).
- [x] Apply Supabase migration `010_attribution_columns.sql` — **applied to
      project `Summit` (fydurateumklukehituw)**, 12 columns + 2 indexes verified.
- [ ] (Optional) Set `NEXT_PUBLIC_META_PIXEL_ID` / `NEXT_PUBLIC_LINKEDIN_PARTNER_ID`.
