import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env, features } from "@/env";

// Lazy singleton — sin Upstash configurado, no se construye el cliente
// (evita throws a tiempo de import durante `next build`).
let _ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (!features.ratelimit) return null;
  if (_ratelimit) return _ratelimit;

  _ratelimit = new Ratelimit({
    redis: new Redis({
      url: env.UPSTASH_REDIS_REST_URL!,
      token: env.UPSTASH_REDIS_REST_TOKEN!,
    }),
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    prefix: "scss2026:rl",
    analytics: false,
  });
  return _ratelimit;
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
