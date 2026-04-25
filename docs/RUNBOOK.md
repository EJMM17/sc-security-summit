# SC Security Summit 2026 — Runbook

Operational playbook for the Lanz Logistics ops team. Keep this near the
on-call laptop the week of the event.

---

## 1. Quick reference

| What                | Where                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| Production site     | https://www.scsecuritysummit.com                                      |
| Admin dashboard     | https://www.scsecuritysummit.com/admin                                |
| Folio recovery      | https://www.scsecuritysummit.com/recuperar-folio                      |
| Health probe        | https://www.scsecuritysummit.com/api/health                           |
| Vercel project      | https://vercel.com/<team>/sc-security-summit                          |
| Supabase project    | https://app.supabase.com/project/<ref>                                |
| Resend dashboard    | https://resend.com/emails                                             |
| Sentry project      | https://sentry.io/organizations/<org>/projects/sc-security-summit/    |
| Upstash Redis       | https://console.upstash.com/redis/<id>                                |
| Domain registrar    | (fill in)                                                             |
| Cloudflare account  | (fill in if domain proxied through CF)                                |

Operators with `/admin` access (set in `ADMIN_EMAILS` env var on Vercel):
- (fill in)

---

## 2. Daily monitoring (event week)

Mon → Sun of event week, 09:00 and 17:00 (CDMX):

1. **Sentry** → Issues → filter "Last 24h, level error or fatal".
   - Zero new issues = green.
   - One or more `unexpected_error` from `surface:registro_action` = page on-call.
2. **Vercel** → Deployments. Latest deploy should be green; click into Functions
   → /api/health should be 200. If it returns 503, jump to Troubleshooting.
3. **Supabase** → Database → Reports → "Connection pool" should be < 50%
   utilized. If above, check for runaway queries in the SQL editor with
   `SELECT * FROM pg_stat_activity WHERE state = 'active'`.
4. **Resend** → Emails → status filter. Soft bounces are normal. Hard bounces
   on attendee addresses → mark the registro as needing manual contact.
5. **Upstash** → metrics. If hit ratio drops or eviction count spikes, check
   for an attack via Sentry's `rate_limit_exceeded` audit log entries.

Reach for Slack `#summit-ops` if any of the above flags red.

---

## 3. SOP — "I didn't receive my folio"

When an attendee writes via email or WhatsApp:

1. Direct them to **https://www.scsecuritysummit.com/recuperar-folio** —
   that page reuses the same email template and re-sends the folio
   automatically. 90% of cases stop here.
