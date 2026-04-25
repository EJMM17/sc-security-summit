import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/env";

export const ratelimit = new Ratelimit({
  redis: new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  }),
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  prefix: "scss2026:rl",
  analytics: false,
});

export async function checkRateLimit(
  key: string
): Promise<{ ok: boolean; remaining: number; resetAt: number }> {
  const { success, remaining, reset } = await ratelimit.limit(key);
  return { ok: success, remaining, resetAt: reset };
}
