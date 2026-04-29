# Environment Variables Documentation Index

Welcome to the comprehensive environment variables setup for SC Security Summit!

## 🚀 Quick Navigation

### For New Developers (Start Here)
👉 **[ENV_SETUP_GUIDE.md](ENV_SETUP_GUIDE.md)** - 5-minute quick start

### For Complete Reference
📖 **[ENV_MANAGEMENT.md](ENV_MANAGEMENT.md)** - Full guide with all details

### For Vercel Configuration
✅ **[VERCEL_CONFIG_CHECKLIST.md](VERCEL_CONFIG_CHECKLIST.md)** - Step-by-step setup

### For Code Examples
💻 **[ENV_EXAMPLES.md](ENV_EXAMPLES.md)** - Implementation patterns

### For Architecture Details
🏗️ **[ENV_ADR.md](ENV_ADR.md)** - Design decisions and trade-offs

---

## 📚 Document Overview

| Document | Audience | Time | Purpose |
|----------|----------|------|---------|
| **ENV_SETUP_GUIDE.md** | Developers, DevOps | 5 min | Quick start & daily workflow |
| **ENV_MANAGEMENT.md** | Engineers, Architects | 20 min | Complete reference manual |
| **VERCEL_CONFIG_CHECKLIST.md** | DevOps, Team Lead | 15 min | Production setup guide |
| **ENV_EXAMPLES.md** | Developers | 15 min | Code patterns & best practices |
| **ENV_ADR.md** | Architects, Tech Leads | 20 min | Design decisions & rationale |

---

## 🛠️ Implementation Files

| File | Purpose | Type |
|------|---------|------|
| `env.ts` | Validation schema & feature flags | Core |
| `lib/env-utils.ts` | Helper functions | Utility |
| `lib/env-monitor.ts` | Configuration monitoring | Utility |
| `.env.example` | Template for repository | Reference |
| `.env.local.example` | Template for local development | Reference |

---

## 🎯 Common Tasks

### "I'm a new developer, how do I get started?"
1. Read: **[ENV_SETUP_GUIDE.md](ENV_SETUP_GUIDE.md)** (5 minutes)
2. Run: `vercel env pull`
3. Run: `npm run dev`
4. ✅ Done!

### "How do I add a new feature variable?"
1. Add to `env.ts` schema (Zod)
2. Update `.env.example`
3. Update `.env.local.example`
4. Add to **[ENV_MANAGEMENT.md](ENV_MANAGEMENT.md)** table
5. Document in **[ENV_EXAMPLES.md](ENV_EXAMPLES.md)**

### "How do I set up production?"
1. Go to **[VERCEL_CONFIG_CHECKLIST.md](VERCEL_CONFIG_CHECKLIST.md)**
2. Follow the "Vercel Dashboard Configuration" section
3. Deploy with `vercel deploy --prod`

### "How do I use environment variables in my code?"
1. See **[ENV_EXAMPLES.md](ENV_EXAMPLES.md)** for patterns
2. Import from `@/env`
3. Check `features.*` for optional services
4. Use `requireEnv()` for runtime requirements

