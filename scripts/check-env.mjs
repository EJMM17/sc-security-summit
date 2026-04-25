#!/usr/bin/env node
// =============================================================
// SC Security Summit 2026 — env validation
// Runs as `prebuild` hook. Validates env vars and warns by default;
// strict fail-fast behavior is opt-in with ENFORCE_ENV_VALIDATION=1.
//
// Skip with: SKIP_ENV_VALIDATION=1 npm run build
// =============================================================

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ALWAYS_REQUIRED, PROD_REQUIRED, checkVar } from "./env-spec.mjs";

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
// Default mode is non-blocking (warnings only) to keep deployments moving.
// Opt-in strict mode with ENFORCE_ENV_VALIDATION=1.
const isVercel = Boolean(process.env.VERCEL);
const shouldFailBuild = process.env.ENFORCE_ENV_VALIDATION === "1";

const errors = [];
const warnings = [];

for (const spec of ALWAYS_REQUIRED) {
  const result = checkVar(spec);
  if (!result.ok) {
    if (shouldFailBuild) errors.push(result);
    else warnings.push(result);
  }
}

for (const spec of PROD_REQUIRED) {
  const result = checkVar(spec);
  if (!result.ok) {
    if (shouldFailBuild) errors.push(result);
    else warnings.push(result);
  }
}

if (warnings.length > 0) {
  console.warn("\n⚠ [check-env] Missing env vars detected:");
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

  if (isVercel) {
    // The build is running on Vercel — the env vars must be set in the
    // project. Point the operator at the dashboard and the CLI helper.
    const project = process.env.VERCEL_PROJECT_NAME || process.env.VERCEL_PROJECT_ID || "<project>";
    console.error("\nHow to fix on Vercel:");
    console.error(`  1) Vercel Dashboard → Project (${project}) → Settings → Environment Variables`);
    console.error("     Add each missing var for Production AND Preview (and Development if used).");
    console.error("  2) OR sync from a local .env.local in one shot:");
    console.error("       npm i -g vercel && vercel link && npm run vercel:env:push");
    console.error("  3) Re-deploy (Deployments → ⋯ → Redeploy, or push a new commit).");
    console.error("\nIf you need to force strict checks in Preview, set ENFORCE_ENV_VALIDATION=1.");
    console.error("\nSee docs/DEPLOYMENT.md for the full checklist.");
  } else {
    console.error("\nHow to fix locally:");
    console.error("  1) cp .env.local.example .env.local   # if you haven't already");
    console.error("  2) Fill in real values for the vars listed above.");
    console.error("\nHow to fix on Vercel (next deploy):");
    console.error("  npm i -g vercel && vercel link && npm run vercel:env:push");
    console.error("  (or set them manually in Vercel Dashboard → Settings → Environment Variables)");
  }

  console.error("\nTo bypass for emergency builds: SKIP_ENV_VALIDATION=1 npm run build\n");
  process.exit(1);
}

if (warnings.length > 0 && !shouldFailBuild) {
  console.warn("\n[check-env] Build continues because this is not a production deployment.");
  if (isVercel) {
    console.warn(
      "[check-env] For production-grade validation in Preview, set ENFORCE_ENV_VALIDATION=1 in Vercel env vars."
    );
  }
  console.log("✓ [check-env] Validation completed with warnings");
} else {
  console.log("✓ [check-env] All required environment variables present");
}
