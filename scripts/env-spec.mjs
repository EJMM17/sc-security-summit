#!/usr/bin/env node

import deploymentContract from "../config/deployment-contract.json" with {
  type: "json",
};

/**
 * Single source of truth for environment variables consumed by the app.
 *
 * Keep application/system-provided variables (NODE_ENV, CI, VERCEL, VERCEL_*
 * and the compiled NEXT_PUBLIC_DEPLOYMENT_TARGET marker) out of this list.
 * When adding a configured variable:
 *   1. add it here;
 *   2. run `npm run env:contract`;
 *   3. copy the printed template diff into `.env.local.example`;
 *   4. configure the owning provider/integration in the required target.
 */
export const ENV_SPEC = [
  {
    name: "SUPABASE_URL",
    scope: "server",
    secret: false,
    runtimeRequired: true,
    previewRequired: false,
    productionRequired: true,
    forbiddenTargets: ["preview"],
    format: "supabase-url",
    placeholderAllowed: false,
    placeholders: ["https://your-project-ref.supabase.co"],
    group: "Supabase (server only)",
    description:
      `Loopback URL locally or exact HTTPS host ${deploymentContract.supabaseProductionHost} in Production; forbidden in Preview.`,
    templateValue: "",
  },
  {
    name: "SUPABASE_SECRET_KEY",
    scope: "server",
    secret: true,
    runtimeRequired: true,
    previewRequired: false,
    productionRequired: true,
    forbiddenTargets: ["preview"],
    format: "supabase-secret",
    placeholderAllowed: false,
    placeholders: [
      "sb_secret_placeholder",
      "your_supabase_secret_key",
      "your_supabase_service_role_key",
    ],
    group: "Supabase (server only)",
    description:
      "Local key with loopback or modern sb_secret_ in Production; forbidden in Preview and clients.",
    templateValue: "",
  },
  {
    name: "CRON_SECRET",
    scope: "server",
    secret: true,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: true,
    forbiddenTargets: ["local", "development", "preview"],
    format: "cron-secret",
    placeholderAllowed: false,
    placeholders: ["change-me", "replace_with_random_secret"],
    group: "Supabase (server only)",
    description:
      "Production-only bearer secret; forbidden in local, development, and Preview.",
    templateValue: "",
  },
  {
    name: "RESEND_API_KEY",
    scope: "server",
    secret: true,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: true,
    forbiddenTargets: ["local", "development", "preview"],
    format: "resend-key",
    placeholderAllowed: false,
    placeholders: ["re_PLACEHOLDER", "re_xxxxxxxxxxxxxxxxx"],
    group: "Inquiry notifications",
    description:
      "Resend API key. Required only in Vercel Production and forbidden everywhere else.",
    templateValue: "",
  },
  {
    name: "CONTACT_EMAIL",
    scope: "server",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: true,
    forbiddenTargets: ["local", "development", "preview"],
    format: "email",
    placeholderAllowed: false,
    placeholders: ["ops@example.com", "team@example.invalid"],
    group: "Inquiry notifications",
    description:
      "Production inquiry inbox. Configure it with RESEND_API_KEY; omit both outside Production.",
    templateValue: "",
  },
  {
    name: "EMAIL_FROM",
    scope: "server",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    forbiddenTargets: ["local", "development", "preview"],
    format: "email-sender",
    placeholderAllowed: true,
    placeholders: [],
    group: "Inquiry notifications",
    description:
      "Optional sender. Its domain must be verified in Resend.",
    templateValue: "",
  },
  {
    name: "INQUIRY_NOTIFICATION_BATCH_SIZE",
    scope: "server",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    format: "integer-1-25",
    placeholderAllowed: true,
    placeholders: [],
    group: "Inquiry notifications",
    description:
      "Optional retry batch size. Keep it small; the application default is used when empty.",
    templateValue: "",
  },
  {
    name: "KV_REST_API_URL",
    scope: "server",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: true,
    forbiddenTargets: ["local", "development", "preview"],
    format: "upstash-url",
    placeholderAllowed: false,
    placeholders: [
      "https://your-instance.upstash.io",
      "https://TU_INSTANCE.upstash.io",
    ],
    group: "Rate limiting",
    description:
      "Vercel Production root HTTPS *.upstash.io URL without a custom port; forbidden elsewhere.",
    templateValue: "",
  },
  {
    name: "KV_REST_API_TOKEN",
    scope: "server",
    secret: true,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: true,
    forbiddenTargets: ["local", "development", "preview"],
    format: "token",
    placeholderAllowed: false,
    placeholders: ["your_upstash_rest_token", "TU_TOKEN_AQUI"],
    group: "Rate limiting",
    description:
      "Vercel Production Upstash token. URL and token are indivisible and forbidden elsewhere.",
    templateValue: "",
  },
  {
    name: "NEXT_PUBLIC_SITE_URL",
    scope: "public",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: true,
    format: "canonical-https-url",
    placeholderAllowed: true,
    placeholders: [],
    group: "Public site configuration",
    description:
      "Canonical production URL without a trailing slash. This value is exposed to the browser.",
    templateValue: "https://scsecuritysummit.com",
  },
  {
    name: "SENTRY_DSN",
    scope: "server",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    forbiddenTargets: ["local", "development", "preview"],
    format: "sentry-dsn",
    placeholderAllowed: true,
    placeholders: [],
    group: "Observability (optional)",
    description:
      "Optional Production-only Sentry DSN for error events; forbidden elsewhere.",
    templateValue: "",
  },
  {
    name: "NEXT_PUBLIC_SENTRY_DSN",
    scope: "public",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    forbiddenTargets: ["local", "development", "preview"],
    format: "sentry-dsn",
    placeholderAllowed: true,
    placeholders: [],
    group: "Observability (optional)",
    description:
      "Optional Production-only browser DSN. It is public but forbidden elsewhere.",
    templateValue: "",
  },
  {
    name: "SENTRY_ORG",
    scope: "server",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    forbiddenTargets: ["local", "development", "preview"],
    format: "slug",
    placeholderAllowed: true,
    placeholders: [],
    group: "Observability (optional)",
    description:
      "Production source-map organization slug; forbidden outside Production.",
    templateValue: "",
  },
  {
    name: "SENTRY_PROJECT",
    scope: "server",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    forbiddenTargets: ["local", "development", "preview"],
    format: "slug",
    placeholderAllowed: true,
    placeholders: [],
    group: "Observability (optional)",
    description:
      "Production source-map project slug; forbidden outside Production.",
    templateValue: "",
  },
  {
    name: "SENTRY_AUTH_TOKEN",
    scope: "server",
    secret: true,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    forbiddenTargets: ["local", "development", "preview"],
    format: "token",
    placeholderAllowed: false,
    placeholders: ["your_sentry_auth_token"],
    group: "Observability (optional)",
    description:
      "Optional Production source-map upload token. Forbidden outside Production.",
    templateValue: "",
  },
  {
    name: "NEXT_PUBLIC_GTM_ID",
    scope: "public",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    forbiddenTargets: ["local", "development", "preview"],
    format: "gtm-id",
    placeholderAllowed: false,
    placeholders: ["GTM-XXXXXXX"],
    group: "Analytics and marketing (optional)",
    description:
      "Production GTM container ID. It is exposed to the browser and forbidden elsewhere.",
    templateValue: "",
  },
  {
    name: "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    scope: "public",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    forbiddenTargets: ["local", "development", "preview"],
    format: "ga-id",
    placeholderAllowed: false,
    placeholders: ["G-XXXXXXXXXX"],
    group: "Analytics and marketing (optional)",
    description:
      "Production GA4 fallback. Forbid it elsewhere and do not duplicate it through GTM.",
    templateValue: "",
  },
  {
    name: "NEXT_PUBLIC_META_PIXEL_ID",
    scope: "public",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    forbiddenTargets: ["local", "development", "preview"],
    format: "numeric-id",
    placeholderAllowed: true,
    placeholders: [],
    group: "Analytics and marketing (optional)",
    description:
      "Optional Production Meta Pixel ID. It is forbidden outside Production.",
    templateValue: "",
  },
  {
    name: "NEXT_PUBLIC_LINKEDIN_PARTNER_ID",
    scope: "public",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    forbiddenTargets: ["local", "development", "preview"],
    format: "numeric-id",
    placeholderAllowed: true,
    placeholders: [],
    group: "Analytics and marketing (optional)",
    description:
      "Optional Production LinkedIn partner ID. It is forbidden outside Production.",
    templateValue: "",
  },
  {
    name: "MERCADOPAGO_ACCESS_TOKEN",
    scope: "server",
    secret: true,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    forbiddenTargets: ["preview"],
    format: "mercadopago-token",
    placeholderAllowed: false,
    placeholders: [
      "APP_USR-PLACEHOLDER",
      "TEST-PLACEHOLDER",
      "your_mercadopago_access_token",
    ],
    group: "Payments (server only)",
    description:
      "MercadoPago access token. Production requires a live APP_USR- token; every other environment requires a TEST- sandbox token. Forbidden in Preview.",
    templateValue: "",
  },
  {
    name: "MERCADOPAGO_WEBHOOK_SECRET",
    scope: "server",
    secret: true,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    forbiddenTargets: ["preview"],
    format: "token",
    placeholderAllowed: false,
    placeholders: ["change-me", "replace_with_random_secret"],
    group: "Payments (server only)",
    description:
      "Signing secret from the MercadoPago webhook panel. Optional: without it every notification is rejected and payments are confirmed by the reconciliation sweep instead, which is slower. Register the webhook and set it as soon as possible. Forbidden in Preview.",
    templateValue: "",
  },
  {
    name: "ADMIN_PASSWORD",
    scope: "server",
    secret: true,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    forbiddenTargets: ["preview"],
    format: "token",
    placeholderAllowed: false,
    placeholders: ["change-me", "admin", "password"],
    group: "Operations panel (server only)",
    description:
      "Optional shared secret that unlocks /admin. Without it the panel answers 404; forbidden in Preview.",
    templateValue: "",
  },
  {
    name: "ADMIN_SESSION_SECRET",
    scope: "server",
    secret: true,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    forbiddenTargets: ["preview"],
    format: "token",
    placeholderAllowed: false,
    placeholders: ["change-me", "replace_with_random_secret"],
    group: "Operations panel (server only)",
    description:
      "Optional random key that signs the /admin session cookie; forbidden in Preview.",
    templateValue: "",
  },
  {
    name: "ENFORCE_ENV_VALIDATION",
    scope: "server",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: true,
    format: "boolean-flag",
    placeholderAllowed: true,
    placeholders: [],
    group: "Validation controls",
    description:
      "Must be 1 in Production. Preview is strict automatically; local development may leave it at 0.",
    templateValue: "0",
  },
];

