# Environment Variables Management Guide

## Overview

This document provides a comprehensive guide to managing environment variables in the SC Security Summit project. The architecture prioritizes **security**, **scalability**, and **graceful degradation**.

### Key Principles

1. **Strict vs. Optional**: Critical variables (Supabase) fail at build time; feature-specific variables degrade gracefully
2. **Server-Only Enforcement**: Sensitive keys are protected via `server-only` module
3. **Multi-Environment Support**: Development, Staging, and Production have separate configurations
4. **Feature Flags**: Availability checks prevent runtime errors for optional features
5. **Runtime Validation**: Zod schema ensures type safety and provides clear error messages

---

## Environment Variable Categories

### Strict Variables (Build-Time Failure)
These variables are **required** and will cause the build to fail if missing:

| Variable | Type | Purpose | Source |
|----------|------|---------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project endpoint | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Client-side Supabase auth key | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Server-side admin access | Supabase → Settings → API |

### Optional Variables (Graceful Degradation)
These variables enhance functionality but don't break the app if missing:

| Variable | Type | Purpose | Feature | Source |
|----------|------|---------|---------|--------|
| `RESEND_API_KEY` | Secret | Email sending service | Email | resend.com → API Keys |
| `EMAIL_FROM` | Config | Email sender identity | Email | Your verified domain in Resend |
| `CONTACT_EMAIL` | Config | Support contact | General | Your ops email |
| `UPSTASH_REDIS_REST_URL` | Secret | Redis distributed cache | Rate Limiting | Vercel Dashboard → Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Secret | Redis authentication | Rate Limiting | Vercel Dashboard → Upstash |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public | CAPTCHA public key | CAPTCHA | Cloudflare → Turnstile |
| `TURNSTILE_SECRET_KEY` | Secret | CAPTCHA server key | CAPTCHA | Cloudflare → Turnstile |
| `SENTRY_DSN` | Config | Error tracking endpoint | Monitoring | sentry.io → Project Settings |
| `ADMIN_EMAILS` | Config | Authorized admins (CSV) | Admin Auth | Your ops team emails |
| `ADMIN_SESSION_SECRET` | Secret | Session token signing key | Admin Auth | Generate: `openssl rand -base64 48` |

### Derived Configuration Variables

| Variable | Type | Purpose | Usage |
|----------|------|---------|-------|
| `NEXT_PUBLIC_APP_URL` | Config | Public app endpoint | URL construction |
| `NEXT_PUBLIC_SITE_URL` | Config | Canonical site URL | SEO, link generation |
| `NODE_ENV` | System | Environment indicator | Feature toggles |

---

## Multi-Environment Setup

### Development (`.env.local`)

Used locally during `npm run dev`:

```bash
# Copy from .env.local.example and fill with local test credentials
cp .env.local.example .env.local
```

- Uses development Supabase project
- Redis disabled for local testing (graceful degradation)
- Email/CAPTCHA can be disabled or use test credentials
- Admin auth can be simplified for testing

### Preview (Branch Deployments)

Configured in Vercel Dashboard → Settings → Environment Variables:

1. Set **Preview** environment scope for non-sensitive values
2. Reuse staging/production secrets as needed
3. Variables marked "Recommended" should be consistent across all previews
4. Non-critical features degrade gracefully if not configured

### Staging

Similar to production but with:

- Separate Supabase project (recommended for data isolation)
- Same feature flags as production
- Used for final QA before production rollout

### Production

**Most restrictive configuration:**

1. Only authorized team members can deploy
2. All required secrets must be configured
3. Secrets are versioned/rotated regularly
4. Monitor Sentry for production errors
5. Implement log-based alerting

---

## Loading Environment Variables

### Architecture

Your project uses a centralized validation pattern in `env.ts`:

