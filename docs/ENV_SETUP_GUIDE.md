# Environment Variables Setup Guide

Welcome! This guide walks you through setting up environment variables for the **SC Security Summit** project.

## Quick Start (5 minutes)

### 1️⃣ For Local Development

```bash
# Authenticate with Vercel CLI
vercel login

# Pull all configured environment variables
vercel env pull

# Verify .env.local was created
cat .env.local | head -5

# Start dev server
npm run dev
```

The dev server will now have access to all configured environment variables.

### 2️⃣ For Vercel Deployment

Go to **vercel.com → Your Project → Settings → Environment Variables** and add:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Click "Deploy" and Vercel will inject these variables automatically.

---

## Understanding the System

### Three Layers of Configuration

```
┌─────────────────────────────────────┐
│  env.ts (Validation)                │
│  • Zod schema defines requirements   │
│  • Strict vs. Optional variables     │
│  • Feature flags for gate-keeping    │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  .env / .env.local (Values)         │
│  • Development: .env.local           │
│  • Production: Vercel Dashboard      │
│  • Staging: Vercel Preview env       │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  Application Code                   │
│  • Import from env.ts               │
│  • Check features.* for gate-keeping │
│  • Use requireEnv() for runtime reqs │
└─────────────────────────────────────┘
```

### Key Concepts

- **Strict Variables**: Build fails if missing (e.g., Supabase keys)
- **Optional Variables**: App runs without them; features degrade gracefully
- **Feature Flags**: `features.email`, `features.ratelimit`, etc.
- **Graceful Degradation**: Missing optional features don't crash the app

---

## Setup Steps

### Step 1: Verify Your Supabase Project

✅ Required for all environments

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Settings → API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Secret** → `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Configure in Vercel Dashboard

1. Go to **vercel.com** → Your Project → **Settings**
2. Click **Environment Variables**
3. Add the Supabase keys from Step 1
4. Set scope to **Production** and **Preview**
5. Click "Save"

### Step 3: Pull to Local

```bash
vercel env pull
```

This creates `.env.local` with your configured secrets (your machine only).

### Step 4: Verify Configuration

```bash
# Ensure .env.local exists
ls -la .env.local

# Start dev server
npm run dev
```

If you see no errors, configuration is working! ✅

---

## Optional Features Setup

### 📧 Email (Resend)

Enables sending emails (contact forms, notifications, etc.)

**1. Create Resend account:**
- Go to [resend.com](https://resend.com)
- Create free account (3,000 emails/month)
- Settings → API Keys → Create API Key
- Copy the key

**2. Add to Vercel Dashboard:**
```
RESEND_API_KEY=re_xxx
EMAIL_FROM="SC Security Summit <noreply@your-domain.com>"
CONTACT_EMAIL=ops@your-domain.com
```

**3. Verify domain in Resend:**
- Resend Dashboard → Domains
- Add your domain
- Follow SPF + DKIM setup instructions

### 🔒 Rate Limiting (Upstash Redis)

Prevents abuse by limiting requests per user

**1. Connect to Vercel:**
- Vercel Dashboard → Settings → Integrations
- Search "Upstash"
- Click "Add"
- Authorize and create Redis instance

**2. Auto-populated in Environment Variables:**
```
UPSTASH_REDIS_REST_URL=[auto]
UPSTASH_REDIS_REST_TOKEN=[auto]
```

Rate limiting now works! ✅

### 🤖 CAPTCHA (Cloudflare Turnstile)

Protects forms from bots

**1. Create Turnstile site:**
- Go to [dash.cloudflare.com](https://dash.cloudflare.com)
- Turnstile → Create Site
- Set domain to your site
- Copy Site Key and Secret Key

**2. Add to Vercel Dashboard:**
```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=xxx
TURNSTILE_SECRET_KEY=xxx
```

### 🚨 Error Tracking (Sentry)

Monitors and alerts on production errors

**1. Create Sentry project:**
- Go to [sentry.io](https://sentry.io)
- Create Project → Select "Next.js"
- Copy DSN

**2. Add to Vercel Dashboard:**
```
SENTRY_DSN=https://...@....ingest.sentry.io/...
```

---

## File Structure

```
SC Security Summit/
├── env.ts                           # Validation schema & feature flags
├── lib/
│   └── env-utils.ts                # Helper functions
├── docs/
│   ├── ENV_MANAGEMENT.md           # Complete guide
│   ├── VERCEL_CONFIG_CHECKLIST.md  # Step-by-step setup
│   └── ENV_EXAMPLES.md             # Code examples
├── .env.example                    # Template for repo
├── .env.local.example              # Template for local dev
└── .gitignore                      # Ensures .env.local not committed
```

---

## Daily Workflow

### Morning: Start Dev Server

```bash
# Verify environment variables are loaded
npm run dev

