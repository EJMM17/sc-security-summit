import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";
import deploymentContract from "../config/deployment-contract.json";
import {
  ENV_FORBIDDEN_NAME_RULES,
  ENV_SPEC,
} from "../scripts/env-spec.mjs";

const projectRoot = path.resolve(__dirname, "..");
const checkEnvScript = path.join(projectRoot, "scripts", "check-env.mjs");
const productionSupabaseUrl =
  `https://${deploymentContract.supabaseProductionHost}`;
const systemEnvironmentNames = [
  "CI",
  "ENFORCE_ENV_VALIDATION",
  "GITHUB_ACTIONS",
  "NODE_ENV",
  "SKIP_ENV_VALIDATION",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_TARGET_ENV",
] as const;

type EnvironmentOverrides = Record<string, string | undefined>;

function runCheckEnv(
  overrides: EnvironmentOverrides,
  arguments_: string[] = [],
) {
  const environment: NodeJS.ProcessEnv = { ...process.env };

  for (const { name } of ENV_SPEC) {
    delete environment[name];
  }
  for (const name of systemEnvironmentNames) {
    delete environment[name];
  }
  for (const rule of ENV_FORBIDDEN_NAME_RULES) {
    if (rule.name) delete environment[rule.name];
    if (rule.prefix) {
      for (const name of Object.keys(environment)) {
        if (name.startsWith(rule.prefix)) delete environment[name];
      }
    }
  }

  for (const [name, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete environment[name];
    } else {
      environment[name] = value;
    }
  }

  const result = spawnSync(
    process.execPath,
    [checkEnvScript, "--no-local-env", ...arguments_],
    {
      cwd: projectRoot,
      encoding: "utf8",
      env: environment,
    },
  );

  return {
    status: result.status,
    output: `${result.stdout}${result.stderr}`,
  };
}

function vercelEnvironment(target: "preview" | "production") {
  return {
    NODE_ENV: "production",
    VERCEL: "1",
    VERCEL_ENV: target,
  };
}

const validProductionEnvironment = {
  ...vercelEnvironment("production"),
  CONTACT_EMAIL: "inquiries@example.com",
  CRON_SECRET: "abcdefghijklmnopqrstuvwxyzABCDEF",
  ENFORCE_ENV_VALIDATION: "1",
  NEXT_PUBLIC_SITE_URL: "https://scsecuritysummit.com",
  RESEND_API_KEY: "re_abcdefgh",
  SUPABASE_SECRET_KEY: "sb_secret_abcdefghijklmnop",
  SUPABASE_URL: productionSupabaseUrl,
  KV_REST_API_TOKEN: "abcdefghijklmnop",
  KV_REST_API_URL: "https://example.upstash.io",
};
const validSentryDsn =
  "https://0123456789abcdef0123456789abcdef@o4501234567890123.ingest.us.sentry.io/4501234567890123";

