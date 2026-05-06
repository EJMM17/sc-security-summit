import "server-only";

import { z } from "zod";

// =============================================================
// Env validation — Zod
// =============================================================
// Strategy:
//   • Vars que rompen el sitio entero si faltan (Supabase) → strict.
//     El build aborta con un error claro si no están configurados.
//   • Vars que sólo activan una feature (Redis, Resend, Turnstile,
//     Email) → optional. El build pasa, los consumidores degradan
//     elegantemente en runtime (sin 500s) y loguean una advertencia.
//
// Usa `features.*` para preguntar "¿está esta capacidad activa?" y
// `requireEnv("FOO")` cuando un code path realmente necesite el valor.
// =============================================================

const nonEmpty = z.string().trim().min(1);
const optionalNonEmpty = nonEmpty.optional();
const optionalUrl = z.string().url().optional();
const optionalEmail = z.string().trim().email().optional();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // ── Strict (siempre requeridas) ──────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: nonEmpty,
  SUPABASE_SERVICE_ROLE_KEY: nonEmpty,

  // ── Optional (degradación elegante si faltan) ────────────────
  RESEND_API_KEY: optionalNonEmpty,
  EMAIL_FROM: optionalNonEmpty,
  CONTACT_EMAIL: optionalEmail,

  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: optionalNonEmpty,

  NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalNonEmpty,
  TURNSTILE_SECRET_KEY: optionalNonEmpty,

  NEXT_PUBLIC_APP_URL: optionalUrl,
  NEXT_PUBLIC_SITE_URL: optionalUrl,

  SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  ADMIN_SESSION_SECRET: z.string().optional(),
  BCRYPT_ROUNDS: z.coerce.number().min(4).max(20).optional().default(12),
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

// Feature flags derivadas — úsalas para gating en server actions/handlers.
export const features = {
  ratelimit: Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
  email: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM),
  turnstile: Boolean(
    env.TURNSTILE_SECRET_KEY && env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  ),
} as const;

// Helper para code paths que SÍ necesitan el valor: lanza un error claro
// en runtime, no en build. Llamar dentro de handlers/actions, nunca a
// nivel de módulo.
export function requireEnv<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const value = env[key];
  if (value === undefined || value === null || value === "") {
    throw new Error(
      `[env] ${String(key)} is required at runtime but is not configured`,
    );
  }
  return value as NonNullable<Env[K]>;
}
