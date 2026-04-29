# Vercel Environment Configuration Checklist

Use this checklist to systematically configure all environment variables in the Vercel Dashboard.

## Pre-Configuration Steps

- [ ] Gather all credentials from service providers (listed below)
- [ ] Generate `ADMIN_SESSION_SECRET`: `openssl rand -base64 48`
- [ ] Verify you have access to all service dashboards
- [ ] Create a secure note documenting where each secret was generated

## Service Credentials Checklist

### Supabase (✅ Required)
**Location**: https://app.supabase.com → Settings → API

- [ ] `NEXT_PUBLIC_SUPABASE_URL` (Project URL)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Anon Public Key)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (Service Role Secret)

### Resend (Email, Optional)
**Location**: https://resend.com → API Keys

- [ ] Create/copy API key
- [ ] Store as `RESEND_API_KEY`
- [ ] Verify sender domain in Resend (required for SPF/DKIM)
- [ ] Set `EMAIL_FROM` = "SC Security Summit <noreply@your-domain.com>"

### Cloudflare Turnstile (CAPTCHA, Optional)
**Location**: https://dash.cloudflare.com → Turnstile → Create Site

- [ ] Create new site
- [ ] Copy `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (public)
- [ ] Copy `TURNSTILE_SECRET_KEY` (server-only)

### Upstash Redis (Rate Limiting, Optional)
**Location**: Vercel Dashboard → Integrations → Upstash Redis

- [ ] Connect/create Redis instance
- [ ] Vercel auto-populates `UPSTASH_REDIS_REST_URL`
- [ ] Vercel auto-populates `UPSTASH_REDIS_REST_TOKEN`

### Sentry (Error Tracking, Optional)
**Location**: https://sentry.io → Project → Settings

- [ ] Create project (if not exists)
- [ ] Copy DSN to `SENTRY_DSN`
- [ ] Generate Auth Token for source maps (optional)

### Admin Configuration (Optional)
- [ ] Set `ADMIN_EMAILS` (CSV of authorized admins)
- [ ] Generate and set `ADMIN_SESSION_SECRET`

---

## Vercel Dashboard Configuration

### Step 1: Navigate to Environment Variables

```
vercel.com → Project → Settings → Environment Variables
```

### Step 2: Add Variables by Environment

Create separate variable sets for **Production**, **Preview**, and **Development** scopes.

#### 🔴 Production Environment

| Variable | Value | Secret? | Source |
|----------|-------|---------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | | ☐ | Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | | ☐ | Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | | ☑ | Supabase |
| `RESEND_API_KEY` | | ☑ | Resend |
| `EMAIL_FROM` | SC Security Summit <noreply@...> | ☐ | Config |
| `CONTACT_EMAIL` | | ☐ | Config |
| `UPSTASH_REDIS_REST_URL` | | ☐ | Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | | ☑ | Upstash |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | | ☐ | Turnstile |
| `TURNSTILE_SECRET_KEY` | | ☑ | Turnstile |
| `SENTRY_DSN` | | ☐ | Sentry |
| `ADMIN_EMAILS` | ops@..., admin@... | ☐ | Config |
| `ADMIN_SESSION_SECRET` | | ☑ | Generated |

#### 🟡 Preview Environment

```
NEXT_PUBLIC_SUPABASE_URL = [same as Production]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [same as Production]
SUPABASE_SERVICE_ROLE_KEY = [same as Production]
NEXT_PUBLIC_APP_URL = https://[branch].vercel.app
```

Other variables are optional and will degrade gracefully if missing.

#### 🟢 Development Environment

Leave mostly empty for local development. Team members use `vercel env pull` to sync.

### Step 3: Import from Integrations

If you have Upstash or other integrations connected:

1. Click "Connect" next to the integration
2. Vercel auto-populates the required variables
3. Verify values are correct
4. Deploy to test

### Step 4: Verify Configuration

After adding all variables:

1. Deploy a test build: `vercel deploy`
2. Check build logs for validation errors
3. If build passes, variables are correctly configured

---

## Local Development Setup

### First Time Setup

```bash
# 1. Clone repository
git clone https://github.com/EJMM17/sc-security-summit.git
cd sc-security-summit

# 2. Pull environment variables from Vercel
vercel env pull

# 3. This creates .env.local with all configured secrets
# (only authorized team members can run this command)

# 4. Start dev server
npm run dev
```

### Updates Environment Variables

After team adds new variables to Vercel:

```bash
# Pull latest environment variables
vercel env pull

# Restart dev server (Ctrl+C, then npm run dev)
```

### Debugging Locally

```bash
# Check which variables are loaded
cat .env.local | head -20

# View env validation schema (in TypeScript)
cat env.ts

# Check if env.ts throws errors
npm run build
```

---

## Troubleshooting

### "Invalid environment variables" Error

```
Error: Invalid environment variables: SUPABASE_SERVICE_ROLE_KEY: String must contain at least 1 character; ...
```

**Solution**:
1. Run `vercel env pull` to update `.env.local`
2. Verify Vercel Dashboard has all required variables
3. Check variable values don't have extra spaces: `echo $SUPABASE_SERVICE_ROLE_KEY`
4. Restart dev server: `npm run dev`

### Variables Not Updating Locally

```bash
# Force refresh
rm .env.local
vercel env pull

# Verify new values
cat .env.local
```

### Build Succeeds but Feature Disabled

This is **expected behavior** for optional features. Check logs:

```
[email] Service not configured. Email skipped.
[ratelimit] Redis not configured. Skipping rate limit.
```

To enable these features, add the required variables to Vercel Dashboard.

### "ADMIN_SESSION_SECRET is required at runtime"

Occurs when accessing `/admin` without configuring the secret:

1. Generate new secret: `openssl rand -base64 48`
2. Add to Vercel Dashboard → Production → `ADMIN_SESSION_SECRET`
3. Deploy or run `vercel env pull` + restart dev server
4. Access `/admin` again

---

## Security Checklist

- [ ] All **Secret** variables are marked as confidential in Vercel
- [ ] Production and Preview environments use different API keys where possible
- [ ] `ADMIN_SESSION_SECRET` is 32+ characters
- [ ] `.env.local` is in `.gitignore` (verify with `git status`)
- [ ] No team members have committed `.env.local` to Git
- [ ] Sentry DSN is configured for error tracking
- [ ] Rate limiting is enabled (Upstash Redis) in production
- [ ] CAPTCHA is enabled (Turnstile) in production
- [ ] Admin emails are current and authorized

---

## Regular Maintenance

### Weekly
- Monitor Sentry for environment-related errors
- Check Vercel build logs for failed deployments

### Monthly
- Rotate `ADMIN_SESSION_SECRET`
- Review and update `ADMIN_EMAILS` if team changes

### Quarterly
- Rotate API keys (Resend, Upstash, Turnstile)
- Audit which team members have access to secrets
- Review Vercel audit logs

### Annually
- Full security audit of environment variables
- Document new or deprecated variables
- Update this checklist if needed

---

## References

- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [View Vercel Logs](https://vercel.com/docs/deployments/logs)
- [Manage Team Access](https://vercel.com/docs/teams/managing-team-members)

---

**Last Updated**: 2026-04-29  
**Created by**: v0  
**Status**: Ready for Use ✅
