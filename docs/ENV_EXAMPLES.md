# Environment Variables Implementation Examples

## Overview

This document shows practical examples of how to use the environment variable system correctly in your Next.js application.

---

## Pattern 1: Safe Feature-Gated Code

### Email Service Example

**File**: `lib/email.ts`

```typescript
import "server-only";
import { env, features, requireEnv } from "@/env";

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  // Check if feature is enabled
  if (!features.email) {
    console.warn("[email] Service not configured. Email skipped.");
    return {
      success: false,
      error: "email_service_disabled",
    };
  }

  try {
    // Now we can safely require the API key
    const apiKey = requireEnv("RESEND_API_KEY");

    // Send with Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error("[email] Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
}

// Usage in a server action
export async function handleContactForm(formData: FormData) {
  const email = formData.get("email") as string;
  const message = formData.get("message") as string;

  const result = await sendEmail(
    env.CONTACT_EMAIL || "support@example.com",
    "New Contact Form Submission",
    `From: ${email}\n\n${message}`
  );

  if (!result.success) {
    // Feature was disabled or failed - but this doesn't crash the app
    console.warn("Email notification skipped:", result.error);
  }

  return { success: true }; // Form submission successful regardless
}
```

---

## Pattern 2: Rate Limiting with Graceful Degradation

**File**: `lib/rate-limit.ts`

