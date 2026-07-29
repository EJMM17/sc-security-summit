# Troubleshooting

Symptom → likely cause → fix. Pair with `RUNBOOK.md`. If you've hit something
not listed here, add a row before forgetting how you fixed it.

Scope: the site sells nothing and stores nothing. Ticket problems (orders,
refunds, missing tickets) are Eventbrite's — see `docs/RUNBOOK.md` §3. What can
break here is an inquiry form failing to deliver.

---

## Inquiry forms (corporate pass / sponsorship)

### Legitimate users are blocked by anti-spam controls

**Cause:** The forms intentionally use no external CAPTCHA. Bot/spam protection
is the hidden honeypot field, Upstash rate limiting and Zod server validation.

**Fix:**
1. Check whether the user hit the rate limiter (see the next section).
2. Confirm browser autofill did not populate the hidden `website` honeypot.
3. If both are clean, inspect Sentry for `submitInquiry` errors.

### "Demasiados intentos. Espera 15 minutos."

**Cause:** Upstash sliding window hit (5 req / 15min / IP).

**Fix:** Usually legitimate — wait it out. If a real user is blocked:
1. Get their public IP (they can curl `ifconfig.me`).
2. From Upstash console, run `DEL scss2026:rl:<ip>` to clear their bucket.
3. If this happens often, raise the limit in `lib/rate-limit.ts` — but
   investigate the abuse pattern first.

### Form "succeeds" but nothing arrives in the inbox

**Cause 1 — the honeypot fired.** The action returns a fake success to fool the
bot. If a real human reports this, confirm they don't have an autofill
extension filling `<input name="website">`, then have them retry with it off.

**Cause 2 — the send failed.** The form surfaces `email_unavailable` when Resend
rejects the message; check Resend → Emails and Sentry for the window in
question. There is no database fallback, so a failed send means the lead is
lost — follow up manually if you can identify the sender.

### Submit button stuck on "Enviando..."

**Cause:** The server action failed silently (network, Resend, Sentry).

**Fix:** DevTools → Network → look for the POST to `/?_rsc=...`:
- 5xx → check Sentry for the exception.
- 200 with `{ ok: false, reason: "..." }` → the reason maps to the message the
  form renders; `invalid` means Zod rejected a field.

---

## Email delivery

### The inquiry email doesn't arrive at `CONTACT_EMAIL`

1. **Is the key real?** If `RESEND_API_KEY` is missing or still
   `re_PLACEHOLDER` in this environment, nothing is ever sent. Set a real key
   in Vercel (Production **and** Preview) and **redeploy** — env changes don't
   take effect until the next deploy.
2. **Did Resend accept it?** Resend Dashboard → Emails, filter the last hour.
   A `failed` entry carries the reason (invalid `from`, unverified domain, rate
   limit); a matching warning is in Sentry.
3. **Did it get filtered?** Check Junk / Spam / Promotions on the receiving
   inbox.
4. **Is the sender domain verified?** `EMAIL_FROM` must use a domain with SPF +
   DKIM in Resend. Run `dig TXT scsecuritysummit.com` and confirm `v=spf1 ...`
   and `_dmarc.` records exist (see `docs/DNS.md`).
5. **Is `CONTACT_EMAIL` right?** Confirm it is set on Vercel and points at an
   inbox someone actually monitors.

---

## Health and infrastructure

### `/api/health` is unreachable or non-200

**Cause:** The probe has no external dependency — it answers 200 whenever the
app is serving. A failure means the deployment itself is down.

**Fix:** Check Vercel → Deployments for a failed build or a broken promotion,
and roll back to the last green deployment if needed.

### Build fails locally with `[check-env]` errors

You're missing a required env var. Either:
1. Copy `.env.local.example` to `.env.local` and fill the values, OR
2. `SKIP_ENV_VALIDATION=1 npm run build` to bypass (not recommended for
   prod).

### Build fails with `Type error: Property 'X' does not exist`

A SDK upgrade likely changed an option's name. Re-read the migration
guide for whichever package was bumped. Past offenders: Sentry
(`hideSourceMaps` → `sourcemaps`), Next.js App Router (`useFormState`
→ `useActionState`).

### Middleware response is 502

**Cause:** Edge runtime ran out of memory or hit timeout, often
because Sentry middleware tracing was enabled and the bundle is too
large.

**Fix:** Confirm `SENTRY_DSN` is set if `withSentryConfig` is wrapping
next.config. If you're not running Sentry, unset the DSN — the wrapper
short-circuits and the middleware drops back to its small baseline.

---

## CSP violations in browser console

**Cause:** New external resource (font, analytics, image CDN) added
without updating the CSP allow-list.

**Fix:** Update `middleware.ts` (`script-src`, `style-src`,
`connect-src`, `img-src`, etc). Test the change at
https://csp-evaluator.withgoogle.com to make sure you're not weakening
the policy.

---

## Signals to look for

| Where | Signal | What it means | Action |
| --- | --- | --- | --- |
| Sentry | Unhandled exception captured by `app/error.tsx` | A page or server action threw | Triage the stack trace; usually a missing env var |
| Vercel logs | `{"event":"email_skipped_no_api_key"}` | `RESEND_API_KEY` missing or a placeholder — the inquiry was never sent | Set a real key in Vercel (Prod + Preview) and redeploy |
| Form response | `reason: "email_unavailable"` | Resend rejected the send | Check Resend → Emails for the reason; the lead is lost, follow up manually |
| Form response | `reason: "rate_limited"` | The IP hit the sliding window | Expected under abuse; investigate if a real user reports it |