### "How do I debug environment issues?"
1. Read **[ENV_MANAGEMENT.md](ENV_MANAGEMENT.md#troubleshooting)** Troubleshooting section
2. Run `npm run build` to see validation errors
3. Check `.env.local` exists: `ls -la .env.local`
4. Check values: `cat .env.local | grep SUPABASE`

---

## 🔐 Security Essentials

### Before Production Deployment

- [ ] Read security section in **[ENV_MANAGEMENT.md](ENV_MANAGEMENT.md#security-best-practices)**
- [ ] Follow **[VERCEL_CONFIG_CHECKLIST.md](VERCEL_CONFIG_CHECKLIST.md#security-checklist)**
- [ ] All required Supabase variables configured
- [ ] `ADMIN_SESSION_SECRET` is 32+ characters
- [ ] All API keys rotated recently
- [ ] No `.env.local` files in Git history

### Regular Maintenance

- [ ] Monthly: Rotate `ADMIN_SESSION_SECRET`
- [ ] Quarterly: Rotate API keys (Resend, Turnstile, Upstash)
- [ ] Annually: Full security audit
- [ ] Ongoing: Monitor Sentry for errors

---

## 📊 Architecture Overview

```
Development (.env.local)
        ↓
Validation (env.ts)
        ↓
Feature Flags (features.*)
        ↓
Runtime Access (env, requireEnv)
        ↓
Application Code

Production (Vercel Dashboard)
        ↓
Auto-injected at Deploy
        ↓
Validation (env.ts)
        ↓
Feature Flags (features.*)
        ↓
Application Code
```

---

## 🚨 Critical Variables (Must Have)

These variables are **required** and will cause the build to fail if missing:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## ✨ Optional Variables (Enhanced Features)

These variables enable additional features but don't break the app if missing:

```
RESEND_API_KEY=re_xxx                    # Email
UPSTASH_REDIS_REST_URL=https://...       # Rate limiting
UPSTASH_REDIS_REST_TOKEN=xxx             # Rate limiting
NEXT_PUBLIC_TURNSTILE_SITE_KEY=xxx       # CAPTCHA
TURNSTILE_SECRET_KEY=xxx                 # CAPTCHA
SENTRY_DSN=https://...                   # Error tracking
ADMIN_EMAILS=ops@example.com             # Admin auth
ADMIN_SESSION_SECRET=xxx (32+ chars)     # Admin auth
```

---

## 📞 Support & Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Invalid environment variables" | Run `vercel env pull` |
| `.env.local` not found | Run `vercel login` then `vercel env pull` |
| Feature disabled at runtime | Add variables to Vercel Dashboard |
| Secrets exposed in Git | Rotate secrets immediately |
| Build fails in preview | Check Preview scope in Vercel Dashboard |

### Getting Help

1. **Quick Issues**: Check **[ENV_MANAGEMENT.md](ENV_MANAGEMENT.md#troubleshooting)**
2. **Code Questions**: See **[ENV_EXAMPLES.md](ENV_EXAMPLES.md)**
3. **Setup Help**: Use **[VERCEL_CONFIG_CHECKLIST.md](VERCEL_CONFIG_CHECKLIST.md)**
4. **Architecture**: Read **[ENV_ADR.md](ENV_ADR.md)**

---

## 📋 Implementation Checklist

### Phase 1: Local Development (Day 1)
- [ ] Read `ENV_SETUP_GUIDE.md` (5 min)
- [ ] Run `vercel env pull`
- [ ] Verify `npm run dev` works
- [ ] Bookmark these docs for reference

### Phase 2: Feature Development (Ongoing)
- [ ] Check `ENV_EXAMPLES.md` for patterns
- [ ] Use `features.*` for optional services
- [ ] Use `requireEnv()` for runtime requirements
- [ ] Follow security best practices in code

### Phase 3: Production Deployment (Before Going Live)
- [ ] Complete `VERCEL_CONFIG_CHECKLIST.md`
- [ ] Verify all variables in Vercel Dashboard
- [ ] Run security checklist
- [ ] Deploy to production
- [ ] Monitor Sentry for errors

### Phase 4: Maintenance (Ongoing)
- [ ] Monthly: Rotate secrets
- [ ] Monitor configuration health
- [ ] Review Sentry for environment-related errors
- [ ] Update documentation as needed

---

## 📚 Learning Path

### Beginner (First Time)
1. Quick Start: `ENV_SETUP_GUIDE.md` (5 min)
2. Run: `vercel env pull && npm run dev`
3. Explore: Look at the code in `env.ts`

### Intermediate (Using Features)
1. Reference: `ENV_MANAGEMENT.md` (complete guide)
2. Examples: `ENV_EXAMPLES.md` (code patterns)
3. Implement: Follow patterns in your code

### Advanced (Architecture & Maintenance)
1. Deep Dive: `ENV_ADR.md` (design decisions)
2. Setup: `VERCEL_CONFIG_CHECKLIST.md` (production)
3. Maintain: Follow the maintenance checklist

---

## 🔄 Keeping Documentation Current

Help keep these docs up-to-date:

- [ ] If you add a new variable, update `env.ts` AND all docs
- [ ] If you find a confusing section, clarify it or ask
- [ ] If a troubleshooting tip works, add it to this guide
- [ ] If something is outdated, update the date and details

**Last Updated**: 2026-04-29  
**Maintained by**: Engineering Team  
**Status**: ✅ Production Ready

---

## 🎓 Key Takeaways

1. **Validate Early**: All required variables checked at build time
2. **Degrade Gracefully**: Optional features don't crash the app
3. **Be Secure**: Use `server-only` module, rotate secrets, audit access
4. **Stay Informed**: Monitor configuration health with Sentry and logs
5. **Document Everything**: Keep examples and guides in sync with code

---

**Happy coding! 🚀**