```typescript
import "server-only";
import { env, features, requireEnv } from "@/env";

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  retryAfter?: number;
};

export async function rateLimit(
  key: string,
  limit: number = 10,
  window: number = 60 // seconds
): Promise<RateLimitResult> {
  // If Redis not configured, allow all requests
  if (!features.ratelimit) {
    console.warn("[ratelimit] Redis not configured. Skipping rate limit check.");
    return {
      success: true,
      remaining: Infinity,
    };
  }

  try {
    const redisUrl = requireEnv("UPSTASH_REDIS_REST_URL");
    const redisToken = requireEnv("UPSTASH_REDIS_REST_TOKEN");

    const response = await fetch(`${redisUrl}/incr/${key}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
      },
    });

    if (!response.ok) {
      // If Redis fails, allow the request (fail open)
      console.warn("[ratelimit] Redis error. Allowing request.");
      return { success: true, remaining: Infinity };
    }

    const count = await response.json();

    // Set expiration on first request
    if (count === 1) {
      await fetch(`${redisUrl}/expire/${key}/${window}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
        },
      });
    }

    const remaining = Math.max(0, limit - count);
    const exceeded = count > limit;

    return {
      success: !exceeded,
      remaining,
      retryAfter: exceeded ? window : undefined,
    };
  } catch (error) {
    console.error("[ratelimit] Error:", error);
    // Fail open - allow request if Redis is unavailable
    return { success: true, remaining: Infinity };
  }
}

// Usage in an API route
export async function POST(request: Request) {
  const clientIp = request.headers.get("x-forwarded-for") || "unknown";
  const limit = await rateLimit(`register:${clientIp}`, 5, 3600); // 5 per hour

  if (!limit.success) {
    return new Response("Rate limit exceeded", {
      status: 429,
      headers: {
        "Retry-After": String(limit.retryAfter),
      },
    });
  }

  // Process request...
}
```

---

## Pattern 3: Server-Only Imports to Prevent Leaks

### Correct ✅

**File**: `app/api/webhook/route.ts`

```typescript
import "server-only"; // Prevents this file from being imported in client components

// Import server-only env variables
import { env, requireEnv } from "@/env";

export async function POST(request: Request) {
  // Safe: env is only available on server
  const secret = requireEnv("ADMIN_SESSION_SECRET");

  // Verify webhook signature
  const signature = request.headers.get("x-signature");
  if (signature !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Process webhook...
}
```

### Incorrect ❌

**Don't do this:**

```typescript
// File: lib/config.ts (no "server-only" directive)
import { env } from "@/env"; // Now exposed if imported client-side

export const apiSecret = env.ADMIN_SESSION_SECRET; // 🚨 Leaked!
```

```typescript
// File: components/Header.tsx (client component)
import { apiSecret } from "@/lib/config"; // 🚨 Client now has the secret!

export function Header() {
  console.log(apiSecret); // 🚨 Visible in browser console
  return <header>Hello</header>;
}
```

**Solution**: Use the `"use client"` directive boundary:

```typescript
// lib/auth-server.ts
import "server-only";
import { env } from "@/env";

export function getSessionSecret() {
  return env.ADMIN_SESSION_SECRET;
}
```

```typescript
// app/admin/page.tsx (server component by default)
import { getSessionSecret } from "@/lib/auth-server";

export default function AdminPage() {
  const secret = getSessionSecret(); // ✅ Safe - server component
  return <AdminContent />;
}
```

---

## Pattern 4: Multi-Environment Configuration

### Different Behavior Per Environment

**File**: `lib/config.ts`

```typescript
import "server-only";
import { env } from "@/env";

export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";

export const apiConfig = {
  // Use staging endpoint in development
  supabaseUrl: isProduction
    ? env.NEXT_PUBLIC_SUPABASE_URL
    : process.env.DEV_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL,

  // Disable certain features in development
  enableAnalytics: isProduction,
  enableErrorReporting: isProduction,

  // Use test credentials in development
  captchaBypass: isDevelopment && process.env.CAPTCHA_BYPASS === "true",

  // Different contact emails
  contactEmail:
    env.CONTACT_EMAIL ||
    (isDevelopment ? "dev@localhost" : "support@example.com"),
};
```

### Usage

```typescript
import { apiConfig, isDevelopment } from "@/lib/config";

export async function handleFormSubmission(data: FormData) {
  if (apiConfig.enableAnalytics) {
    // Only in production
    await trackEvent("form_submitted");
  }

  if (apiConfig.contactEmail !== "dev@localhost") {
    // Send email notification
    await sendNotification(apiConfig.contactEmail);
  }
}
```

---

## Pattern 5: Validation at Module Load

### Prevent Runtime Errors

**File**: `instrumentation.ts`

```typescript
// This runs once at server startup
import { logEnvConfig, warnAboutDisabledFeatures } from "@/lib/env-utils";

export async function register() {
  if (process.env.NEXT_PUBLIC_ENV === "production") {
    // Log detailed config on startup
    logEnvConfig("production-startup");

    // Warn about disabled features in prod
    warnAboutDisabledFeatures();
  }
}
```

Output:

```
[env] Configuration loaded (production-startup):
  • Supabase: ✅
  • Email: ✅
  • Rate Limiting: ✅
  • CAPTCHA: ✅
  • Admin Auth: ✅
  • Error Tracking: ✅

[env] All features enabled. System is healthy.
```

---

## Pattern 6: Handling Missing Secrets Gracefully

### Email Service with Fallback

**File**: `lib/notifications.ts`

```typescript
import "server-only";
import { env, features } from "@/env";

export async function notifyUser(userId: string, message: string) {
  // Try email first (if configured)
  if (features.email) {
    try {
      const user = await getUser(userId);
      await sendEmail(user.email, "Notification", message);
      return { method: "email", success: true };
    } catch (error) {
      console.warn("[notify] Email failed, trying alternatives:", error);
    }
  }

  // Fallback: Store in-app notification
  try {
    await createNotification(userId, message);
    return { method: "in-app", success: true };
  } catch (error) {
    console.error("[notify] All methods failed:", error);
    return { method: "none", success: false };
  }
}
```

---

## Pattern 7: Admin Routes Protected by Env

**File**: `app/admin/layout.tsx`

```typescript
import "server-only";
import { env } from "@/env";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If admin auth not configured, block access
  if (!env.ADMIN_EMAILS || !env.ADMIN_SESSION_SECRET) {
    console.warn("[admin] Admin auth not configured. Access denied.");
    redirect("/");
  }

  return <>{children}</>;
}
```

---

## Pattern 8: Testing with Mock Env

**File**: `__tests__/email.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the env module
vi.mock("@/env", () => ({
  env: {
    RESEND_API_KEY: "test-key-123",
    EMAIL_FROM: "test@example.com",
  },
  features: {
    email: true,
  },
}));

import { sendEmail } from "@/lib/email";

describe("sendEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send email when feature is enabled", async () => {
    const result = await sendEmail(
      "user@example.com",
      "Test Subject",
      "<p>Test Body</p>"
    );

    expect(result.success).toBe(true);
  });
});
```

---

## Pattern 9: Debugging Environment Issues

**File**: `app/api/debug/env/route.ts`

⚠️ **Only for development/staging!**

```typescript
import "server-only";
import { getEnvStatus } from "@/lib/env-utils";
import { env } from "@/env";

// ⚠️ Only accessible in development
if (env.NODE_ENV !== "development") {
  throw new Error("Debug endpoint only available in development");
}

export async function GET() {
  const status = getEnvStatus();

  return Response.json({
    environment: env.NODE_ENV,
    features: status,
    message: "⚠️ This endpoint is for debugging only",
  });
}
```

**Access**: `http://localhost:3000/api/debug/env` (development only)

---

## Pattern 10: Feature Detection in Components

**File**: `components/ContactForm.tsx`

```typescript
import "use server"; // Server component
import { features } from "@/env";

export async function ContactForm() {
  return (
    <form action={handleSubmit}>
      <input type="email" name="email" placeholder="Your email" />
      <textarea name="message" placeholder="Your message" />

      {/* Show status based on environment configuration */}
      {features.email ? (
        <p className="text-sm text-green-600">
          ✓ We'll respond via email within 24 hours
        </p>
      ) : (
        <p className="text-sm text-yellow-600">
          ⚠️ Email notifications are temporarily disabled. We'll still process
          your request.
        </p>
      )}

      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## Best Practices Summary

| Pattern | Use Case | Security |
|---------|----------|----------|
| Check `features.*` | Gate optional features | ✅ Safe |
| Use `requireEnv()` | Runtime-only requirements | ✅ Safe |
| Call from `[route].ts` | API routes | ✅ Safe |
| Import in `"use server"` | Server actions | ✅ Safe |
| Access in server components | RSC, RCC parent | ✅ Safe |
| **DON'T** import in `"use client"` | Client components | ❌ Leaks secrets |
| **DON'T** expose in API responses | JSON endpoints | ❌ Leaks secrets |
| **DON'T** log to browser console | Error handling | ❌ Leaks secrets |

---

## References

- [env.ts](../env.ts) - Validation schema and feature flags
- [ENV_MANAGEMENT.md](./ENV_MANAGEMENT.md) - Configuration guide
- [VERCEL_CONFIG_CHECKLIST.md](./VERCEL_CONFIG_CHECKLIST.md) - Setup steps