```typescript
// env.ts: Server-only module
import "server-only"; // Prevents accidental client import
import { z } from "zod";

const schema = z.object({
  // Strict validation for required vars
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  // Optional with graceful degradation
  RESEND_API_KEY: z.string().optional(),
});

export const env = schema.parse(process.env);
export const features = {
  email: Boolean(env.RESEND_API_KEY),
  ratelimit: Boolean(env.UPSTASH_REDIS_REST_URL),
};
```

### Usage Patterns

#### Safe Access (Recommended)

```typescript
// Option 1: Use derived feature flags
if (features.email) {
  await sendEmail(user.email);
}

// Option 2: Use env directly (guarantees non-null for exported variables)
const url = env.NEXT_PUBLIC_SUPABASE_URL; // Type-safe, never null
```

#### Runtime-Only Requirements

```typescript
// Use requireEnv() for code paths that only sometimes need a secret
export function requireEnv<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const value = env[key];
  if (!value) {
    throw new Error(`${String(key)} is required at runtime but not configured`);
  }
  return value as NonNullable<Env[K]>;
}

// In an email-sending handler:
if (features.email) {
  const apiKey = requireEnv("RESEND_API_KEY"); // Throws if missing at runtime
}
```

---

## Security Best Practices

### Do's ✅

1. **Use Vercel Dashboard for secrets**: Environment variables marked "Secret" are encrypted at rest
2. **Rotate secrets regularly**: Especially `ADMIN_SESSION_SECRET` and API keys
3. **Use service-specific keys**: Don't reuse credentials across services
4. **Enable audit logging**: Track who accesses sensitive environment data
5. **Use `server-only` imports**: Prevent accidental exposure of server secrets to clients
6. **Validate at build time**: Catch missing required variables before deployment
7. **Lock versions**: Pin specific API versions when available (Supabase, Resend, etc.)

### Don'ts ❌

1. **Never commit `.env.local`**: Add to `.gitignore` (already done)
2. **Never log secrets**: Even in error messages
3. **Never share screenshots**: Of environment variables containing secrets
4. **Never use the same secret in multiple environments**: Create separate keys per environment
5. **Don't hardcode API endpoints**: Always use environment variables
6. **Don't forget to update examples**: Keep `.env.example` and `.env.local.example` in sync

---

## Vercel Dashboard Configuration

### Step 1: Navigate to Environment Variables

1. Go to vercel.com → Your Project → Settings → Environment Variables
2. You'll see three environment scopes: **Production**, **Preview**, **Development**

### Step 2: Configure by Scope

#### Required for All Environments

