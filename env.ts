import "server-only";

import { z } from "zod";

const nonEmpty = z.string().trim().min(1);
const emailString = z.string().trim().email();

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: nonEmpty,
    SUPABASE_SERVICE_ROLE_KEY: nonEmpty,

    RESEND_API_KEY: nonEmpty,
    EMAIL_FROM: nonEmpty,

    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: nonEmpty,

    SENTRY_DSN: z.string().url().optional().or(z.literal("")),

    NEXT_PUBLIC_APP_URL: z.string().url(),

    // Existing project variables kept for compatibility
    CONTACT_EMAIL: emailString,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: nonEmpty,
    TURNSTILE_SECRET_KEY: nonEmpty,
    ADMIN_EMAILS: z.string().optional(),
    ADMIN_SESSION_SECRET: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.NODE_ENV === "production") {
      if (!values.RESEND_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["RESEND_API_KEY"],
          message: "RESEND_API_KEY is required in production",
        });
      }
      if (!values.UPSTASH_REDIS_REST_URL || !values.UPSTASH_REDIS_REST_TOKEN) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["UPSTASH_REDIS_REST_URL"],
          message: "Upstash Redis credentials are required in production",
        });
      }
    }
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment variables: ${details}`);
}

export const env = parsed.data;

export type Env = typeof env;
