// =============================================================
// SC Security Summit 2026 — env var spec (single source of truth)
//
// Shared by:
//   - scripts/check-env.mjs        (prebuild validation)
//   - scripts/push-env-to-vercel.mjs (sync .env.local → Vercel)
//
// When you add a new env var, edit ONLY this file. Both scripts pick it up.
// =============================================================

// Vars required in every build, including local `npm run build`.
export const ALWAYS_REQUIRED = [
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    pattern: /^https:\/\/[a-z0-9-]+\.supabase\.co$/,
    hint: "Supabase project URL (Settings → API)",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    minLength: 40,
    hint: "Supabase anon key (Settings → API)",
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    minLength: 40,
    hint: "Supabase service_role key (Settings → API). NEVER expose to browser.",
  },
  {
    name: "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    minLength: 10,
    hint: "Cloudflare Turnstile site key (dash.cloudflare.com)",
  },
  {
    name: "TURNSTILE_SECRET_KEY",
    minLength: 10,
    hint: "Cloudflare Turnstile secret key",
  },
  {
    name: "CONTACT_EMAIL",
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    hint: "Organizer email shown to users on errors",
  },
  {
    name: "NEXT_PUBLIC_SITE_URL",
    pattern: /^https?:\/\/[^\s/]+$/,
    hint: "Canonical site URL, no trailing slash",
  },
];

// Vars required only in production-like builds (Vercel preview/prod, or
// NODE_ENV=production). Local dev builds can omit these without failure.
export const PROD_REQUIRED = [
  {
    name: "UPSTASH_REDIS_REST_URL",
    pattern: /^https:\/\/[a-z0-9-]+\.upstash\.io$/,
    hint: "Upstash Redis REST URL (required for distributed rate limiting)",
  },
  {
    name: "UPSTASH_REDIS_REST_TOKEN",
    minLength: 20,
    hint: "Upstash Redis REST token",
  },
  {
    name: "RESEND_API_KEY",
    pattern: /^re_[A-Za-z0-9_-]+$/,
    hint: "Resend API key (resend.com → API Keys)",
  },
];

// Optional vars: pushed to Vercel by the sync script if present in .env.local,
// but not required by check-env. Listed here so the sync script knows the
// full universe of vars it should mirror.
export const OPTIONAL = [
  { name: "EMAIL_FROM", hint: "Verified Resend sender (defaults to hola@scsecuritysummit.com.mx)" },
  { name: "ADMIN_EMAILS", hint: "CSV allow-list for /admin (falls back to CONTACT_EMAIL)" },
  { name: "ADMIN_SESSION_SECRET", hint: "≥32 chars; signs admin magic-link tokens and cookies" },
  { name: "SENTRY_DSN", hint: "Sentry server DSN (SDK no-ops when unset)" },
  { name: "NEXT_PUBLIC_SENTRY_DSN", hint: "Sentry browser DSN" },
  { name: "SENTRY_ORG", hint: "Sentry org slug (only for Vercel source-map upload)" },
  { name: "SENTRY_PROJECT", hint: "Sentry project slug (only for Vercel source-map upload)" },
  { name: "SENTRY_AUTH_TOKEN", hint: "Sentry auth token with project:releases scope" },
];

// Common placeholder values that mean the var was set to the example default.
export const PLACEHOLDER_VALUES = [
  "TU_PROJECT_REF",
  "TU_INSTANCE",
  "TU_TOKEN_AQUI",
  "PLACEHOLDER",
  "re_PLACEHOLDER",
  "1x00000000000000000000AA",
  "1x0000000000000000000000000000000AA",
];

export function checkVar({ name, pattern, minLength, hint }, env = process.env) {
  const value = env[name];
  if (!value) {
    return { ok: false, name, reason: "missing", hint };
  }
  if (PLACEHOLDER_VALUES.some((p) => value.includes(p))) {
    return { ok: false, name, reason: "placeholder value not replaced", hint };
  }
  if (pattern && !pattern.test(value)) {
    return { ok: false, name, reason: `does not match expected format ${pattern}`, hint };
  }
  if (minLength && value.length < minLength) {
    return {
      ok: false,
      name,
      reason: `too short (got ${value.length}, expected ≥${minLength})`,
      hint,
    };
  }
  return { ok: true, name };
}