export const ENV_GROUP_RULES = [
  {
    names: ["SUPABASE_URL", "SUPABASE_SECRET_KEY"],
    mode: "all-or-none",
    description: "Supabase URL and secret key must be configured together.",
  },
  {
    names: ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
    mode: "all-or-none",
    description: "Upstash URL and token must be configured together.",
  },
  {
    names: ["RESEND_API_KEY", "CONTACT_EMAIL"],
    mode: "all-or-none",
    description: "Resend API key and contact inbox must be configured together.",
  },
  {
    names: ["SENTRY_DSN", "NEXT_PUBLIC_SENTRY_DSN"],
    mode: "all-or-none",
    description:
      "Sentry server and browser DSNs must be configured together or both omitted.",
  },
  {
    names: ["MERCADOPAGO_WEBHOOK_SECRET", "MERCADOPAGO_ACCESS_TOKEN"],
    mode: "requires",
    description:
      "The MercadoPago webhook signing secret is useless without the access token the webhook uses to re-read the payment it was notified about.",
  },
  {
    names: ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"],
    mode: "all-or-none",
    description:
      "The operations panel password and session key must be configured together.",
  },
  {
    names: ["SENTRY_ORG", "SENTRY_PROJECT", "SENTRY_AUTH_TOKEN"],
    mode: "all-or-none",
    description:
      "Sentry source-map upload requires organization, project, and auth token together.",
  },
];

