# Troubleshooting

Symptom → likely cause → fix. Pair with `RUNBOOK.md`. If you've hit something
not listed here, add a row before forgetting how you fixed it.

---

## Registration form

### "We couldn't verify you're not a bot" on every submit

**Cause:** Cloudflare Turnstile widget didn't load, or the keys are wrong.

**Fix:**
1. Browser DevTools → Network → filter `challenges.cloudflare.com`. If the
   request is blocked, the page CSP is missing `https://challenges.cloudflare.com`.
   Check `middleware.ts` `script-src` and `frame-src` directives.
2. If the widget loads but verification fails, the secret is wrong: confirm
   `TURNSTILE_SECRET_KEY` matches the site key in Cloudflare's dashboard.
3. The site key (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`) and secret must come
   from the same Turnstile widget.

### "Demasiados intentos. Espera 15 minutos."

**Cause:** Upstash sliding window hit (5 req / 15min / IP).

**Fix:** Usually legitimate — wait it out. If a real user is blocked:
1. Get their public IP (they can curl `ifconfig.me`).
2. From Upstash console, run `DEL scss2026:rl:<ip>` to clear their bucket.
3. If this happens often, raise the limit in `lib/rate-limit.ts` — but
   investigate the abuse pattern first.

### "Este correo ya está registrado para el evento"

**Cause:** Postgres UNIQUE constraint on `registros.email` (intentional —
prevents duplicate paid registrations).

**Fix:**
1. Look up the existing registro from `/admin/registros?q=<email>`.
2. If it's an honest mistake (user forgot they registered), point them to
   `/recuperar-folio`.
3. If they need a different ticket type, mark the old one `cancelado` from
   the dashboard before they re-register.

### Form "succeeds" but no row in DB and no email

**Cause:** The honeypot fired. The action returns a fake success to fool the
bot. If a real human reports this:
1. Confirm they didn't have a browser autofill extension that filled the
   `website` field. Inspect element on `<input name="website">` and check
   if it has a value.
2. Have them disable suspicious autofill / password manager extensions
   and try again.

### Submit button stuck on "Procesando..."

**Cause:** Server action failed silently (network, Supabase, Sentry).

**Fix:**
1. DevTools → Network → look for the POST to `/?_rsc=...`. Status code:
   - 5xx → check Sentry for the exception.
   - 200 with `{ success: false, message: "..." }` → the message should
     also have rendered as a toast; check the Toaster wasn't blocked.
2. If Sentry shows `db_error` with code `PGRST301`, RLS is blocking the
   insert. Confirm migrations 002–003 are applied in production.

---

## Email delivery

### Confirmation email doesn't arrive

Every confirmation attempt is audited in the `email_events` table. Start
there — it tells you whether we even tried to send.

```sql
select status, provider_message_id, error, created_at
from public.email_events
where folio = 'SCSS2026-XXXXX-XXXX'
order by created_at desc;
```

**Read the `status`:**
- `sent` → we handed it to Resend. The problem is downstream (spam,
  bounce, recipient server). Check Resend Dashboard → Logs using
  `provider_message_id`, then Spam/Promotions in the inbox.
- `skipped_no_api_key` → **`RESEND_API_KEY` is missing or still the
  `re_PLACEHOLDER` value in this environment.** Set a real key in Vercel
  (Production **and** Preview) and **redeploy** — env changes don't take
  effect until the next deploy. Registration still succeeded; the folio
  is shown on screen and stored in `registros`.
- `failed` → Resend rejected the send. The `error` column has the reason
  (invalid `from`, unverified domain, rate limit). A matching warning is
  in Sentry (`registration_confirmation_email_failed`).
- _no row at all_ → the send code never ran (older registration before
  this feature, or an exception before the email step — check Sentry).

**Other causes (when status is `sent`):**
1. Spam filter — check Junk / Spam / Promotions.
2. `EMAIL_FROM` domain not verified in Resend (SPF/DKIM). Run
   `dig TXT scsecuritysummit.com` and confirm `v=spf1 ...` and
   `_dmarc.` records exist (see `docs/DNS.md`).
3. Recipient mail server bouncing — Resend Dashboard → Bounces.

**Fix:** Direct the user to `/recuperar-folio` to re-send, or use the
"Reenviar correo" button in `/admin/registros` (logged in `email_events`
as `registration_confirmation_resend`). If a corporate inbox keeps
rejecting, ask for a personal backup address.

### Organizer notification not received

Similar to above. Confirm `CONTACT_EMAIL` is set on Vercel and matches
an inbox someone monitors. If `Sentry → email_organizer_failed` shows
"CONTACT_EMAIL not configured", the env var is missing or empty.

---

## Admin dashboard

### "Ingresa el correo del operador" — link never arrives

1. Confirm the operator's email is in `ADMIN_EMAILS` (csv) on Vercel.
   The login form returns the same neutral message whether the email is
   allowed or not, by design.
2. Check Resend dashboard for a `tag = admin_login` entry in the last
   15 minutes. If absent, the action failed before sending — check
   Sentry.
3. The token TTL is 15 minutes; if too much time passed, request a new
   one.

### "Invalid token" loop after clicking the magic link

**Cause:** Either the token expired (>15 min from request) or
`ADMIN_SESSION_SECRET` rotated between mint and verify (e.g., re-deploy
with a new secret).

**Fix:** Request a new link. If the issue persists, confirm the secret
hasn't changed in Vercel.

### Admin marks paid but UI still says pending

**Cause:** Page is server-rendered without revalidation; the click
re-renders but Next caches.

**Fix:** Add `revalidatePath("/admin/registros")` after the update in
`app/actions/admin.ts`. (TODO — file an issue if this surfaces.)

---

## Health and infrastructure

### `/api/health` returns 503

**Cause:** Supabase isn't responding to a count query within 3 seconds.

**Fix:**
1. Check https://status.supabase.com.
2. If healthy upstream, your project may be paused (Free tier auto-pauses
   after 7 days inactivity). Open the Supabase dashboard and unpause.
3. If it's a connection-pool exhaustion, scale the pool from the
   Supabase project settings, or kill long-running queries via
   `pg_stat_activity`.

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

## Common Sentry events

| Sentry event                     | What it means                                                          | Action                                                    |
| -------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| `unexpected_error`               | Server action threw an unhandled exception                             | Triage the stack trace; usually a missing env var or DB schema mismatch |
| `db_error`                       | Supabase returned an error from the insert                             | Check `code` extra; `23505` = duplicate (expected), other = real bug    |
| `email_confirmation_failed`      | Resend send failed for the attendee                                    | Manual follow-up via `/admin/registros` lookup            |
| `registration_confirmation_email_failed` | Confirmation email send failed (registration NOT affected)    | Inspect `email_events.error`; resend from `/admin/registros` |
| `registration_confirmation_email_skipped_no_api_key` | `RESEND_API_KEY` missing/placeholder              | Set the key in Vercel (Prod + Preview) and redeploy       |
| `create_lead.confirmation_email_not_delivered` | Email failed/skipped right after a successful insert      | Same as the two above — registration itself is fine       |
| `email_organizer_failed`         | Resend send failed for the organizer                                   | Confirm CONTACT_EMAIL is correct                          |
| `admin_login_email_failed`       | Magic-link email send failed                                           | Check Resend; user can retry                              |
| `recuperar_folio_email_failed`   | Folio reissue email send failed                                        | Same as above                                             |
