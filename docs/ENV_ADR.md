# Environment Variables Architecture Decision Record (ADR)

## Document Purpose

This ADR documents the design decisions, trade-offs, and implementation details of the environment variable system for SC Security Summit.

---

## Decision 1: Zod-Based Validation at Module Load

### Status
✅ **Adopted**

### Context
- Need to ensure required variables are present before app starts
- Type safety for environment variables
- Clear error messages when configuration is missing

### Decision
Use Zod schema in `env.ts` to validate environment variables at module load time.

### Rationale
1. **Type Safety**: TypeScript knows which variables exist and their types
2. **Fail Fast**: Build fails immediately if required variables are missing
3. **Centralized**: Single source of truth for all environment variables
4. **Clear Errors**: Descriptive validation messages help debugging

### Implementation
```typescript
// env.ts
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),        // Strict
  RESEND_API_KEY: z.string().optional(),             // Optional
});

export const env = schema.parse(process.env);
```

### Alternatives Considered
- ❌ No validation (runtime errors, hard to debug)
- ❌ Env validation in multiple places (fragmented, inconsistent)
- ❌ Manual type definitions (no runtime checking)

---

## Decision 2: Strict vs. Optional Classification

### Status
✅ **Adopted**

### Context
- Some features (Supabase) are essential; app cannot work without them
- Other features (Email, Redis) are nice-to-have but not required
- Want graceful degradation for optional features

### Decision
Classify variables as either **Strict** (build fails) or **Optional** (graceful degradation).

### Implementation

**Strict Variables** (Build-Time Failure):
```typescript
NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
```

**Optional Variables** (Runtime Degradation):
```typescript
RESEND_API_KEY: z.string().optional(),
```

### Benefits
1. ✅ Critical services never fail silently
2. ✅ Optional features don't block development
3. ✅ Clear separation of concerns
4. ✅ Backward compatible with missing features

### Example: Email Feature Graceful Degradation
```typescript
if (!features.email) {
  console.warn("[email] Service not configured. Email skipped.");
  return { success: false };
}
```

---

## Decision 3: Feature Flags for Runtime Gating

### Status
✅ **Adopted**

### Context
- Optional features need to be checked at runtime
- Want to avoid "undefined" checks scattered throughout codebase
- Need centralized feature detection

### Decision
Export feature availability flags from `env.ts`:
```typescript
export const features = {
  ratelimit: Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
  email: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM),
  turnstile: Boolean(env.TURNSTILE_SECRET_KEY && env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
};
```

### Usage
```typescript
// Simple check
if (features.email) {
  await sendEmail(user.email);
}

// With fallback
if (!features.email) {
  console.warn("Email service disabled. Using in-app notifications.");
  await createInAppNotification(user.id, message);
}
```

### Benefits
1. ✅ Single source of truth for feature availability
2. ✅ Type-safe: TypeScript knows which features exist
3. ✅ Prevents runtime errors from missing dependencies
4. ✅ Enables clean fallback logic

---

## Decision 4: Server-Only Module Enforcement

### Status
✅ **Adopted**

### Context
- `env.ts` exports server secrets (like `SUPABASE_SERVICE_ROLE_KEY`)
- Must prevent accidental client-side imports
- Need clear boundary between server and client code

### Decision
Use `"server-only"` import at top of `env.ts`:

```typescript
import "server-only";
import { z } from "zod";

// ... validation schema ...
export const env = parsed.data;
```

### How It Works
- Build fails if a client component imports `env.ts`
- Prevents secrets from leaking to browser
- Type-safe error at build time (not runtime)

### Example: Correct Usage

✅ **Server component** (default in App Router):
```typescript
// app/admin/page.tsx
import { env } from "@/env";

export default function AdminPage() {
  const secret = env.ADMIN_SESSION_SECRET; // ✅ OK
  return <AdminContent />;
}
```

❌ **Client component** (with "use client"):
```typescript
// components/Header.tsx
"use client";
import { env } from "@/env"; // ❌ Build fails!
```

---

## Decision 5: `requireEnv()` for Runtime-Only Requirements

### Status
✅ **Adopted**

### Context
- Some features have dependencies that should be runtime errors, not build errors
- Example: Email API key only needed when actually sending email
- Want runtime error message to be clear

### Decision
Provide `requireEnv()` function for runtime-only requirements:

```typescript
export function requireEnv<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const value = env[key];
  if (!value) {
    throw new Error(`${String(key)} is required at runtime but not configured`);
  }
  return value as NonNullable<Env[K]>;
}
```

### Usage
```typescript
// In email handler (runtime-only requirement)
if (features.email) {
  const apiKey = requireEnv("RESEND_API_KEY"); // Throws if missing
  // Send email with apiKey
}
```

### Benefits
1. ✅ Clear, descriptive error if feature is accessed without setup
2. ✅ Lazy evaluation: only checked when feature is actually used
3. ✅ Enables graceful degradation without runtime errors

---

## Decision 6: Multi-Environment Support Strategy

### Status
✅ **Adopted**