# Should see no errors related to env validation
```

### After Deployment: Check Status

```bash
# View env configuration
curl https://your-app.vercel.app/api/debug/env

# Expected response:
# {
#   "environment": "production",
#   "features": {
#     "email": true,
#     "ratelimit": true,
#     "turnstile": true
#   }
# }
```

### When Adding New Team Member

```bash
# They run this once to sync env vars
vercel env pull

# Start developing
npm run dev
```

---

## Troubleshooting

### ❌ "Invalid environment variables" Error

**Problem**: Build fails with validation error

**Solution**:
```bash
# 1. Check Vercel Dashboard has all required vars
# 2. Update local copy
vercel env pull

# 3. Verify the values
echo $NEXT_PUBLIC_SUPABASE_URL

# 4. Restart dev server
npm run dev
```

### ❌ Build Succeeds but Features Disabled

**Problem**: Console shows `[email] Service not configured`

**Cause**: Email (or other optional feature) variables not configured

**Solution**: Add the feature variables to Vercel Dashboard (see optional features above)

### ❌ ".env.local not found" When Running vercel env pull

**Problem**: CLI authentication failed

**Solution**:
```bash
# Log out and back in
vercel logout
vercel login

# Try again
vercel env pull
```

### ❌ Secrets Exposed in Git

**Problem**: Someone committed `.env.local` to GitHub

**Solution**:
```bash
# Remove from Git history
git rm --cached .env.local
git commit -m "Remove .env.local"

# Ensure .gitignore has it
echo ".env.local" >> .gitignore

# Rotate all secrets immediately!
# See: Rotating Secrets section below
```

---

## Rotating Secrets

Regular rotation strengthens security. Schedule these rotations:

### Monthly: `ADMIN_SESSION_SECRET`

```bash
# 1. Generate new secret
openssl rand -base64 48

# 2. Add to Vercel Dashboard → Production
ADMIN_SESSION_SECRET=<new-value>

# 3. Deploy
vercel deploy --prod

# 4. Monitor for errors (should be none)

# 5. Remove old secret value from documentation
```

### Quarterly: API Keys

- **Resend API Key**: resend.com → API Keys → Rotate
- **Turnstile Secret**: Cloudflare → Regenerate
- **Upstash Token**: Reset in Vercel dashboard

### Yearly: Supabase Keys

Use Supabase's native key rotation (Settings → API → Rotate Keys)

---

## Security Checklist

Before deploying to production:

- [ ] All required variables (Supabase) are configured
- [ ] `ADMIN_SESSION_SECRET` is 32+ characters
- [ ] `.env.local` is in `.gitignore`
- [ ] No `.env.local` files in Git history
- [ ] All **Secret** variables are marked as confidential in Vercel
- [ ] Sentry DSN is configured for error tracking
- [ ] Production and Preview use different API keys (where possible)
- [ ] Admin emails are current and authorized
- [ ] Rate limiting (Redis) is enabled for production
- [ ] CAPTCHA is enabled for production forms

---

## References

| Document | Purpose |
|----------|---------|
| [ENV_MANAGEMENT.md](docs/ENV_MANAGEMENT.md) | Complete environment variables guide |
| [VERCEL_CONFIG_CHECKLIST.md](docs/VERCEL_CONFIG_CHECKLIST.md) | Step-by-step setup instructions |
| [ENV_EXAMPLES.md](docs/ENV_EXAMPLES.md) | Code patterns and usage examples |
| [env.ts](env.ts) | Validation schema (TypeScript) |
| [env-utils.ts](lib/env-utils.ts) | Helper functions |

---

## Getting Help

- **Build Errors**: Check [Troubleshooting](#troubleshooting) section
- **Missing Variables**: Follow [Step 2](#step-2-configure-in-vercel-dashboard)
- **Code Questions**: See [ENV_EXAMPLES.md](docs/ENV_EXAMPLES.md)
- **Team Support**: Reach out to the ops team

---

**Status**: ✅ Production Ready  
**Last Updated**: 2026-04-29  
**Maintained by**: Engineering Team
