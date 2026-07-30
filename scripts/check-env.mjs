#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ENV_GROUP_RULES,
  ENV_SPEC,
  renderEnvTemplate,
} from "./env-spec.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const templatePath = resolve(projectRoot, ".env.local.example");
const legacyTemplatePath = resolve(projectRoot, ".env.example");
const localEnvPath = resolve(projectRoot, ".env.local");
const args = new Set(process.argv.slice(2));
const targetArgument = [...args].find((argument) =>
  argument.startsWith("--target="),
);
const explicitTarget = targetArgument?.slice("--target=".length);
const allowedTargets = new Set(["local", "development", "preview", "production"]);

function normalizeNewlines(value) {
  return value.replace(/\r\n/g, "\n");
}

function parseEnvText(text) {
  const values = new Map();
  const duplicates = [];

  for (const rawLine of normalizeNewlines(text).split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equalsIndex = line.indexOf("=");
    if (equalsIndex < 1) continue;

    const name = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }

    if (values.has(name)) duplicates.push(name);
    values.set(name, value);
  }

  return { values, duplicates };
}

function validateContract() {
  const errors = [];
  const allowedScopes = new Set(["public", "server"]);
  const names = new Set();

  for (const variable of ENV_SPEC) {
    if (names.has(variable.name)) {
      errors.push(`duplicate variable in env spec: ${variable.name}`);
    }
    names.add(variable.name);

    if (!/^[A-Z][A-Z0-9_]*$/.test(variable.name)) {
      errors.push(`invalid variable name: ${variable.name}`);
    }
    if (!allowedScopes.has(variable.scope)) {
      errors.push(`${variable.name}: scope must be public or server`);
    }
    if (variable.scope === "public" && !variable.name.startsWith("NEXT_PUBLIC_")) {
      errors.push(`${variable.name}: public variables must start with NEXT_PUBLIC_`);
    }
    if (variable.scope === "server" && variable.name.startsWith("NEXT_PUBLIC_")) {
      errors.push(`${variable.name}: server variables cannot start with NEXT_PUBLIC_`);
    }
    if (variable.secret && variable.scope !== "server") {
      errors.push(`${variable.name}: a secret cannot have public scope`);
    }
    for (const property of [
      "secret",
      "runtimeRequired",
      "previewRequired",
      "productionRequired",
      "placeholderAllowed",
    ]) {
      if (typeof variable[property] !== "boolean") {
        errors.push(`${variable.name}: ${property} must be boolean`);
      }
    }
    if (!variable.format || !variable.description || !variable.group) {
      errors.push(`${variable.name}: format, description, and group are required`);
    }
    if (!Array.isArray(variable.placeholders)) {
      errors.push(`${variable.name}: placeholders must be an array`);
    }
    if (variable.secret && variable.templateValue !== "") {
      errors.push(`${variable.name}: secret template values must be empty`);
    }
  }

  for (const rule of ENV_GROUP_RULES) {
    for (const name of rule.names) {
      if (!names.has(name)) {
        errors.push(`group rule references unknown variable: ${name}`);
      }
    }
  }

  if (existsSync(legacyTemplatePath)) {
    errors.push(
      ".env.example must not exist; .env.local.example is the only committed template",
    );
  }

  if (!existsSync(templatePath)) {
    errors.push(".env.local.example is missing");
  } else {
    const actualTemplate = normalizeNewlines(readFileSync(templatePath, "utf8"));
    const expectedTemplate = renderEnvTemplate();
    const { values, duplicates } = parseEnvText(actualTemplate);
    const expectedNames = ENV_SPEC.map(({ name }) => name);
    const actualNames = [...values.keys()];

    for (const duplicate of duplicates) {
      errors.push(`.env.local.example contains ${duplicate} more than once`);
    }
    for (const name of expectedNames.filter((name) => !values.has(name))) {
      errors.push(`.env.local.example is missing ${name}`);
    }
    for (const name of actualNames.filter((name) => !names.has(name))) {
      errors.push(`.env.local.example contains unknown variable ${name}`);
    }
    if (actualTemplate !== expectedTemplate) {
      errors.push(
        ".env.local.example is not generated from scripts/env-spec.mjs (run `node scripts/check-env.mjs --print-template` to inspect the expected content)",
      );
    }
  }

  return errors;
}

