/**
 * Environment Variable Utilities
 *
 * This module provides helper functions for working with environment variables
 * including validation, feature detection, and safe access patterns.
 *
 * Usage:
 *   import { env, features, requireEnv, getEnvStatus } from '@/lib/env-utils';
 *
 *   // Safe feature check
 *   if (features.email) {
 *     await sendEmail(user.email);
 *   }
 *
 *   // Runtime-only requirement
 *   const apiKey = requireEnv('RESEND_API_KEY');
 */

import "server-only";
import { env, features } from "@/env";

/**
 * Get comprehensive environment status report
 * Useful for debugging and monitoring
 */
export function getEnvStatus() {
  return {
    env: process.env.NODE_ENV,
    supabase: {
      configured: Boolean(
        env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
      ),
      url: env.NEXT_PUBLIC_SUPABASE_URL,
    },
    email: {
      enabled: features.email,
      provider: "Resend",
      from: env.EMAIL_FROM,
    },
    ratelimit: {
      enabled: features.ratelimit,
      provider: "Upstash Redis",
    },
    turnstile: {
      enabled: features.turnstile,
      provider: "Cloudflare Turnstile",
    },
    admin: {
      enabled: Boolean(env.ADMIN_EMAILS || env.ADMIN_SESSION_SECRET),
      emails: env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) ?? [],
    },
    sentry: {
      enabled: Boolean(env.SENTRY_DSN),
      dsn: env.SENTRY_DSN ? "[configured]" : "[not configured]",
    },
  } as const;
}

/**
 * Log environment configuration (safe for production)
 * Only logs non-sensitive values and feature availability
 */
export function logEnvConfig(context: string = "app-startup") {
  const status = getEnvStatus();

  const message = [
    `[env] Configuration loaded (${context}):`,
    `  • Supabase: ${status.supabase.configured ? "✅" : "❌"}`,
    `  • Email: ${status.email.enabled ? "✅" : "⚠️  (disabled)"}`,
    `  • Rate Limiting: ${status.ratelimit.enabled ? "✅" : "⚠️  (disabled)"}`,
    `  • CAPTCHA: ${status.turnstile.enabled ? "✅" : "⚠️  (disabled)"}`,
    `  • Admin Auth: ${status.admin.enabled ? "✅" : "⚠️  (disabled)"}`,
    `  • Error Tracking: ${status.sentry.enabled ? "✅" : "⚠️  (disabled)"}`,
  ].join("\n");

  console.log(message);
}

/**
 * Validate that a feature is available before using it
 * Returns true if all required variables for a feature are configured
 */
export function isFeatureEnabled(
  feature: keyof typeof features
): feature is keyof typeof features {
  return features[feature] === true;
}

/**
 * Get feature availability status with helpful error message
 */
export function getFeatureStatus(feature: keyof typeof features) {
  const enabled = isFeatureEnabled(feature);

  const statusMap = {
    email: {
      name: "Email Service",
      requires: ["RESEND_API_KEY", "EMAIL_FROM"],
      docs: "docs/ENV_MANAGEMENT.md#resend-email-optional",
    },
    ratelimit: {
      name: "Rate Limiting",
      requires: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
      docs: "docs/ENV_MANAGEMENT.md#upstash-redis-rate-limiting-optional",
    },
    turnstile: {
      name: "CAPTCHA Protection",
      requires: ["TURNSTILE_SECRET_KEY", "NEXT_PUBLIC_TURNSTILE_SITE_KEY"],
      docs: "docs/ENV_MANAGEMENT.md#cloudflare-turnstile-captcha-optional",
    },
  } as const;

  const info = statusMap[feature] ?? { name: feature, requires: [], docs: "" };

  return {
    enabled,
    feature: info.name,
    requires: info.requires,
    missingVariables: enabled
      ? []
      : info.requires.filter((v) => !(v in process.env)),
    setupDocs: info.docs,
  };
}

/**
 * Safe pattern for logging missing optional features
 * Call once during app initialization
 */
export function warnAboutDisabledFeatures() {
  const featuresToCheck: (keyof typeof features)[] = [
    "email",
    "ratelimit",
    "turnstile",
  ];

  for (const feature of featuresToCheck) {
    if (!isFeatureEnabled(feature)) {
      const status = getFeatureStatus(feature);
      console.warn(
        `[env] ${status.feature} is disabled. Missing: ${status.missingVariables.join(", ")}`
      );
    }
  }
}

/**
 * Type-safe environment variable getter with optional fallback
 *
 * Usage:
 *   const apiKey = getEnvOr('RESEND_API_KEY', '');
 *   if (!apiKey) {
 *     console.warn('Email service not configured');
 *   }
 */
export function getEnvOr<K extends keyof typeof env>(
  key: K,
  fallback: typeof env[K]
): typeof env[K] {
  return env[key] ?? fallback;
}

/**
 * Export type for environment status (useful for type checking)
 */
export type EnvStatus = ReturnType<typeof getEnvStatus>;
export type FeatureStatus = ReturnType<typeof getFeatureStatus>;

export { env, features };