```
NEXT_PUBLIC_SUPABASE_URL=https://your-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

#### Production-Specific

```
RESEND_API_KEY=re_xxxxx
EMAIL_FROM="SC Security Summit <noreply@scsecuritysummit.com>"
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx
TURNSTILE_SECRET_KEY=xxxxx
ADMIN_EMAILS=ops@example.com,admin@example.com
ADMIN_SESSION_SECRET=<32-char-secret>
SENTRY_DSN=https://...
```

#### Preview/Staging (Optional, Degrade Gracefully)

```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=xxxxx
NEXT_PUBLIC_APP_URL=https://preview-branch.vercel.app
```

### Step 3: Pull Locally

To sync all variables to your local machine:

```bash
vercel env pull
```

This creates `.env.local` with all configured secrets (restricted to authorized users).

---

## Feature Flags & Degradation

### How It Works

When a feature's required variables are missing, the application gracefully disables that feature:

```typescript
export const features = {
  ratelimit: Boolean(
    env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
  ),
  email: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM),
  turnstile: Boolean(
    env.TURNSTILE_SECRET_KEY && env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  ),
};
```

### Example: Email Feature

```typescript
// In lib/email.ts
export async function sendEmail(to: string, subject: string, html: string) {
  if (!features.email) {
    console.warn("[email] Service not configured. Email skipped.");
    return { success: false, reason: "email_disabled" };
  }

  const apiKey = requireEnv("RESEND_API_KEY");
  // Send email...
}
```

### Example: Rate Limiting Feature

```typescript
// In lib/rate-limit.ts
export async function rateLimit(key: string, limit: number) {
  if (!features.ratelimit) {
    console.warn("[ratelimit] Redis not configured. Skipping rate limit.");
    return { success: true, remaining: Infinity };
  }

  const redis = requireEnv("UPSTASH_REDIS_REST_URL");
  // Check rate limit...
}
```

This ensures that **optional features don't cause 500 errors**; instead, they log warnings and degrade gracefully.

---

## Troubleshooting

### Build Fails with "Invalid Environment Variables"

**Cause**: A required variable is missing.

**Solution**:
1. Check Vercel Dashboard → Environment Variables
2. Ensure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are set
3. Run `vercel env pull` to update `.env.local`
4. Restart your dev server

### Feature Disabled at Runtime

**Cause**: Optional variables are not configured.

**Solution**:
1. Check console logs for `[feature-name] Service not configured` warnings
2. Verify the feature's required variables in the table above
3. Add missing variables to Vercel Dashboard
4. Run `vercel env pull`
5. Restart dev server

### Public Keys Accidentally Exposed

**Not a security issue** if `NEXT_PUBLIC_*` variables are compromised:
- These keys are intentionally client-side and already visible in browser network requests
- They're scoped to your Supabase project and restricted by Row-Level Security

### Secrets Exposed in Logs

**Immediate action**:
1. Rotate the exposed secret immediately
2. Generate a new key in the service's dashboard (Supabase, Resend, etc.)
3. Update Vercel Environment Variables
4. Review logs for unauthorized access
5. Consider enabling Sentry to track incidents

---

## Rotating Secrets

### Weekly/Monthly Rotation Strategy

| Secret | Rotation Frequency | Method |
|--------|-------------------|--------|
| `ADMIN_SESSION_SECRET` | Monthly | Generate new with `openssl rand -base64 48` |
| `RESEND_API_KEY` | Every 3-6 months | Create new key in Resend dashboard, revoke old |
| `UPSTASH_REDIS_REST_TOKEN` | Every 6 months | Reset in Vercel/Upstash dashboard |
| `TURNSTILE_SECRET_KEY` | As needed | Regenerate in Cloudflare dashboard |
| Supabase keys | As needed (via role rotation) | Use Supabase's built-in key rotation |

### Rotation Checklist

1. Generate new secret
2. Add new secret to Vercel Dashboard (both new and old)
3. Deploy to verify new key works
4. Remove old secret from Dashboard
5. Verify no errors in Sentry
6. Document rotation date/time

---

## Monitoring & Alerts

### Sentry Integration

Configure `SENTRY_DSN` to track:
- Build-time variable validation failures
- Runtime errors from missing optional variables
- API failures (Supabase, Resend, Redis, Turnstile)

### Log Patterns to Monitor

Search logs for:
- `[email] Service not configured` → Email feature disabled
- `[ratelimit] Redis not configured` → Rate limiting disabled
- `Invalid environment variables` → Missing required vars
- `is required at runtime but not configured` → Feature accessed without setup

### Alerts to Set Up

1. **Build Failures**: Alert if `vercel deploy` fails
2. **Environment Mismatch**: Alert if production/staging use different Supabase projects
3. **Secret Expiration**: Reminder to rotate keys (Resend, Upstash)
4. **Sentry Errors**: Alert on spikes in environment-related errors

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v5
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

**Note**: Vercel Dashboard automatically handles environment variable injection during CI/CD. No need to pass them as GitHub Secrets unless you're running custom scripts.

---

## References

- [Vercel Environment Variables Docs](https://vercel.com/docs/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Zod Validation](https://zod.dev)
- [server-only NPM Module](https://www.npmjs.com/package/server-only)

---

**Last Updated**: 2026-04-29  
**Status**: Production Ready ✅