describe("check-env deployment targets", () => {
  it("declares hosted integrations and marketing IDs Production-only", () => {
    const productionRequired = new Set([
      "CONTACT_EMAIL",
      "CRON_SECRET",
      "RESEND_API_KEY",
      "KV_REST_API_TOKEN",
      "KV_REST_API_URL",
    ]);

    for (const name of [
      "CONTACT_EMAIL",
      "CRON_SECRET",
      "NEXT_PUBLIC_GA_MEASUREMENT_ID",
      "NEXT_PUBLIC_GTM_ID",
      "NEXT_PUBLIC_LINKEDIN_PARTNER_ID",
      "NEXT_PUBLIC_META_PIXEL_ID",
      "RESEND_API_KEY",
      "SENTRY_DSN",
      "NEXT_PUBLIC_SENTRY_DSN",
      "SENTRY_AUTH_TOKEN",
      "SENTRY_ORG",
      "SENTRY_PROJECT",
      "KV_REST_API_TOKEN",
      "KV_REST_API_URL",
    ]) {
      const variable = ENV_SPEC.find((candidate) => candidate.name === name);
      expect(variable?.forbiddenTargets).toEqual([
        "local",
        "development",
        "preview",
      ]);
      expect(variable?.productionRequired ?? false).toBe(
        productionRequired.has(name),
      );
    }
  });

  it("accepts a strict Vercel Preview without Production-only integrations", () => {
    const result = runCheckEnv(vercelEnvironment("preview"));

    expect(result.status).toBe(0);
    expect(result.output).toContain(
      "[check-env] OK (strict; target=preview)",
    );
  });

  it("rejects a partial Production-only integration in Preview", () => {
    const result = runCheckEnv({
      ...vercelEnvironment("preview"),
      KV_REST_API_URL: "https://example.upstash.io",
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain(
      "KV_REST_API_URL is forbidden for preview",
    );
    expect(result.output).toContain(
      "Upstash URL and token must be configured together.",
    );
    expect(result.output).toContain("KV_REST_API_TOKEN");
  });

  it("forbids every Production-only integration in Preview", () => {
    const result = runCheckEnv({
      ...vercelEnvironment("preview"),
      CONTACT_EMAIL: "inquiries@example.com",
      CRON_SECRET: "abcdefghijklmnopqrstuvwxyzABCDEF",
      EMAIL_FROM: "SC Security Summit <hola@scsecuritysummit.com>",
      RESEND_API_KEY: "re_abcdefgh",
      SENTRY_AUTH_TOKEN: "sntrys_abcdefghijklmnop",
      SENTRY_DSN: "https://public@example.ingest.sentry.io/123",
      NEXT_PUBLIC_SENTRY_DSN: "https://public@example.ingest.sentry.io/123",
      SENTRY_ORG: "summit-org",
      SENTRY_PROJECT: "summit-project",
      SUPABASE_SECRET_KEY: "sb_secret_abcdefghijklmnop",
      SUPABASE_URL: productionSupabaseUrl,
      KV_REST_API_TOKEN: "abcdefghijklmnop",
      KV_REST_API_URL: "https://example.upstash.io",
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain("SUPABASE_URL is forbidden for preview");
    expect(result.output).toContain(
      "SUPABASE_SECRET_KEY is forbidden for preview",
    );
    expect(result.output).toContain("CRON_SECRET is forbidden for preview");
    expect(result.output).toContain("RESEND_API_KEY is forbidden for preview");
    expect(result.output).toContain("CONTACT_EMAIL is forbidden for preview");
    expect(result.output).toContain("EMAIL_FROM is forbidden for preview");
    expect(result.output).toContain("SENTRY_DSN is forbidden for preview");
    expect(result.output).toContain(
      "NEXT_PUBLIC_SENTRY_DSN is forbidden for preview",
    );
    expect(result.output).toContain("SENTRY_AUTH_TOKEN is forbidden for preview");
    expect(result.output).toContain("SENTRY_ORG is forbidden for preview");
    expect(result.output).toContain("SENTRY_PROJECT is forbidden for preview");
    expect(result.output).toContain(
      "KV_REST_API_URL is forbidden for preview",
    );
    expect(result.output).toContain(
      "KV_REST_API_TOKEN is forbidden for preview",
    );
  });

  it("forbids Production marketing analytics in Preview", () => {
    const result = runCheckEnv({
      ...vercelEnvironment("preview"),
      NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-ABC1234567",
      NEXT_PUBLIC_GTM_ID: "GTM-ABC1234",
      NEXT_PUBLIC_LINKEDIN_PARTNER_ID: "123456",
      NEXT_PUBLIC_META_PIXEL_ID: "123456",
    });

    expect(result.status).toBe(1);
    for (const name of [
      "NEXT_PUBLIC_GA_MEASUREMENT_ID",
      "NEXT_PUBLIC_GTM_ID",
      "NEXT_PUBLIC_LINKEDIN_PARTNER_ID",
      "NEXT_PUBLIC_META_PIXEL_ID",
    ]) {
      expect(result.output).toContain(`${name} is forbidden for preview`);
    }
  });

  it("rejects retired Supabase variable names in Preview", () => {
    const result = runCheckEnv({
      ...vercelEnvironment("preview"),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy-anon-key",
      NEXT_PUBLIC_SUPABASE_URL: "https://legacy-project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "legacy-service-role-key",
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is forbidden for preview",
    );
    expect(result.output).toContain(
      "NEXT_PUBLIC_SUPABASE_URL is forbidden for preview",
    );
    expect(result.output).toContain(
      "SUPABASE_SERVICE_ROLE_KEY is forbidden for preview",
    );
  });

  it("rejects the retired manually managed Upstash variable names", () => {
    const result = runCheckEnv({
      ...validProductionEnvironment,
      UPSTASH_REDIS_REST_TOKEN: "retired-manual-token",
      UPSTASH_REDIS_REST_URL: "https://retired.upstash.io",
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain(
      "UPSTASH_REDIS_REST_URL is forbidden for production",
    );
    expect(result.output).toContain(
      "UPSTASH_REDIS_REST_TOKEN is forbidden for production",
    );
    expect(result.output).toContain("KV_REST_API_URL");
    expect(result.output).toContain("KV_REST_API_TOKEN");
  });

  it("rejects unused provider-managed Redis outputs outside Production", () => {
    const result = runCheckEnv({
      ...vercelEnvironment("preview"),
      KV_URL: "redis://default:secret@provider.example:6379",
      REDIS_URL: "rediss://default:secret@provider.example:6379",
      KV_REST_API_READ_ONLY_TOKEN: "read-only-secret",
    });

    expect(result.status).toBe(1);
    for (const name of [
      "KV_URL",
      "REDIS_URL",
      "KV_REST_API_READ_ONLY_TOKEN",
    ]) {
      expect(result.output).toContain(`${name} is forbidden for preview`);
    }
  });

  it("treats custom Vercel targets as disconnected Preview deployments", () => {
    const result = runCheckEnv({
      ...vercelEnvironment("preview"),
      SUPABASE_SECRET_KEY: "sb_secret_abcdefghijklmnop",
      SUPABASE_URL: productionSupabaseUrl,
      VERCEL_TARGET_ENV: "staging",
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain("SUPABASE_URL is forbidden for preview");
    expect(result.output).toContain("target=preview");
  });

  it("rejects a malformed optional sender in Production", () => {
    const result = runCheckEnv({
      ...validProductionEnvironment,
      EMAIL_FROM: "invalid",
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain(
      "EMAIL_FROM must be an email address or Name <email> sender",
    );
  });

  it("keeps Production strict when required integrations are absent", () => {
    const result = runCheckEnv({
      ...vercelEnvironment("production"),
      ENFORCE_ENV_VALIDATION: "1",
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain("SUPABASE_URL is required for production");
    expect(result.output).toContain(
      "KV_REST_API_TOKEN is required for production",
    );
    expect(result.output).toContain("CRON_SECRET is required for production");
  });

  it("rejects a non-Supabase HTTPS host in Production", () => {
    const result = runCheckEnv({
      ...validProductionEnvironment,
      SUPABASE_URL: "https://attacker.example.com",
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain(
      "SUPABASE_URL must be the exact root HTTPS URL configured for the Summit Supabase project",
    );
  });

  it("rejects hostile hosted service URLs in Production", () => {
    const maliciousSupabase = runCheckEnv({
      ...validProductionEnvironment,
      SUPABASE_URL: `${productionSupabaseUrl}:8443`,
    });
    const maliciousUpstash = runCheckEnv({
      ...validProductionEnvironment,
      KV_REST_API_URL: "https://example.upstash.io.attacker.test",
    });

    expect(maliciousSupabase.status).toBe(1);
    expect(maliciousSupabase.output).toContain(
      "SUPABASE_URL must be the exact root HTTPS URL configured for the Summit Supabase project",
    );
    expect(maliciousUpstash.status).toBe(1);
    expect(maliciousUpstash.output).toContain(
      "KV_REST_API_URL must be a root HTTPS URL on *.upstash.io",
    );
  });

  it("rejects a loopback Supabase URL in Production", () => {
    const result = runCheckEnv({
      ...validProductionEnvironment,
      SUPABASE_URL: "http://127.0.0.1:54321",
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain(
      "SUPABASE_URL must be the exact root HTTPS URL configured for the Summit Supabase project",
    );
  });

  it("rejects hosted Supabase during strict local validation", () => {
    const result = runCheckEnv(
      {
        ENFORCE_ENV_VALIDATION: "1",
        SUPABASE_SECRET_KEY: "sb_secret_abcdefghijklmnop",
        SUPABASE_URL: "https://project-ref.supabase.co",
      },
      ["--target=local"],
    );

    expect(result.status).toBe(1);
    expect(result.output).toContain(
      "SUPABASE_URL must be a root HTTP loopback URL for local Supabase",
    );
  });

  it("rejects a different Supabase project in Production", () => {
    const result = runCheckEnv({
      ...validProductionEnvironment,
      SUPABASE_URL: "https://different-project.supabase.co",
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain(
      "SUPABASE_URL must be the exact root HTTPS URL configured for the Summit Supabase project",
    );
  });

  it("accepts a complete Production environment", () => {
    const result = runCheckEnv(validProductionEnvironment);

    expect(result.status).toBe(0);
    expect(result.output).toContain(
      "[check-env] OK (strict; target=production)",
    );
  });

  it("accepts official Sentry DSNs in Production", () => {
    const result = runCheckEnv({
      ...validProductionEnvironment,
      SENTRY_DSN: validSentryDsn,
      NEXT_PUBLIC_SENTRY_DSN: validSentryDsn,
    });

    expect(result.status).toBe(0);
    expect(result.output).toContain(
      "[check-env] OK (strict; target=production)",
    );
  });

  it("rejects a partial Sentry runtime configuration", () => {
    const result = runCheckEnv({
      ...validProductionEnvironment,
      SENTRY_DSN: validSentryDsn,
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain(
      "Sentry server and browser DSNs must be configured together",
    );
    expect(result.output).toContain("NEXT_PUBLIC_SENTRY_DSN");
  });

  it.each([
    "http://0123456789abcdef0123456789abcdef@o1.ingest.sentry.io/1",
    "https://user:password@o1.ingest.sentry.io/1",
    "https://0123456789abcdef0123456789abcdef@attacker.example/1",
    "https://0123456789abcdef0123456789abcdef@o1.ingest.sentry.io/path",
  ])("rejects a hostile or malformed Sentry DSN: %s", (dsn) => {
    const result = runCheckEnv({
      ...validProductionEnvironment,
      SENTRY_DSN: dsn,
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain(
      "SENTRY_DSN must be an official HTTPS Sentry DSN",
    );
  });

  it("requires ENFORCE_ENV_VALIDATION=1 in Production", () => {
    const result = runCheckEnv({
      ...validProductionEnvironment,
      ENFORCE_ENV_VALIDATION: "0",
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain(
      "ENFORCE_ENV_VALIDATION must be 1 for Production",
    );
  });

  it("forbids the GitHub build bypass on every Vercel deployment", () => {
    const result = runCheckEnv({
      ...vercelEnvironment("preview"),
      GITHUB_ACTIONS: "true",
      SKIP_ENV_VALIDATION: "1",
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain(
      "SKIP_ENV_VALIDATION is forbidden on Vercel",
    );
  });

  it("keeps the bypass limited to GitHub Actions builds", () => {
    const result = runCheckEnv({
      GITHUB_ACTIONS: "true",
      SKIP_ENV_VALIDATION: "1",
    });

    expect(result.status).toBe(0);
    expect(result.output).toContain(
      "Runtime values skipped for this GitHub Actions build",
    );
  });
});

describe("MercadoPago credential rules", () => {
  const LIVE_TOKEN = "APP_USR-0123456789abcdef";
  const WEBHOOK_SECRET = "abcdefghijklmnopqrstuvwx";

  it("accepts the access token before a webhook secret exists", () => {
    // Registering the webhook in the MercadoPago panel is what produces the
    // signing secret, so requiring it up front would block the very deployment
    // that has to exist first. Payments are confirmed by the reconciliation
    // sweep until the secret is set.
    const result = runCheckEnv({
      ...validProductionEnvironment,
      MERCADOPAGO_ACCESS_TOKEN: LIVE_TOKEN,
    });

    expect(result.output).not.toContain("MERCADOPAGO_WEBHOOK_SECRET");
    expect(result.output).toContain("OK");
  });

  it("rejects a webhook secret with no access token to verify against", () => {
    const result = runCheckEnv({
      ...validProductionEnvironment,
      MERCADOPAGO_WEBHOOK_SECRET: WEBHOOK_SECRET,
    });

    expect(result.output).toContain("Missing: MERCADOPAGO_ACCESS_TOKEN");
    expect(result.output).toContain("Validation failed");
  });

  it("accepts both together", () => {
    const result = runCheckEnv({
      ...validProductionEnvironment,
      MERCADOPAGO_ACCESS_TOKEN: LIVE_TOKEN,
      MERCADOPAGO_WEBHOOK_SECRET: WEBHOOK_SECRET,
    });

    expect(result.output).toContain("OK");
  });

  it("keeps both credentials out of Preview", () => {
    const result = runCheckEnv({
      ...vercelEnvironment("preview"),
      MERCADOPAGO_ACCESS_TOKEN: "TEST-0123456789abcdef",
      MERCADOPAGO_WEBHOOK_SECRET: WEBHOOK_SECRET,
    });

    expect(result.output).toContain("MERCADOPAGO_ACCESS_TOKEN");
    expect(result.output).toContain("MERCADOPAGO_WEBHOOK_SECRET");
    expect(result.output).toContain("Validation failed");
  });
});