/**
 * Retired names are kept out of the generated template but rejected when they
 * would reintroduce the old browser-facing Supabase integration.
 */
export const ENV_FORBIDDEN_NAME_RULES = [
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    targets: ["local", "development", "preview", "production"],
    description:
      "Use the canonical SUPABASE_SECRET_KEY; the legacy service-role variable is forbidden.",
  },
  {
    name: "UPSTASH_REDIS_REST_URL",
    targets: ["local", "development", "preview", "production"],
    description:
      "Use the Vercel-managed KV_REST_API_URL variable; the manual Upstash URL is retired.",
  },
  {
    name: "UPSTASH_REDIS_REST_TOKEN",
    targets: ["local", "development", "preview", "production"],
    description:
      "Use the Vercel-managed KV_REST_API_TOKEN variable; the manual Upstash token is retired.",
  },
  {
    name: "KV_URL",
    targets: ["local", "development", "preview"],
    description:
      "This provider-managed connection string is not consumed by the app and must remain Production-only.",
  },
  {
    name: "REDIS_URL",
    targets: ["local", "development", "preview"],
    description:
      "This provider-managed connection string is not consumed by the app and must remain Production-only.",
  },
  {
    name: "KV_REST_API_READ_ONLY_TOKEN",
    targets: ["local", "development", "preview"],
    description:
      "This provider-managed credential is not consumed by the app and must remain Production-only.",
  },
  {
    prefix: "NEXT_PUBLIC_SUPABASE_",
    targets: ["local", "development", "preview", "production"],
    description:
      "The retired browser-facing Supabase integration is forbidden in every environment.",
  },
];

export function renderEnvTemplate() {
  const lines = [
    "# Generated from scripts/env-spec.mjs.",
    "# Copy this file to .env.local. Never commit real secrets.",
    "# Run `npm run env:contract` after changing the environment contract.",
    "",
  ];

  let currentGroup = "";
  for (const variable of ENV_SPEC) {
    if (variable.group !== currentGroup) {
      if (currentGroup) lines.push("");
      currentGroup = variable.group;
      lines.push(`# === ${currentGroup} ===`);
    }

    lines.push(`# ${variable.description}`);
    lines.push(`${variable.name}=${variable.templateValue}`);
  }

  return `${lines.join("\n")}\n`;
}