2. If they still report nothing after 30 minutes, log in to `/admin/registros`
   and search by their email. Three possibilities:
   - **Found, estado_pago = pendiente**: registration is good, payment is
     not. Resend payment link manually (see SOP #4).
   - **Found, estado_pago = pagado**: copy their folio and reply with it.
     Their inbox likely blocked Resend; ask them to check spam or add the
     `noreply@scsecuritysummit.com` sender to their allow-list.
   - **Not found**: the registration didn't persist. Walk them through
     re-registering from scratch.
3. If you reply with a folio manually, log it in `#summit-ops` with the
   folio number so we can audit later.

---

## 4. SOP — Payment reconciliation (manual SPEI / transfers)

Conekta integration is deferred to a later release. Until then, all payments
arrive as SPEI bank transfers to the Lanz Logistics account or as cash on
event day. Daily during the registration window:

1. Pull the bank statement (PDF or CSV) for the last 24h.
2. Open `/admin/registros?estado=pendiente`.
3. For each transfer:
   1. Match the depositor name and amount to one of the pending registros.
      Tier prices: Estudiante $1,200 · General $5,800 · VIP $7,200 (MXN).
   2. If the amounts don't match a single tier, contact the registrant
      before marking anything paid.
   3. Click the green check icon to mark the row paid. The action records
      the operator's email and the timestamp in `pagado_por` / `pagado_en`.
4. If a registrant disputes the charge or asks for a refund:
   - Refund policy: **100%** before Jul 26, 2026 · **50%** before Aug 25 ·
     **0%** after. The cutoffs are mirrored in `/terminos-y-condiciones`.
   - To refund: initiate a SPEI return from the bank, then mark the registro
     `cancelado` from `/admin/registros` with a note (free-text field).

CSV export: hit "Export CSV" on the dashboard at the end of each day. Save
to a shared drive — this is your reconciliation paper trail.

---

## 5. Day of the event — check-in

QR codes go out the week of the event in a separate email batch (TODO: write
the QR mailing once Conekta lands; for now print a CSV alphabetized by
apellido as the fallback list).

- Doors open 08:00. Front desk needs the printed list + 2 staff with phones
  for QR scanning.
- Each scan should call `/admin/registros/<folio>/checkin` (TODO route).
  Until that ships, mark attendance manually on the printed list.
- If the system is down on event day:
  - Switch to printed list immediately.
  - Send an SMS blast (template in shared drive) telling registrants to
    bring photo ID + folio screenshot.

**Contingency plan if DB is unreachable on event day:**
1. Fall back to the offline CSV exported on the night before.
2. Capture walk-ins on a Google Form (link in shared drive).
3. Reconcile post-event by importing the form into Supabase via SQL.

---

## 6. Post-event

| Day  | Task                                                                                       |
| ---- | ------------------------------------------------------------------------------------------ |
| +1   | Send post-event survey (separate Resend batch). Snapshot all `registros` to backup S3.     |
| +7   | Final CSV reconciliation. Issue all CFDIs through Facturapi (or manually until integrated). |
| +30  | Disable Vercel Cron / scheduled jobs for the event domain.                                  |
| +180 | **LFPDPPP retention deadline.** Run the deletion script (TODO: write `scripts/purge-pii.mjs`) which scrubs `email`, `telefono`, `rfc`, `razon_social`, `codigo_postal_fiscal`, `ip_registro`, `user_agent` from every `registros` row, leaving only the aggregate analytics fields. Document the run in `docs/PII_DELETION_LOG.md`. |

---

## 7. Disaster recovery

- **DB corruption / accidental DELETE**: Supabase Pro has Point-In-Time
  Recovery for 7 days. From the dashboard: Database → Backups → Restore →
  pick a moment before the bad write. Coordinate with Supabase support if
  you need to roll back individual rows; PITR is per-database and creates
  a new project.
- **Domain outage**: If `scsecuritysummit.com` is unreachable, the Vercel
  preview URL `sc-security-summit.vercel.app` is the fallback. Update the
  `NEXT_PUBLIC_SITE_URL` env var temporarily and redeploy to make the
  emails point there.
- **Resend down**: confirm at https://status.resend.com. If down >30 min,
  pause the registration form (Vercel → flag `MAINTENANCE_MODE=1`) and
  post a banner via the existing maintenance toggle (TODO: add the
  toggle).
- **Supabase down**: similarly — confirm at https://status.supabase.com. The
  health endpoint will already return 503 and any uptime monitor wired to
  it will alert.

Escalation chain (in order):
1. On-call developer (rotation TBD).
2. Lanz Logistics ops lead.
3. Vercel support: https://vercel.com/help.
4. Supabase support: support@supabase.com (Pro plan, 24h SLA).

---

## 8. Pre-launch checklist (T-7 days)

Mirrors the original task brief — re-run on Sept 17, 2026.

- [ ] All env vars present in Vercel Production. Confirm with
      `npm run check-env` from a fresh checkout pointing at the prod env.
- [ ] **Supabase upgraded to Pro plan** (PITR + daily backups, no
      pause-on-inactivity). This is a hard blocker.
- [ ] Upstash Redis provisioned and reachable from Vercel.
- [ ] Resend domain verified (SPF + DKIM + DMARC). Send a test
      registration to a Gmail and an Outlook account; check both inbox
      placement.
- [ ] Sentry DSN active. Trigger a `Sentry.captureMessage("smoke")` from
      `/api/health` and confirm it appears within 60s.
- [ ] Vercel Speed Insights / Analytics enabled.
- [ ] Lighthouse mobile run on `/`: Performance ≥ 90, A11y ≥ 95,
      Best Practices ≥ 95, SEO ≥ 95.
- [ ] axe-core: 0 critical violations on `/`, `/recuperar-folio`,
      `/admin/login`.
- [ ] Mozilla Observatory: A or A+ on the apex domain.
- [ ] Smoke test: register one real attendee with a test card, mark them
      paid from `/admin`, confirm the email lands in their inbox.
- [ ] DNS pointing at Vercel, SSL valid (cert expiry > Sept 30, 2026).
- [ ] Code freeze 72h before the event (Sept 21, 18:00).
