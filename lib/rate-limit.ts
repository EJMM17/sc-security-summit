import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env, features } from "@/env";

// One Redis client, multiple limiters keyed by prefix. Each limiter has its own
// window so they don't share buckets — orden:* and wh:* never burn registro:*.
let _redis: Redis | null = null;
const _limiters = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  if (!features.ratelimit) return null;
  if (_redis) return _redis;
  _redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL!,
    token: env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return _redis;
}

function getLimiter(
  prefix: string,
  tokens: number,
  window: `${number} ${"s" | "m" | "h" | "d"}`,
): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  const key = `${prefix}:${tokens}:${window}`;
  let rl = _limiters.get(key);
  if (!rl) {
    rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(tokens, window),
      prefix,
      analytics: false,
    });
    _limiters.set(key, rl);
  }
  return rl;
}

function getRatelimit(): Ratelimit | null {
  return getLimiter("scss2026:rl", 5, "15 m");
}

export const ratelimit = getRatelimit();

let _warned = false;
function warnDisabledOnce() {
  if (_warned) return;
  _warned = true;
  console.warn(
    "[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN no configurados — rate limiting deshabilitado",
  );
}

export async function checkRateLimit(
  key: string,
): Promise<{ ok: boolean; remaining: number; resetAt: number }> {
  const rl = getRatelimit();
  if (!rl) {
    warnDisabledOnce();
    return { ok: true, remaining: Number.POSITIVE_INFINITY, resetAt: 0 };
  }
  const { success, remaining, reset } = await rl.limit(key);
  return { ok: success, remaining, resetAt: reset };
}

// Tighter limiter for payment order creation: 5 req / 15 min per IP.
export async function checkOrdenRateLimit(
  key: string,
): Promise<{ ok: boolean; remaining: number; resetAt: number }> {
  const rl = getLimiter("scss2026:orden", 5, "15 m");
  if (!rl) {
    warnDisabledOnce();
    return { ok: true, remaining: Number.POSITIVE_INFINITY, resetAt: 0 };
  }
  const { success, remaining, reset } = await rl.limit(key);
  return { ok: success, remaining, resetAt: reset };
}

// Generous limiter for inbound webhooks: 100 req / min per source.
// Conekta retries on non-2xx, so we let bursts through but cap pathological loops.
export async function checkWebhookRateLimit(
  key: string,
): Promise<{ ok: boolean; remaining: number; resetAt: number }> {
  const rl = getLimiter("scss2026:wh", 100, "1 m");
  if (!rl) {
    warnDisabledOnce();
    return { ok: true, remaining: Number.POSITIVE_INFINITY, resetAt: 0 };
  }
  const { success, remaining, reset } = await rl.limit(key);
  return { ok: success, remaining, resetAt: reset };
}
