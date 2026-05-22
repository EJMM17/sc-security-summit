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
#   - Supabase Dashboard → Settings → API
#   - Cloudflare Dashboard → Turnstile
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

Two options; **prefer the CLI helper** so a typo in the dashboard can't bite us.

### Option A — `npm run vercel:env:push` (recommended)

```bash
npm run vercel:env:push
```

What it does:

- Reads `.env.local`, skips placeholders and unset values.
- For each known var, calls `vercel env rm` then `vercel env add` for both
  `production` and `preview` targets.
- Prints what was pushed and what was skipped.

Flags:

```bash
npm run vercel:env:push -- --dry-run                 # see what would happen
npm run vercel:env:push -- --target=production       # only one target
npm run vercel:env:push -- --only=RESEND_API_KEY     # rotate a single key
```

### Option B — Vercel Dashboard

Project → Settings → Environment Variables → "Add". Add each variable for both
**Production** and **Preview**. Slow and error-prone for the initial set; fine
for one-off changes after that.

---

## 4. Pull Vercel env vars back to `.env.local`

When you join the project from a new laptop, or someone rotated a secret in
the dashboard:

```bash
npm run vercel:env:pull
```

This wraps `vercel env pull .env.local` and overwrites your local file with
the values currently set in Vercel for the linked environment.

---

## 5. Required vars at a glance

The full list and validation rules live in `scripts/env-spec.mjs` — that's the
canonical source. Summary:

**Required for every build (local and Vercel):**

| Name                              | Format                                                |
| --------------------------------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | `https://<ref>.supabase.co`                           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | JWT, ≥40 chars                                        |
| `SUPABASE_SERVICE_ROLE_KEY`       | JWT, ≥40 chars (server-only)                          |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`  | Cloudflare Turnstile site key                         |
| `TURNSTILE_SECRET_KEY`            | Cloudflare Turnstile secret                           |
| `CONTACT_EMAIL`                   | `name@domain.tld`                                     |
| `NEXT_PUBLIC_SITE_URL`            | `https://www.scsecuritysummit.com` (no trailing `/`)  |

**Recommended additionally on Vercel builds (especially production):**

| Name                       | Why                                                    |
| -------------------------- | ------------------------------------------------------ |
| `UPSTASH_REDIS_REST_URL`   | Distributed rate limiting (fail-closed in production)  |
| `UPSTASH_REDIS_REST_TOKEN` | "                                                      |
| `RESEND_API_KEY`           | Transactional email — **required to send the registration confirmation email** |

**Optional (set if used):**
`EMAIL_FROM`, `ADMIN_EMAILS`, `ADMIN_SESSION_SECRET`, `SENTRY_DSN`,
`NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`.

### Transactional email (Resend) — confirmation on registration

The registration flow sends a bilingual confirmation email after every
successful registration. It is resilient: **if email fails, the
registration still succeeds** (the folio is shown on screen and stored).
Every attempt is audited in the `email_events` Supabase table.

To make confirmation emails actually send:

1. **`RESEND_API_KEY`** — set a real key (not the `re_PLACEHOLDER` value)
   in Vercel for **both Production and Preview**. If it's missing or a
   placeholder, registrations succeed but emails are skipped and logged
   as `skipped_no_api_key`.
2. **`EMAIL_FROM`** — must use a domain **verified in Resend** (SPF +
   DKIM). Defaults to `SC Security Summit <hola@scsecuritysummit.com>`.
   An unverified domain causes `failed` events (visible in Sentry/logs);
   the failure is never silently swallowed. See `docs/DNS.md`.
3. **Redeploy after changing env vars** — Vercel only picks up new values
   on the next build/deploy.
4. **Verify delivery:** Resend Dashboard → Logs (match on
   `provider_message_id` from `email_events`); also check
   Spam/Promotions; and confirm SPF/DKIM/DMARC DNS records.

The `email_events` table is created by migration
`supabase/migrations/009_email_events.sql` (RLS-locked to `service_role`).
Apply pending migrations to the Supabase project before/with the deploy.

---

## 6. Pre-deploy checklist

Run before merging to `main` (Vercel auto-deploys `main` to production):

```bash
npm run check-env       # all required vars present locally
npm run typecheck       # TS clean
npm test                # unit tests green
npm run build           # full prod build succeeds locally
```

If `check-env` is red, fix `.env.local` first; then `npm run vercel:env:push`
to mirror those values onto the project before the next Vercel deploy.

---

## 7. Strict mode (optional)

If you enable strict validation:

```
✖ [check-env] Build aborted. Fix these env vars:
  • TURNSTILE_SECRET_KEY: missing
  ...
```

Recommended workflow:

```bash
# 1. Make sure your local .env.local has the right values.
npm run check-env

# 2. Push them to Vercel.
npm run vercel:env:push

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

1. Add it to `scripts/env-spec.mjs` (`ALWAYS_REQUIRED`, `PROD_REQUIRED`, or
   `OPTIONAL`).
2. Add it to `.env.local.example` with a placeholder + comment explaining
   where to source the value.
3. Reference it in code via `process.env.<NAME>`.
4. If sensitive, document in `CLAUDE.md` under "Environment Variables".
5. Update your local `.env.local`, then `npm run vercel:env:push`.
