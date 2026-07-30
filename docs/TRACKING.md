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

### Conversion

Ticket purchases complete on Eventbrite, so the site cannot observe them. The
closest on-site conversion signal is `click_register` (any click on an
Eventbrite CTA or a link to `#registro`) — map that to the Google Ads / Meta
conversion, and reconcile actual sales in the Eventbrite dashboard.

### Engagement / micro-conversions (site-wide)

Emitted by `components/InteractionTracker.tsx` (delegated click listener — no
button markup changed).

| Event | When | Parameters |
| --- | --- | --- |
| `click_register` | Click any link to `#registro` or to Eventbrite | `cta_location`, `page_path`, `language` |
| `click_sponsor` | Sponsorship mailto / `/sponsors` / `#patrocinadores` | `cta_location`, `page_path`, `language` |
| `click_whatsapp` | WhatsApp link click | `cta_location`, `page_path`, `language` |
| `section_view` | First meaningful view of each landing section | `section_id`, `page_path`, `language` |
| `scroll_depth` | Visitor reaches 25/50/75/90/100% page-depth milestones | `percent_scrolled`, `page_path`, `language` |

`cta_location` is the nearest section `id` (e.g. `patrocinadores`, `registro`).

---

## 3. Attribution capture

`lib/attribution.ts` + `components/AttributionCapture.tsx` persist **first
touch** and **last touch** to `localStorage` and a first-party cookie
(`scss_attr`, 90 days, SameSite=Lax), but only after the visitor chooses
**Accept all**. Before a decision or with **Essential only**, attribution is
empty and any value left by an older site version is deleted. After consent,
capture runs on every page load, so an Ad → browse → register journey keeps its
attribution.

**Captured client-side params:** `utm_source`, `utm_medium`, `utm_campaign`,
`utm_term`, `utm_content`, `gclid`, `gbraid`, `wbraid`, `fbclid`, `li_fat_id`,
`msclkid`, plus `landing_page` (path only), `referrer` (origin only),
`first_touch_timestamp` and `last_touch_timestamp`. Query strings and referrer
paths are deliberately excluded because they may contain personal data.

When a corporate or sponsor form is submitted, the server validates and stores
only the five UTM fields, landing page, referrer and both timestamps with that
inquiry. Advertising click IDs remain client-side and are intentionally
discarded by `lib/inquiries/schema.ts` under the data-minimization policy.

The attribution cookie/localStorage lifetime remains 90 days. The inquiry row
follows the separately approved retention policy; do not infer database
retention from the cookie lifetime.

Withdrawing a previous grant through **Cookie settings** stores the denied
choice, deletes first-party attribution and reloads the page so already loaded
marketing scripts are removed.

---

## 4. Enhanced Conversions (Google Ads)

Not implemented in this repository.

- Ticket purchase identity belongs to Eventbrite; configure ticket-sale
  matching there.
- The site receives identity for corporate/sponsor inquiries, but it does not
  push email or phone (plain or hashed) into `dataLayer`.
- Do not add Enhanced Conversions for leads without a separate privacy review,
  consent decision, dataLayer contract and tests proving that raw PII never
  reaches analytics logs.

---

## 5. GTM configuration checklist (do this in GTM, not in code)

1. **Conversion Linker** tag → trigger **All Pages**. (Required for gclid/
   gbraid/wbraid/Ads cookies.)
2. **GA4 Configuration** tag (Measurement ID `G-…`) → All Pages.
3. **GA4 Event** tags for the micro-events (`click_register`, `click_sponsor`,
   `section_view`, `scroll_depth`) as desired.
4. **Google Ads Conversion** tag → trigger Custom Event `click_register`, the
   outbound-to-Eventbrite signal. Reconcile against real sales in Eventbrite.
6. **Google Ads Remarketing** tag → All Pages.
7. (Optional) Meta & LinkedIn — **only if you remove the direct pixels** in
   `components/MetaPixel.tsx` / `components/LinkedInInsight.tsx`. By default
   those fire directly, so do not duplicate them in GTM.

### Recommended Data Layer Variables

`cta_location`, `page_path`, `language`, `section_id`, `percent_scrolled`.

---

## 6. Validation

| Tool | Checks |
| --- | --- |
| **GTM Preview / Tag Assistant** | Tags fire on the right events. |
| **GA4 DebugView** | Micro-events arrive with their parameters. |
| **Meta Pixel Helper** | `PageView` fires once. |
| **LinkedIn Insight Tag** (browser extension / Campaign Manager) | Insight tag active; conversion fires. |
| **Browser console** | No CSP violations (see below). |
| **Network tab** | `collect?...` (GA4), `google.com/ads`, `fbevents`, `px.ads.linkedin.com` requests succeed. |

### Manual smoke test

1. Visit `/?utm_source=google&utm_medium=cpc&utm_campaign=test&gclid=ABC123`
   with a clean browser profile.
2. Before deciding, confirm `scss_attr` and `scss:attribution` do not exist.
3. Choose **Accept all**, navigate around, then click an access CTA.
4. Confirm `click_register` reaches the dataLayer with `cta_location`.
5. Inspect the `scss_attr` cookie: UTMs, `gclid`, `landing_page` and the touch
   timestamps are populated.
6. Open **Cookie settings**, choose **Essential only**, and confirm the page
   reloads and both attribution stores are gone.
7. Confirm the corporate/sponsor hidden attribution inputs are empty and there
   are no console CSP errors.

### Avoiding double counting — recap

- Only one GA4 path: GTM (direct gtag is disabled when GTM is set).
- Meta/LinkedIn fire **directly**, not in GTM.

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
  pushes a `consent_update` dataLayer event. A persistent settings control lets
  the visitor revisit the choice.
- First-party attribution and the Meta/LinkedIn gates use the same decision.
  Attribution is never written or submitted without `all`.

> Default-denied is the privacy-first choice. Do not change it without a new
> legal decision, updated notice, implementation review and tests.

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
- [ ] (Optional) Set `NEXT_PUBLIC_META_PIXEL_ID` / `NEXT_PUBLIC_LINKEDIN_PARTNER_ID`.
