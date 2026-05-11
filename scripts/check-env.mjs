#!/usr/bin/env node
// =============================================================
// SC Security Summit 2026 — prebuild env validation
// Aborts the build when one of the Supabase keys is missing.
// Bypass with: SKIP_ENV_VALIDATION=1 npm run build
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

const missing = REQUIRED.filter((name) => !process.env[name] || process.env[name].trim().length === 0);

if (missing.length > 0) {
  console.error("\n✖ [check-env] Build aborted. Missing required env vars:");
  for (const name of missing) console.error(`  • ${name}`);
  console.error("\nBypass for emergency builds: SKIP_ENV_VALIDATION=1 npm run build\n");
  process.exit(1);
}

console.log("✓ [check-env] All required environment variables present");
