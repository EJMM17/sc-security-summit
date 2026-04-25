#!/usr/bin/env node
// =============================================================
// SC Security Summit 2026 — env validation
// Runs as `prebuild` hook. Fails the build if required environment
// variables are missing or obviously placeholder values.
//
// Skip with: SKIP_ENV_VALIDATION=1 npm run build
// =============================================================

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

if (process.env.SKIP_ENV_VALIDATION === "1") {
  console.warn("[check-env] SKIP_ENV_VALIDATION=1 → skipping validation");
  process.exit(0);
}

// Load .env.local for local builds. Vercel/CI inject vars directly into
// process.env, so this only matters when a developer runs `npm run build`.
const envFile = resolve(projectRoot, ".env.local");
if (existsSync(envFile)) {
  const lines = readFileSync(envFile, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

// In Vercel, VERCEL_ENV is "production" | "preview" | "development".
// Treat preview as production for required-vars purposes (real users hit it).
const isProductionLike =
  process.env.VERCEL_ENV === "production" ||
  process.env.VERCEL_ENV === "preview" ||
  process.env.NODE_ENV === "production";

// Vars required in every build, including local `npm run build`.
const ALWAYS_REQUIRED = [
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

// Vars required only in production-like builds (Vercel preview/prod, or NODE_ENV=production).
// Local dev builds can omit these without failure but get a warning.
const PROD_REQUIRED = [
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

// Common placeholder values that mean the var was set to the example default.
const PLACEHOLDER_VALUES = [
  "TU_PROJECT_REF",
  "TU_INSTANCE",
  "TU_TOKEN_AQUI",
  "PLACEHOLDER",
  "re_PLACEHOLDER",
  "1x00000000000000000000AA",
  "1x0000000000000000000000000000000AA",
];

function checkVar({ name, pattern, minLength, hint }) {
  const value = process.env[name];
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
    return { ok: false, name, reason: `too short (got ${value.length}, expected ≥${minLength})`, hint };
  }
  return { ok: true, name };
}

const errors = [];
const warnings = [];

for (const spec of ALWAYS_REQUIRED) {
  const result = checkVar(spec);
  if (!result.ok) errors.push(result);
}

for (const spec of PROD_REQUIRED) {
  const result = checkVar(spec);
  if (!result.ok) {
    if (isProductionLike) errors.push(result);
    else warnings.push(result);
  }
}

if (warnings.length > 0) {
  console.warn("\n⚠ [check-env] Production-only vars missing (OK in local dev build):");
  for (const w of warnings) {
    console.warn(`  • ${w.name}: ${w.reason}`);
    if (w.hint) console.warn(`    → ${w.hint}`);
  }
}

if (errors.length > 0) {
  console.error("\n✖ [check-env] Build aborted. Fix these env vars:\n");
  for (const e of errors) {
    console.error(`  • ${e.name}: ${e.reason}`);
    if (e.hint) console.error(`    → ${e.hint}`);
  }
  console.error("\nSet variables in:");
  console.error("  • Local:  .env.local (copy from .env.local.example)");
  console.error("  • Vercel: Project Settings → Environment Variables");
  console.error("\nTo bypass for emergency builds: SKIP_ENV_VALIDATION=1 npm run build\n");
  process.exit(1);
}

console.log("✓ [check-env] All required environment variables present");