### Context
- Different environments (dev, staging, production) need different configurations
- Some services (Redis) may not be available locally
- Need to support local development without all integrations

### Decision
Use Vercel's environment scopes:
- **Production**: All services enabled, production credentials
- **Preview**: Subset of services, can share production credentials where safe
- **Development**: Minimal setup, local-only testing

### Environment Configuration Matrix

| Variable | Dev | Preview | Prod | Scope |
|----------|-----|---------|------|-------|
| Supabase | Dev project | Prod | Prod | Strict |
| Email | Optional | Optional | Yes | Optional |
| Redis | No | Optional | Yes | Optional |
| Admin Auth | Dev/test | Yes | Yes | Optional |
| Sentry | No | Optional | Yes | Optional |

### Implementation
1. Local development: `vercel env pull` syncs Preview/Prod secrets (optional)
2. Preview deployments: Inherit from Preview scope
3. Production: Uses Production scope only

### Benefits
1. ✅ Developers can work without external services
2. ✅ Preview deployments test production-like setup
3. ✅ Production is isolated and secure
4. ✅ Clear separation of responsibilities

---

## Decision 7: Documentation-First Approach

### Status
✅ **Adopted**

### Context
- Environment variables are critical for onboarding
- Missing/incorrect setup causes deployment failures
- Need clear guidance for developers and operators

### Decision
Provide comprehensive documentation with examples:

| Document | Purpose |
|----------|---------|
| `env.ts` | Source of truth (code) |
| `ENV_SETUP_GUIDE.md` | Quick start (5 min) |
| `ENV_MANAGEMENT.md` | Complete reference |
| `VERCEL_CONFIG_CHECKLIST.md` | Step-by-step setup |
| `ENV_EXAMPLES.md` | Code patterns |
| `env-utils.ts` | Helper functions |

### Benefits
1. ✅ New developers can get started quickly
2. ✅ Clear reference for all variables
3. ✅ Troubleshooting guide included
4. ✅ Examples prevent common mistakes

---

## Trade-Offs & Rejected Alternatives

### Alternative 1: dotenv Package Directly
- ❌ **Rejected**: No validation; hard to debug missing vars
- ✅ **Chosen**: Zod validation with clear errors

### Alternative 2: Single Environment File
- ❌ **Rejected**: Can't have separate prod/staging credentials
- ✅ **Chosen**: Vercel Dashboard with scoped environments

### Alternative 3: All Variables Optional
- ❌ **Rejected**: App breaks silently if critical vars missing
- ✅ **Chosen**: Strict vs. optional classification

### Alternative 4: No Feature Flags
- ❌ **Rejected**: Optional checks scattered throughout code
- ✅ **Chosen**: Centralized feature flags in `env.ts`

### Alternative 5: Environment Variables in Code
- ❌ **Rejected**: Secrets committed to Git accidentally
- ✅ **Chosen**: Vercel Dashboard (encrypted, audited)

---

## Security Properties

### Secrets Protection

| Layer | Protection | Details |
|-------|-----------|---------|
| **Build Time** | Zod validation | Invalid configs fail fast |
| **Runtime** | `server-only` | Prevents client imports |
| **Transport** | HTTPS only | Secrets never sent plaintext |
| **Storage** | Vercel Dashboard | Encrypted at rest, audited access |
| **Logging** | No secrets in logs | Helper functions filter output |

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| Secrets in Git | `.gitignore`, build warnings |
| Client-side exposure | `server-only` module |
| Network interception | HTTPS only, no dev access |
| Unauthorized access | Vercel team permissions |
| Secret rotation failure | Monthly rotation process |

---

## Monitoring & Observability

### What to Monitor

1. **Build Failures**: Environment variable validation errors
2. **Feature Availability**: Sentry tracking for disabled features
3. **Secret Rotation**: Expiration dates and renewal status
4. **Unauthorized Access**: Vercel audit logs for env var access

### Alerting Recommendations

```
Alert If:
- Build fails with "Invalid environment variables"
- Production environment missing critical variables
- Feature disabled warnings in logs
- Secrets accessed outside regular business hours
```

---

## Future Considerations

### Potential Enhancements

1. **Secrets Rotation Automation**: Auto-rotate keys on schedule
2. **Environment Variable Audit Trail**: Full logging of changes
3. **Schema Versioning**: Support deprecating old variables
4. **Dynamic Feature Flags**: Toggle features without redeployment
5. **Multi-region Support**: Different env vars per region

### Long-Term Goals

1. Implement comprehensive audit logging
2. Add secrets rotation automation
3. Create internal dashboard for env var status
4. Document all integration dependencies

---

## References

- [env.ts](../env.ts) - Implementation
- [ENV_MANAGEMENT.md](./ENV_MANAGEMENT.md) - Usage guide
- [Zod Documentation](https://zod.dev)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

---

## Approval & History

| Date | Status | Author | Notes |
|------|--------|--------|-------|
| 2026-04-29 | Adopted | v0 | Initial implementation |

---

**Document Status**: ✅ Active  
**Last Review**: 2026-04-29  
**Next Review**: 2026-10-29 (6 months)
