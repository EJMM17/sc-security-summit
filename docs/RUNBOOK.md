# SC Security Summit 2026 — Runbook

Operational playbook for the Lanz Logistics ops team. Keep this near the
on-call laptop the week of the event.

Scope note: individual ticket sales live in **Eventbrite**. This site sells nothing and
stores nothing — it markets the event and emails two kinds of inquiry (corporate pass and
sponsorship) to `CONTACT_EMAIL`. Attendee lists, refunds, check-in and payment disputes are
handled in the Eventbrite dashboard, not here.

---

## 1. Quick reference

| What                | Where                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| Production site     | https://www.scsecuritysummit.com                                      |
| Ticketing           | Eventbrite event dashboard (link in `NEXT_PUBLIC_EVENTBRITE_URL`)     |
| Health probe        | https://www.scsecuritysummit.com/api/health                           |
| Vercel project      | https://vercel.com/<team>/sc-security-summit                          |
| Resend dashboard    | https://resend.com/emails                                             |
| Sentry project      | https://sentry.io/organizations/<org>/projects/sc-security-summit/    |
| Upstash Redis       | https://console.upstash.com/redis/<id>                                |
| Domain registrar    | (fill in)                                                             |
| Cloudflare account  | (fill in if domain proxied through CF)                                |

Inbox that receives inquiries (`CONTACT_EMAIL` on Vercel): (fill in)
Operators with Eventbrite dashboard access: (fill in)

---

## 2. Daily monitoring (event week)

Mon → Sun of event week, 09:00 and 17:00 (CDMX):

1. **Sentry** → Issues → filter "Last 24h, level error or fatal".
   - Zero new issues = green.
   - Errors from the `submitInquiry` server action = page on-call: leads may be lost.
2. **Vercel** → Deployments. Latest deploy should be green; click into Functions
   → /api/health should be 200.
3. **Resend** → Emails → status filter. Every corporate-pass and sponsorship submission
   should appear as a delivered message to `CONTACT_EMAIL`. A gap here means leads are
   being silently dropped — treat as SEV-2.
4. **Eventbrite** → check the event is published, the four tiers (VIP, Plus, General,
   Estudiante) are on sale, and the prices match `lib/content.ts`.
5. **Upstash** → metrics. If eviction count spikes, check for an attack via Sentry's
   `rate_limit_exceeded` entries.

Reach for Slack `#summit-ops` if any of the above flags red.

---

## 3. SOP — "I paid but got no ticket"

Ticketing is Eventbrite's, so the site has nothing to look up.

1. Ask for the email used at checkout and the Eventbrite order number if they have it.
2. In the Eventbrite dashboard → Orders, search by email. Resend the confirmation from
   there ("Resend confirmation email").
3. If no order exists, the payment did not complete — ask them to retry from the site's
   access CTA and confirm the charge with their bank.
4. Log anything you resolve manually in `#summit-ops`.

---

## 4. SOP — "I sent the corporate-pass / sponsorship form and nobody replied"

1. Search `CONTACT_EMAIL` for the sender's company name. Subject lines are
   `Solicitud de pase corporativo · <empresa>` and `Solicitud de patrocinio · <empresa>`.
2. If nothing arrived, check Resend → Emails for a failed send in that window, and Sentry
   for `submitInquiry` errors.
3. If Resend shows nothing at all, the submission never reached the server (rate limit or
   validation). Ask the person to retry, and take their details by email in the meantime.

---

## 5. Event day

- Attendee check-in runs on **Eventbrite's organizer app** (QR scan). Export a printed
  attendee list from Eventbrite as the offline backup.
- Walk-ins: sell through Eventbrite on a tablet, or capture name/email/company on paper
  and reconcile afterwards.
- The website's only event-day job is being reachable — keep the health probe monitor on.

---

## 6. Post-event

| Day  | Task                                                                                       |
| ---- | ------------------------------------------------------------------------------------------ |
| +1   | Send post-event survey (separate Resend batch). Export the final attendee list from Eventbrite and store it with the ops archive. |
| +7   | Reconcile Eventbrite payouts. Issue any CFDIs requested by attendees.                        |
| +30  | Disable Vercel Cron / scheduled jobs for the event domain.                                   |
| +180 | **LFPDPPP retention deadline.** Purge the inquiry emails and any exported attendee lists holding personal data from shared drives and inboxes, and document the run in `docs/PII_DELETION_LOG.md`. The app itself stores no personal data. |

---

## 7. Disaster recovery

- **Domain outage**: If `scsecuritysummit.com` is unreachable, the Vercel
  preview URL `sc-security-summit.vercel.app` is the fallback. Update the
  `NEXT_PUBLIC_SITE_URL` env var temporarily and redeploy.
- **Resend down**: confirm at https://status.resend.com. While it is down, inquiry emails
  do not arrive — publish the contact address next to the form so leads have another path.
- **Eventbrite down**: confirm at https://www.eventbritestatus.com. Sales stop entirely;
  swap the access CTA copy in `lib/content.ts` to point at the contact email until it returns.
- **Bad deploy**: Vercel → Deployments → previous green deployment → "Promote to Production".
  The site is stateless, so a rollback is always safe.

Escalation chain (in order):
1. On-call developer (rotation TBD).
2. Lanz Logistics ops lead.
3. Vercel support: https://vercel.com/help.
4. Resend support: https://resend.com/help.

---

## 8. Pre-launch checklist (T-7 days)

Re-run on Sept 17, 2026.

- [ ] All env vars present in Vercel Production. Confirm with
      `npm run check-env` from a fresh checkout pointing at the prod env.
- [ ] Eventbrite event published, four tiers on sale, prices matching the site.
- [ ] Upstash Redis provisioned and reachable from Vercel.
- [ ] Resend domain verified (SPF + DKIM + DMARC). Submit one test corporate-pass and one
      test sponsorship form; confirm both land in `CONTACT_EMAIL` (Gmail and Outlook).
- [ ] Sentry DSN active. Trigger a `Sentry.captureMessage("smoke")` and confirm it appears
      within 60s.
- [ ] Vercel Speed Insights / Analytics enabled.
- [ ] Lighthouse mobile run on `/`: Performance ≥ 90, A11y ≥ 95,
      Best Practices ≥ 95, SEO ≥ 95.
- [ ] axe-core: 0 critical violations on `/` and `/sponsors`.
- [ ] Mozilla Observatory: A or A+ on the apex domain.
- [ ] DNS pointing at Vercel, SSL valid (cert expiry > Sept 30, 2026).
- [ ] Code freeze 72h before the event (Sept 21, 18:00).
