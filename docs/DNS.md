# DNS configuration — `scsecuritysummit.com`

This is configuration, not code. Apply these records in the domain
registrar (or in Cloudflare if the apex is proxied) **before** opening
registration to the public. Changes can take 24–48h to propagate
globally; verify with `dig +short TXT scsecuritysummit.com`.

---

## 1. Resend (transactional email)

The sender domain in `EMAIL_FROM` must be verified in Resend. Steps:

1. Resend Dashboard → Domains → Add domain → `scsecuritysummit.com`
2. Resend will issue 3 CNAME records and 1 TXT (DKIM + SPF). Copy them
   verbatim into DNS.
3. Wait for "Verified" — usually <30 min on most registrars.

> If `EMAIL_FROM` uses an **unverified** domain, the registration
> confirmation email send returns an error that is logged as a `failed`
> event in `email_events` and surfaced in Sentry — it is never silently
> dropped. The registration itself still succeeds.

### SPF (sender policy framework)

| Type | Name | Value                          | TTL   |
| ---- | ---- | ------------------------------ | ----- |
| TXT  | @    | `v=spf1 include:resend.com ~all` | 3600 |

If you also send from another provider (e.g. Google Workspace), merge:
`v=spf1 include:_spf.google.com include:resend.com ~all`.

### DKIM

Resend auto-generates the selector. Add the 3 CNAME records exactly as
shown in the dashboard. Names look like `resend._domainkey.scsecuritysummit.com`.

### DMARC

Start in `quarantine` to inspect deliverability before going to `reject`.

| Type | Name    | Value                                                                                       | TTL   |
| ---- | ------- | ------------------------------------------------------------------------------------------- | ----- |
| TXT  | _dmarc  | `v=DMARC1; p=quarantine; rua=mailto:dmarc@scsecuritysummit.com; ruf=mailto:dmarc@scsecuritysummit.com; fo=1` | 3600 |

After 2 weeks of reports with no spoofing flagged, tighten to
`p=reject`.

---

## 2. Apex + www (Vercel)

| Type  | Name | Value              | Notes                            |
| ----- | ---- | ------------------ | -------------------------------- |
| A     | @    | 76.76.21.21        | Vercel anycast                   |
| CNAME | www  | cname.vercel-dns.com | Use ALIAS/ANAME if registrar supports it |

If using Cloudflare orange-cloud, set both records to "Proxied" and
toggle SSL/TLS to **Full (Strict)**. Disable Brotli pre-compression on
WebP responses to avoid double-compressing the hero asset.

---

## 3. Health monitoring

Add an external uptime check (UptimeRobot / Better Stack) on
`https://www.scsecuritysummit.com/api/health`. Expect:

- 200 with body `{"ok":true}` when Supabase is reachable
- 503 within 3s when Supabase is degraded

Alert threshold: 2 consecutive failures = page on-call.

---

## 4. Verification

```bash
# SPF
dig +short TXT scsecuritysummit.com | grep spf
# DMARC
dig +short TXT _dmarc.scsecuritysummit.com
# DKIM (replace selector with the one Resend gave you)
dig +short CNAME resend._domainkey.scsecuritysummit.com
```

External tools:

- <https://mxtoolbox.com/SuperTool.aspx>
- <https://dmarcian.com/dmarc-inspector/>
- <https://www.mail-tester.com> (send a test from production)
