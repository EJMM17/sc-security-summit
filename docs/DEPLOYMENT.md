# Deployment — Vercel

The `prebuild` hook (`scripts/check-env.mjs`) validates env vars on every build.
By default it reports warnings and **does not block deploys**.  
If you want fail-fast behavior in any environment, set
`ENFORCE_ENV_VALIDATION=1`.

This guide is the playbook for getting a deploy green on the first try.

---

## 1. First-time setup (per developer / per laptop)

```bash
# One-time: install Vercel CLI globally and authenticate.
npm i -g vercel
vercel login

# Inside the repo: link this checkout to the Vercel project.
# Pick the existing "sc-security-summit" project when prompted; do NOT
# create a new one.
vercel link
```

`vercel link` writes `.vercel/project.json` (already in `.gitignore`).

---

## 2. The single source of truth: `.env.local`

Local `.env.local` drives both local builds and what we push to Vercel.

```bash
cp .env.local.example .env.local
# Edit .env.local with real values from:
#   - Resend → API Keys
#   - Upstash → Redis instance → REST tab
#   - Sentry → Project → Client Keys (DSN)
```

Verify locally:

```bash
npm run check-env   # green ✓ before you push to Vercel
```

---

## 3. Push env vars to Vercel

Two options; **prefer the Vercel CLI** so a typo in the dashboard can't bite us.

### Option A — Vercel CLI (recommended)

Use `vercel env add <NAME>` for both `production` and `preview`, or use
`vercel env pull .env.local` to inspect existing values before rotating a key.

### Option B — Vercel Dashboard

Project → Settings → Environment Variables → "Add". Add each variable for both
**Production** and **Preview**. Slow and error-prone for the initial set; fine
for one-off changes after that.

---

## 4. Pull Vercel env vars back to `.env.local`

When you join the project from a new laptop, or someone rotated a secret in
the dashboard:

```bash
vercel env pull .env.local
```

This overwrites your local file with the values currently set in Vercel for
the linked environment.

---

## 5. Required vars at a glance

The build-time validator lives in `scripts/check-env.mjs`. Summary:

**Required for every build (local and Vercel):**

| Name                              | Format                                                |
| --------------------------------- | ----------------------------------------------------- |
| `RESEND_API_KEY`                  | `re_...` — without it no inquiry ever reaches the team |
| `CONTACT_EMAIL`                   | `name@domain.tld` — inbox for corporate/sponsor inquiries |
| `NEXT_PUBLIC_SITE_URL`            | `https://www.scsecuritysummit.com` (no trailing `/`)  |
| `NEXT_PUBLIC_EVENTBRITE_URL`      | Public event URL; falls back to the value in `lib/content.ts` |

**Recommended additionally on Vercel builds (especially production):**

| Name                       | Why                                                    |
| -------------------------- | ------------------------------------------------------ |
| `UPSTASH_REDIS_REST_URL`   | Distributed rate limiting (fail-closed in production)  |
| `UPSTASH_REDIS_REST_TOKEN` | "                                                      |

**Optional (set if used):**
`EMAIL_FROM`, `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`,
`SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`.

### Transactional email (Resend) — inquiry delivery

Resend is the **only** channel by which a corporate-pass or sponsorship
request reaches the team: there is no database fallback. If the send fails,
the form reports `email_unavailable` and the lead is lost.

To make inquiry emails actually send:

1. **`RESEND_API_KEY`** — set a real key (not the `re_PLACEHOLDER` value)
   in Vercel for **both Production and Preview**.
2. **`EMAIL_FROM`** — must use a domain **verified in Resend** (SPF +
   DKIM). Defaults to `SC Security Summit <hola@scsecuritysummit.com>`.
   An unverified domain causes `failed` events (visible in Sentry/logs);
   the failure is never silently swallowed. See `docs/DNS.md`.
3. **Redeploy after changing env vars** — Vercel only picks up new values
   on the next build/deploy.
4. **Verify delivery:** submit one test corporate-pass form and confirm the
   message in Resend Dashboard → Logs and in `CONTACT_EMAIL`; also check
   Spam/Promotions; and confirm SPF/DKIM/DMARC DNS records.

---

## 6. Pre-deploy checklist

Run before merging to `main` (Vercel auto-deploys `main` to production):

```bash
npm run check-env       # all required vars present locally
npm run typecheck       # TS clean
npm test                # unit tests green
npm run build           # full prod build succeeds locally
```

If `check-env` is red, fix `.env.local` first; then mirror those values onto
the Vercel project via CLI/dashboard before the next deploy.

---

## 7. Strict mode (optional)

If you enable strict validation:

```
✖ [check-env] Build aborted. Fix these env vars:
  ...
```

Recommended workflow:

```bash
# 1. Make sure your local .env.local has the right values.
npm run check-env

# 2. Push them to Vercel via CLI/dashboard.

# 3. Re-trigger the deploy: Vercel Dashboard → Deployments → ⋯ → Redeploy.
#    (Or just push a new commit.)
```

To turn strict mode on in any environment:

```bash
ENFORCE_ENV_VALIDATION=1
```

To temporarily bypass all validation checks:

```bash
SKIP_ENV_VALIDATION=1 npm run build
```

---

## 8. Adding a new env var

1. Add it to `.env.local.example` with a placeholder + comment explaining
   where to source the value.
2. Reference it in code via `process.env.<NAME>`.
3. Add it to `scripts/check-env.mjs` when it should be checked during builds.
4. If sensitive, document in `CLAUDE.md` under "Environment Variables".
5. Update your local `.env.local`, then mirror the value in Vercel via CLI/dashboard.
