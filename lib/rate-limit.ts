import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

const isProd = process.env.NODE_ENV === "production";
const hasRedis = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

let _warned = false;
function warnMissingOnce() {
  if (_warned) return;
  _warned = true;
  console.warn(
    "[rate-limit] UPSTASH_REDIS_REST_URL / TOKEN no configurados — rate limiting deshabilitado en dev",
  );
}

const ratelimit = hasRedis
  ? new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      }),
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "scss2026",
      analytics: false,
    })
  : null;

export class RateLimitError extends Error {
  readonly retryAfter: number;
  constructor(retryAfterMs: number) {
    super("RATE_LIMITED");
    this.name = "RateLimitError";
    this.retryAfter = Math.ceil(retryAfterMs / 1000);
  }
}

export async function checkRateLimit(key: string): Promise<void> {
  if (!ratelimit) {
    if (isProd) {
      throw new Error(
        "[rate-limit] UPSTASH_REDIS_REST_URL / TOKEN requeridos en producción",
      );
    }
    warnMissingOnce();
    return;
  }
  const { success, reset } = await ratelimit.limit(key);
  if (!success) {
    throw new RateLimitError(reset - Date.now());
  }
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("cf-connecting-ip") ??
    h.get("x-forwarded-for")?.split(",")[0].trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}
