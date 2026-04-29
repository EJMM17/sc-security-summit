# Environment Variables Quick Reference Card

## 📋 One-Page Cheat Sheet

### Getting Started (5 minutes)

```bash
# 1. Pull environment variables from Vercel
vercel env pull

# 2. Verify .env.local exists
ls -la .env.local

# 3. Start development server
npm run dev

# ✅ You're ready to develop!
```

---

## 🔐 Required Variables (Strict)

| Variable | Example | Where To Get |
|----------|---------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ref.supabase.co` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase → Settings → API |

**Action**: If missing, build fails with validation error. Add to Vercel Dashboard.

---

## ⭐ Optional Variables (Graceful Degradation)

### Email (Resend)
```
RESEND_API_KEY=re_xxx
EMAIL_FROM="App Name <noreply@domain.com>"
CONTACT_EMAIL=support@domain.com
```

### Rate Limiting (Upstash Redis)
```
UPSTASH_REDIS_REST_URL=https://instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=token_xxx
```

### CAPTCHA (Turnstile)
```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=xxx
TURNSTILE_SECRET_KEY=xxx
```

### Error Tracking (Sentry)
```
SENTRY_DSN=https://...@...ingest.sentry.io/...
```

### Admin Auth (Optional)
```
ADMIN_EMAILS=ops@example.com,admin@example.com
ADMIN_SESSION_SECRET=<32-char-secret>  # Generate: openssl rand -base64 48
```

**Action**: If missing, that feature is disabled (logged as warning).

---

## 💻 Using in Code

### Safe Feature Check
```typescript
import { features } from "@/env";

if (features.email) {
  await sendEmail(user.email);
}
```

### Runtime Requirement
```typescript
import { requireEnv } from "@/env";

if (features.email) {
  const apiKey = requireEnv("RESEND_API_KEY");
  // Use apiKey...
}
```

### Access Variable Directly
```typescript
import { env } from "@/env";

const url = env.NEXT_PUBLIC_SUPABASE_URL; // Always defined
```

---

## 🚀 Deployment Flow

```
Develop Locally → vercel env pull → npm run dev
                      ↓
          [Make changes to code]
                      ↓
          git commit && git push
                      ↓
      Vercel Deploys → Checks .env vars
                      ↓
      Build Fails? → Check Vercel Dashboard
                      ↓
      Build Passes? → Feature flags auto-enabled
                      ↓
              Production Live
```

---

## 🔍 Debugging Checklist

| Problem | Solution |
|---------|----------|
| `Invalid environment variables` | Run `vercel env pull` |
| `.env.local` not found | Run `vercel login` then `vercel env pull` |
| Feature disabled in logs | Add variables to Vercel Dashboard |
| Build fails in preview | Check Preview scope variables |
| "Secret is required" error | Run `vercel env pull` + restart dev server |
| API call fails | Check Sentry for error details |

---

## 🛡️ Security Essentials

```bash
# ✅ DO
- Use Vercel Dashboard to manage secrets
- Run `vercel env pull` to sync locally
- Rotate ADMIN_SESSION_SECRET monthly
- Check features.* before using optional services