function loadLocalEnv() {
  if (!existsSync(localEnvPath)) return;

  const { values } = parseEnvText(readFileSync(localEnvPath, "utf8"));
  for (const [name, value] of values) {
    if (!(name in process.env)) process.env[name] = value;
  }
}

function isPresent(name) {
  return (process.env[name] ?? "").trim().length > 0;
}

function isHttpUrl(value, requireHttps = false) {
  try {
    const url = new URL(value);
    if (url.username || url.password) return false;
    return requireHttps
      ? url.protocol === "https:"
      : url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidFormat(variable, value, target) {
  switch (variable.format) {
    case "boolean-flag":
      return value === "0" || value === "1";
    case "canonical-https-url":
      if (!isHttpUrl(value, true) || value.endsWith("/")) return false;
      try {
        const url = new URL(value);
        return url.pathname === "/" && !url.search && !url.hash;
      } catch {
        return false;
      }
    case "cron-secret":
      return /^[A-Za-z0-9_-]{32,}$/.test(value);
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case "email-sender":
      return (
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ||
        /^.{1,100}\s<[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+>$/.test(value)
      );
    case "ga-id":
      return /^G-[A-Z0-9]{6,20}$/.test(value);
    case "gtm-id":
      return /^GTM-[A-Z0-9]{4,20}$/.test(value);
    case "https-url":
      return isHttpUrl(value, true);
    case "integer-1-25": {
      const number = Number(value);
      return Number.isInteger(number) && number >= 1 && number <= 25;
    }
    case "numeric-id":
      return /^\d{3,30}$/.test(value);
    case "resend-key":
      return /^re_[A-Za-z0-9_-]{8,}$/.test(value);
    case "slug":
      return /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,99}$/.test(value);
    case "supabase-secret":
      if (target === "preview" || target === "production") {
        return /^sb_secret_[A-Za-z0-9_-]{16,}$/.test(value);
      }
      return (
        /^sb_secret_[A-Za-z0-9_-]{16,}$/.test(value) ||
        /^eyJ[A-Za-z0-9._-]{20,}$/.test(value)
      );
    case "supabase-url":
      if (!isHttpUrl(value)) return false;
      try {
        const url = new URL(value);
        return (
          url.protocol === "https:" ||
          ["localhost", "127.0.0.1", "::1"].includes(url.hostname)
        );
      } catch {
        return false;
      }
    case "token":
      return value.length >= 16 && !/\s/.test(value);
    case "url":
      return isHttpUrl(value);
    default:
      return false;
  }
}

function isPlaceholder(variable, value) {
  if (variable.placeholderAllowed) return false;
  const normalized = value.trim().toLowerCase();
  return variable.placeholders.some(
    (placeholder) => normalized === placeholder.toLowerCase(),
  );
}

function describeFormat(format) {
  const descriptions = {
    "boolean-flag": "0 or 1",
    "canonical-https-url":
      "an HTTPS origin without path, query, hash, or trailing slash",
    "cron-secret": "at least 32 URL-safe random characters",
    email: "an email address",
    "email-sender": "an email address or Name <email> sender",
    "ga-id": "a GA4 ID such as G-ABC1234567",
    "gtm-id": "a GTM ID such as GTM-ABC1234",
    "https-url": "an HTTPS URL",
    "integer-1-25": "an integer from 1 to 25",
    "numeric-id": "a numeric identifier",
    "resend-key": "a Resend key beginning with re_",
    slug: "a non-empty slug",
    "supabase-secret":
      "an sb_secret_ key (local development also accepts a local JWT)",
    "supabase-url": "an HTTPS URL or a localhost URL",
    token: "a non-whitespace token of at least 16 characters",
    url: "an HTTP(S) URL",
  };
  return descriptions[format] ?? format;
}

function targetEnvironment() {
  if (process.env.VERCEL === "1") {
    if (process.env.VERCEL_ENV === "preview") return "preview";
    if (process.env.VERCEL_ENV === "production") return "production";
    return "development";
  }
  if (explicitTarget) return explicitTarget;
  return "local";
}

function validateRuntime() {
  const target = targetEnvironment();
  const strictRequested = process.env.ENFORCE_ENV_VALIDATION === "1";
  const strict =
    strictRequested || target === "preview" || target === "production";
  const errors = [];
  const warnings = [];

  if (
    (target === "preview" || target === "production") &&
    process.env.ENFORCE_ENV_VALIDATION !== "1"
  ) {
    errors.push(
      `ENFORCE_ENV_VALIDATION must be 1 on Vercel ${target}; configure it in that Vercel environment and redeploy`,
    );
  }

  for (const variable of ENV_SPEC) {
    const value = (process.env[variable.name] ?? "").trim();
    const required =
      (target === "preview" && variable.previewRequired) ||
      (target === "production" && variable.productionRequired) ||
      ((target === "local" || target === "development") &&
        variable.runtimeRequired);

    if (!value) {
      if (required) {
        const message = `${variable.name} is required for ${target}`;
        (strict ? errors : warnings).push(message);
      }
      continue;
    }

    if (isPlaceholder(variable, value)) {
      const message = `${variable.name} still contains a forbidden placeholder`;
      (strict ? errors : warnings).push(message);
      continue;
    }

    if (!isValidFormat(variable, value, target)) {
      const message = `${variable.name} must be ${describeFormat(variable.format)}`;
      (strict ? errors : warnings).push(message);
    }
  }

  for (const rule of ENV_GROUP_RULES) {
    const present = rule.names.filter(isPresent);
    if (present.length > 0 && present.length < rule.names.length) {
      const missing = rule.names.filter((name) => !present.includes(name));
      const message = `${rule.description} Missing: ${missing.join(", ")}`;
      (strict ? errors : warnings).push(message);
    }
  }

  return { errors, warnings, strict, target };
}

function printMessages(label, messages, writer) {
  if (messages.length === 0) return;
  writer(`\n${label}`);
  for (const message of messages) writer(`  - ${message}`);
}

const contractErrors = validateContract();
if (args.has("--print-template")) {
  process.stdout.write(renderEnvTemplate());
  process.exit(0);
}

if (explicitTarget && !allowedTargets.has(explicitTarget)) {
  console.error(
    `[check-env] Invalid target "${explicitTarget}". Use local, development, preview, or production.`,
  );
  process.exit(1);
}

if (contractErrors.length > 0) {
  printMessages("[env:contract] Contract errors:", contractErrors, console.error);
  process.exit(1);
}

if (args.has("--contract")) {
  console.log(
    `[env:contract] OK: ${ENV_SPEC.length} variables; .env.local.example is synchronized`,
  );
  process.exit(0);
}

const skipRequested = process.env.SKIP_ENV_VALIDATION === "1";
if (skipRequested) {
  if (process.env.VERCEL === "1") {
    console.error(
      "[check-env] SKIP_ENV_VALIDATION is forbidden on Vercel Preview and Production.",
    );
    process.exit(1);
  }
  if (process.env.GITHUB_ACTIONS !== "true") {
    console.error(
      "[check-env] SKIP_ENV_VALIDATION is reserved for the GitHub Actions build step.",
    );
    process.exit(1);
  }

  console.warn(
    "[check-env] Runtime values skipped for this GitHub Actions build; the environment contract was still validated.",
  );
  process.exit(0);
}

loadLocalEnv();
const result = validateRuntime();
printMessages("[check-env] Warnings:", result.warnings, console.warn);
printMessages("[check-env] Errors:", result.errors, console.error);

if (result.errors.length > 0) {
  console.error(
    "\n[check-env] Validation failed. Configure the missing values in the correct Vercel environment; do not copy Production secrets into GitHub Actions.",
  );
  process.exit(1);
}

console.log(
  `[check-env] OK (${result.strict ? "strict" : "warning-only"}; target=${result.target})`,
);
