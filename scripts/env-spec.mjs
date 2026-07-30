#!/usr/bin/env node

/**
 * Single source of truth for manually managed environment variables.
 *
 * Keep application/system-provided variables (NODE_ENV, CI, VERCEL, and
 * VERCEL_*) out of this list. When adding a variable:
 *   1. add it here;
 *   2. run `npm run env:contract`;
 *   3. copy the printed template diff into `.env.local.example`;
 *   4. update Vercel Preview and/or Production as required.
 */
export const ENV_SPEC = [
  {
    name: "SUPABASE_URL",
    scope: "server",
    secret: false,
    runtimeRequired: true,
    previewRequired: true,
    productionRequired: true,
    format: "supabase-url",
    placeholderAllowed: false,
    placeholders: ["https://your-project-ref.supabase.co"],
    group: "Supabase (server only)",
    description:
      "Project URL. Preview must point to a database isolated from Production.",
    templateValue: "",
  },
  {
    name: "SUPABASE_SECRET_KEY",
    scope: "server",
    secret: true,
    runtimeRequired: true,
    previewRequired: true,
    productionRequired: true,
    format: "supabase-secret",
    placeholderAllowed: false,
    placeholders: [
      "sb_secret_placeholder",
      "your_supabase_secret_key",
      "your_supabase_service_role_key",
    ],
    group: "Supabase (server only)",
    description:
      "Modern sb_secret_ key. Never prefix it with NEXT_PUBLIC_ or expose it to a client component.",
    templateValue: "",
  },
  {
    name: "CRON_SECRET",
    scope: "server",
    secret: true,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: true,
    format: "cron-secret",
    placeholderAllowed: false,
    placeholders: ["change-me", "replace_with_random_secret"],
    group: "Supabase (server only)",
    description:
      "Random bearer secret used only by Vercel to invoke the notification retry route.",
    templateValue: "",
  },
  {
    name: "RESEND_API_KEY",
    scope: "server",
    secret: true,
    runtimeRequired: true,
    previewRequired: true,
    productionRequired: true,
    format: "resend-key",
    placeholderAllowed: false,
    placeholders: ["re_PLACEHOLDER", "re_xxxxxxxxxxxxxxxxx"],
    group: "Inquiry notifications",
    description:
      "Resend API key. A missing provider must not prevent a persisted inquiry from being queued.",
    templateValue: "",
  },
  {
    name: "CONTACT_EMAIL",
    scope: "server",
    secret: false,
    runtimeRequired: true,
    previewRequired: true,
    productionRequired: true,
    format: "email",
    placeholderAllowed: false,
    placeholders: ["ops@example.com", "team@example.invalid"],
    group: "Inquiry notifications",
    description:
      "Authorized inbox that receives corporate-pass and sponsorship notifications.",
    templateValue: "",
  },
  {
    name: "EMAIL_FROM",
    scope: "server",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    format: "email-sender",
    placeholderAllowed: true,
    placeholders: [],
    group: "Inquiry notifications",
    description:
      "Optional sender. Its domain must be verified in Resend.",
    templateValue:
      '"SC Security Summit <hola@scsecuritysummit.com>"',
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
    name: "UPSTASH_REDIS_REST_URL",
    scope: "server",
    secret: false,
    runtimeRequired: true,
    previewRequired: true,
    productionRequired: true,
    format: "https-url",
    placeholderAllowed: false,
    placeholders: [
      "https://your-instance.upstash.io",
      "https://TU_INSTANCE.upstash.io",
    ],
    group: "Rate limiting",
    description:
      "Upstash REST URL. URL and token are an indivisible pair.",
    templateValue: "",
  },
  {
    name: "UPSTASH_REDIS_REST_TOKEN",
    scope: "server",
    secret: true,
    runtimeRequired: true,
    previewRequired: true,
    productionRequired: true,
    format: "token",
    placeholderAllowed: false,
    placeholders: ["your_upstash_rest_token", "TU_TOKEN_AQUI"],
    group: "Rate limiting",
    description:
      "Upstash REST token. URL and token are an indivisible pair.",
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
    templateValue: "https://www.scsecuritysummit.com",
  },
  {
    name: "NEXT_PUBLIC_EVENTBRITE_URL",
    scope: "public",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    format: "https-url",
    placeholderAllowed: true,
    placeholders: [],
    group: "Public site configuration",
    description:
      "Optional Eventbrite override. This value is exposed to the browser.",
    templateValue: "",
  },
  {
    name: "SENTRY_DSN",
    scope: "server",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    format: "url",
    placeholderAllowed: true,
    placeholders: [],
    group: "Observability (optional)",
    description: "Sentry DSN for server and edge runtimes.",
    templateValue: "",
  },
  {
    name: "NEXT_PUBLIC_SENTRY_DSN",
    scope: "public",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    format: "url",
    placeholderAllowed: true,
    placeholders: [],
    group: "Observability (optional)",
    description:
      "Sentry DSN for the browser. This value is intentionally public.",
    templateValue: "",
  },
  {
    name: "SENTRY_ORG",
    scope: "server",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    format: "slug",
    placeholderAllowed: true,
    placeholders: [],
    group: "Observability (optional)",
    description:
      "Sentry organization slug; configure it together with project and auth token.",
    templateValue: "",
  },
  {
    name: "SENTRY_PROJECT",
    scope: "server",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    format: "slug",
    placeholderAllowed: true,
    placeholders: [],
    group: "Observability (optional)",
    description:
      "Sentry project slug; configure it together with organization and auth token.",
    templateValue: "",
  },
  {
    name: "SENTRY_AUTH_TOKEN",
    scope: "server",
    secret: true,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    format: "token",
    placeholderAllowed: false,
    placeholders: ["your_sentry_auth_token"],
    group: "Observability (optional)",
    description:
      "Optional source-map upload token. Never expose it to the browser.",
    templateValue: "",
  },
  {
    name: "NEXT_PUBLIC_GTM_ID",
    scope: "public",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    format: "gtm-id",
    placeholderAllowed: false,
    placeholders: ["GTM-XXXXXXX"],
    group: "Analytics and marketing (optional)",
    description:
      "Google Tag Manager container ID. This value is exposed to the browser.",
    templateValue: "",
  },
  {
    name: "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    scope: "public",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    format: "ga-id",
    placeholderAllowed: false,
    placeholders: ["G-XXXXXXXXXX"],
    group: "Analytics and marketing (optional)",
    description:
      "Direct GA4 fallback used only when GTM is empty. Do not configure both paths in GTM.",
    templateValue: "",
  },
  {
    name: "NEXT_PUBLIC_META_PIXEL_ID",
    scope: "public",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    format: "numeric-id",
    placeholderAllowed: true,
    placeholders: [],
    group: "Analytics and marketing (optional)",
    description:
      "Optional Meta Pixel ID. Do not also load the same pixel through GTM.",
    templateValue: "",
  },
  {
    name: "NEXT_PUBLIC_LINKEDIN_PARTNER_ID",
    scope: "public",
    secret: false,
    runtimeRequired: false,
    previewRequired: false,
    productionRequired: false,
    format: "numeric-id",
    placeholderAllowed: true,
    placeholders: [],
    group: "Analytics and marketing (optional)",
    description:
      "Optional LinkedIn partner ID. Do not also load it through GTM.",
    templateValue: "",
  },
  {
    name: "ENFORCE_ENV_VALIDATION",
    scope: "server",
    secret: false,
    runtimeRequired: false,
    previewRequired: true,
    productionRequired: true,
    format: "boolean-flag",
    placeholderAllowed: true,
    placeholders: [],
    group: "Validation controls",
    description:
      "Must be 1 in Vercel Preview and Production. Local development may leave it at 0.",
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
    names: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    mode: "all-or-none",
    description: "Upstash URL and token must be configured together.",
  },
  {
    names: ["SENTRY_ORG", "SENTRY_PROJECT", "SENTRY_AUTH_TOKEN"],
    mode: "all-or-none",
    description:
      "Sentry source-map upload requires organization, project, and auth token together.",
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