# ❌ DON'T
- Commit .env.local to Git (it's in .gitignore)
- Log secrets to console
- Use the same key in multiple environments
- Share .env.local screenshots with team
```

---

## 📚 Documentation Links

```
Quick Start        → docs/ENV_SETUP_GUIDE.md
Complete Guide     → docs/ENV_MANAGEMENT.md
Setup Checklist    → docs/VERCEL_CONFIG_CHECKLIST.md
Code Examples      → docs/ENV_EXAMPLES.md
Architecture       → docs/ENV_ADR.md
Index/Navigation   → docs/README.md
```

---

## 🔄 Maintenance Schedule

| When | What | Command |
|------|------|---------|
| Monthly | Rotate `ADMIN_SESSION_SECRET` | Generate: `openssl rand -base64 48` |
| Quarterly | Rotate API keys | Regenerate in each service |
| Annually | Full security audit | Review all variables & access |
| Always | Before deploying | Run `npm run build` |

---

## 🎯 Environment Scopes

```
Development
├─ .env.local (local machine)
├─ Created via: vercel env pull
└─ Scope: Personal development

Preview (Branch Deployments)
├─ Vercel Dashboard → Preview scope
├─ Optional features degrade gracefully
└─ Inherits from Production if not set

Production
├─ Vercel Dashboard → Production scope
├─ All required variables must be set
└─ Access: Team members only
```

---

## 🆘 Common Errors & Fixes

```
❌ "SUPABASE_SERVICE_ROLE_KEY: String must contain at least 1 character"
✅ Fix: Run vercel env pull && npm run dev

❌ "[email] Service not configured. Email skipped."
✅ Fix: Add RESEND_API_KEY to Vercel Dashboard

❌ "ADMIN_SESSION_SECRET is required at runtime but not configured"
✅ Fix: Generate with openssl rand -base64 48, add to Vercel Dashboard

❌ "Cannot import server-only module into a client"
✅ Fix: Move import to server component or use "use server"

❌ Build fails during deploy but works locally
✅ Fix: Check Vercel Dashboard environment variables
```

---

## 📊 Feature Availability Matrix

```
Environment | Email | Rate Limit | CAPTCHA | Sentry | Status
------------|-------|-----------|---------|--------|--------
Development | ⚠️    | ⚠️        | ⚠️      | ⚠️     | Running
Preview     | ⚠️    | ⚠️        | ⚠️      | ⚠️     | Testing
Production  | ✅    | ✅        | ✅      | ✅     | Live

⚠️  = Optional (gracefully disabled if not configured)
✅ = Enabled and monitored
```

---

## 🎓 Best Practices

1. **Always check features before using optional services**
   ```typescript
   if (!features.email) {
     return { success: false, reason: "email_disabled" };
   }
   ```

2. **Use requireEnv() only in conditional blocks**
   ```typescript
   if (features.email) {
     const key = requireEnv("RESEND_API_KEY"); // Safe here
   }
   ```

3. **Never import env.ts in client components**
   ```typescript
   // ❌ Client component - DON'T DO THIS
   "use client";
   import { env } from "@/env"; // Build fails!
   
   // ✅ Server component - OK
   import { env } from "@/env"; // Build succeeds
   ```

4. **Keep documentation up-to-date when adding variables**
   - Update env.ts schema
   - Update .env.example
   - Update ENV_MANAGEMENT.md table

5. **Rotate secrets on schedule**
   - Monthly: ADMIN_SESSION_SECRET
   - Quarterly: API keys
   - Annually: Full audit

---

## 🚨 Emergency Procedures

### If Secrets Are Exposed in Git

```bash
# 1. Remove from Git history
git rm --cached .env.local
git commit -m "Remove .env.local"

# 2. Rotate ALL secrets immediately
# - Generate new ADMIN_SESSION_SECRET
# - Regenerate API keys (Resend, Turnstile, etc.)
# - Reset Upstash Redis token

# 3. Update Vercel Dashboard with new values

# 4. Deploy to production
vercel deploy --prod

# 5. Verify no errors in Sentry
```

### If Build Fails in Production

```bash
# 1. Check Vercel Dashboard → Deployments → build logs
# 2. Search for "Invalid environment variables"
# 3. Compare with VERCEL_CONFIG_CHECKLIST.md
# 4. Add missing variables to Vercel Dashboard
# 5. Retry deploy: vercel deploy --prod
```

---

## 📞 Quick Support

| Issue | Document | Section |
|-------|----------|---------|
| How do I get started? | ENV_SETUP_GUIDE.md | Quick Start |
| Where do I find variables? | ENV_MANAGEMENT.md | Environment Variable Categories |
| How do I set up production? | VERCEL_CONFIG_CHECKLIST.md | Vercel Dashboard Configuration |
| How do I use variables in code? | ENV_EXAMPLES.md | All 10 patterns |
| Why this design? | ENV_ADR.md | All 7 decisions |

---

## ✅ Pre-Deployment Checklist

- [ ] `npm run build` succeeds with no env errors
- [ ] `vercel env pull` completed locally
- [ ] All required Supabase variables in Vercel Dashboard
- [ ] `ADMIN_SESSION_SECRET` is 32+ characters
- [ ] API keys configured (email, rate limiting, etc.)
- [ ] Sentry DSN configured for production
- [ ] `.env.local` is in `.gitignore`
- [ ] No `.env.local` in Git history
- [ ] Tested locally with `npm run dev`
- [ ] Ready for production deployment!

---

**Last Updated**: 2026-04-29  
**Version**: 1.0 - Production Ready ✅  
**For Questions**: See docs/README.md for full documentation
