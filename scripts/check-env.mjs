#!/usr/bin/env node
// =============================================================
// SC Security Summit 2026 — prebuild env validation
//
// Defaults to warning-only so builds can proceed when optional
// integrations are not configured.
//
// Strict mode: ENFORCE_ENV_VALIDATION=1 npm run build
// Bypass completely: SKIP_ENV_VALIDATION=1 npm run build
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

const strictValidation = process.env.ENFORCE_ENV_VALIDATION === "1";

// Load .env.local for local builds. Vercel injects vars directly.
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

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const RECOMMENDED = [
  "ADMIN_SESSION_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "CONTACT_EMAIL",
];

const isMissing = (name) => !process.env[name] || process.env[name].trim().length === 0;

const RESEND_PLACEHOLDERS = new Set(["re_PLACEHOLDER", "re_xxxxxxxxxxxxxxxxx"]);
const resendKey = (process.env.RESEND_API_KEY ?? "").trim();
// "unusable" = absent OR still a placeholder. Confirmation emails won't send.
const resendUnusable = resendKey.length === 0 || RESEND_PLACEHOLDERS.has(resendKey);

const missingRequired = REQUIRED.filter(isMissing);
const missingRecommended = RECOMMENDED.filter(isMissing);

const shortSecret =
  process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_SESSION_SECRET.length < 32;

if (strictValidation && shortSecret) {
  console.error("✖ [check-env] ADMIN_SESSION_SECRET must be at least 32 characters");
  process.exit(1);
}

if (strictValidation && missingRequired.length > 0) {
  console.error("\n✖ [check-env] Build aborted. Missing required env vars:");
  for (const name of missingRequired) console.error(`  • ${name}`);
  console.error("\nBypass for emergency builds: SKIP_ENV_VALIDATION=1 npm run build\n");
  process.exit(1);
}

if (missingRequired.length > 0) {
  console.warn("\n⚠ [check-env] Missing baseline env vars:");
  for (const name of missingRequired) console.warn(`  • ${name}`);
  console.warn(
    "[check-env] Build will continue (warning-only mode). Set ENFORCE_ENV_VALIDATION=1 to fail on missing vars.",
  );
}

if (missingRecommended.length > 0) {
  console.warn("\n⚠ [check-env] Missing optional/recommended env vars:");
  for (const name of missingRecommended) console.warn(`  • ${name}`);
}

if (!strictValidation && shortSecret) {
  console.warn("\n⚠ [check-env] ADMIN_SESSION_SECRET is set but shorter than 32 characters");
}

if (resendUnusable) {
  const detail = resendKey.length === 0 ? "not set" : "still a placeholder";
  if (strictValidation) {
    console.error(
      `\n✖ [check-env] RESEND_API_KEY is ${detail}. Registration confirmation emails will NOT be sent.`,
    );
    console.error("  Set a real Resend API key (Vercel: Production + Preview) and redeploy.");
    console.error("  Bypass for emergency builds: SKIP_ENV_VALIDATION=1 npm run build\n");
    process.exit(1);
  }
  console.warn(
    `\n⚠ [check-env] RESEND_API_KEY is ${detail} → registration confirmation emails will NOT be sent`,
  );
  console.warn(
    "  Registrations still succeed and are audited as skipped_no_api_key in email_events.",
  );
}

console.log(
  `✓ [check-env] Validation complete${strictValidation ? " (strict mode)" : " (warning-only mode)"}`,
);
