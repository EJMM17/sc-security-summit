import "server-only";

import { z } from "zod";

const nonEmpty = z.string().trim().min(1);

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Supabase — required (the app cannot boot without them)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: nonEmpty,
  SUPABASE_SERVICE_ROLE_KEY: nonEmpty,

  // Site
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),

  // Admin auth
  ADMIN_SESSION_SECRET: z.string().min(32).optional(),
  BCRYPT_ROUNDS: z.coerce.number().min(4).max(20).default(12),

  // Upstash Redis — required in production for distributed rate limiting
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: nonEmpty.optional(),

  // Sentry — optional
  SENTRY_DSN: z.string().url().optional().or(z.literal("")),
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
