#!/usr/bin/env node
// =============================================================
// SC Security Summit 2026 — sync .env.local → Vercel
//
// Reads .env.local and pushes every var to the linked Vercel project
// using the Vercel CLI (`vercel env add`). Idempotent: existing values
// are removed first so we always push the current local value.
//
// Usage:
//   npm i -g vercel
//   vercel link              # one-time: links cwd to a Vercel project
//   npm run vercel:env:push  # pushes to production + preview by default
//
// Flags (forwarded as CLI args to this script):
//   --target=production,preview,development  (default: production,preview)
//   --dry-run                                 (print actions, don't call vercel)
//   --only=NAME1,NAME2                        (push only these vars)
//
// Why this exists:
//   The Vercel build runs `npm run prebuild → check-env.mjs`, which fails
//   the build if required vars are missing. Setting 8+ vars one-by-one in
//   the dashboard is error-prone — copy/paste typos are how this fails. This
//   script makes the local `.env.local` the single source of truth for a
//   deploy: edit once, sync once, deploy.
// =============================================================

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  ALWAYS_REQUIRED,
  PROD_REQUIRED,
  OPTIONAL,
  PLACEHOLDER_VALUES,
} from "./env-spec.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

// ---------- args ----------
const args = process.argv.slice(2);
const flag = (name) => {
  const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  const eq = hit.indexOf("=");
  return eq === -1 ? true : hit.slice(eq + 1);
};

const dryRun = flag("dry-run") === true;
const targetsArg = flag("target");
const targets = (typeof targetsArg === "string" ? targetsArg : "production,preview")
  .split(",")
  .map((t) => t.trim())
  .filter(Boolean);
const onlyArg = flag("only");
const onlySet = typeof onlyArg === "string"
  ? new Set(onlyArg.split(",").map((s) => s.trim()).filter(Boolean))
  : null;

const VALID_TARGETS = new Set(["production", "preview", "development"]);
for (const t of targets) {
  if (!VALID_TARGETS.has(t)) {
    console.error(`✖ invalid --target value "${t}". Valid: production, preview, development`);
    process.exit(2);
  }
}

// ---------- preconditions ----------
const envFile = resolve(projectRoot, ".env.local");
if (!existsSync(envFile)) {
  console.error("✖ .env.local not found.");
  console.error("  Run: cp .env.local.example .env.local  and fill in real values first.");
  process.exit(2);
}

const vercelProjectFile = resolve(projectRoot, ".vercel", "project.json");
if (!existsSync(vercelProjectFile) && !dryRun) {
  console.error("✖ This project is not linked to Vercel yet.");
  console.error("  Run:  vercel link");
  console.error("  (Install the CLI first if needed:  npm i -g vercel)");
  process.exit(2);
}

// ---------- parse .env.local ----------
const envLocal = {};
for (const rawLine of readFileSync(envFile, "utf8").split("\n")) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#")) continue;
  const eq = line.indexOf("=");
  if (eq === -1) continue;
  const key = line.slice(0, eq).trim();
  let value = line.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  envLocal[key] = value;
}

// ---------- decide which vars to push ----------
const knownVars = [...ALWAYS_REQUIRED, ...PROD_REQUIRED, ...OPTIONAL];
const toPush = [];
const skipped = [];

for (const spec of knownVars) {
  if (onlySet && !onlySet.has(spec.name)) continue;
  const value = envLocal[spec.name];

  if (value === undefined || value === "") {
    skipped.push({ name: spec.name, reason: "not set in .env.local" });
    continue;
  }
  if (PLACEHOLDER_VALUES.some((p) => value.includes(p))) {
    skipped.push({ name: spec.name, reason: "still a placeholder value" });
    continue;
  }
  toPush.push({ name: spec.name, value });
}

if (toPush.length === 0) {
  console.error("✖ Nothing to push. Check .env.local has real (non-placeholder) values.");
  process.exit(2);
}

console.log(`\n→ Pushing ${toPush.length} var(s) to Vercel target(s): ${targets.join(", ")}`);
if (dryRun) console.log("  (dry-run — no changes will be made)");
console.log("  Vars:", toPush.map((v) => v.name).join(", "));
if (skipped.length > 0) {
  console.log(
    "  Skipped:",
    skipped.map((s) => `${s.name} (${s.reason})`).join(", "),
  );
}
console.log("");

// ---------- run vercel CLI ----------
function runVercel(cliArgs, { input } = {}) {
  if (dryRun) {
    const display = ["vercel", ...cliArgs].join(" ");
    console.log(`  $ ${display}${input ? "   (stdin: <value>)" : ""}`);
    return { status: 0, stdout: "", stderr: "" };
  }
  const res = spawnSync("vercel", cliArgs, {
    cwd: projectRoot,
    input,
    encoding: "utf8",
  });
  if (res.error) {
    if (res.error.code === "ENOENT") {
      console.error("✖ `vercel` CLI not found. Install with:  npm i -g vercel");
      process.exit(2);
    }
    throw res.error;
  }
  return res;
}

let pushed = 0;
let failed = 0;

for (const { name, value } of toPush) {
  for (const target of targets) {
    process.stdout.write(`  • ${name} → ${target} ... `);

    // Remove existing value first so `add` doesn't prompt about overwrite.
    // `vercel env rm` returns nonzero when the var doesn't exist, which is
    // fine — we just want a clean slate.
    runVercel(["env", "rm", name, target, "--yes"]);

    const addRes = runVercel(["env", "add", name, target], { input: `${value}\n` });
    if (addRes.status === 0) {
      console.log("ok");
      pushed++;
    } else {
      console.log("FAILED");
      if (addRes.stderr) console.error(`      ${addRes.stderr.trim()}`);
      failed++;
    }
  }
}

console.log("");
console.log(`Done. Set: ${pushed}.  Failed: ${failed}.`);
if (failed === 0 && !dryRun) {
  console.log("Trigger a new deploy:  vercel --prod   (or push a commit)");
}
process.exit(failed === 0 ? 0 : 1);
