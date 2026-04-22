import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

// 5 registrations per IP per 15-minute sliding window, shared across all Vercel regions.
// Uses Vercel KV (set up via Vercel dashboard → Storage → KV Database).
// In dev without KV env vars, falls back to allow-all.

let _limiter: Ratelimit | null = null;

function getLimiter(): Ratelimit {
  if (_limiter) return _limiter;

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[rate-limit] KV_REST_API_URL and KV_REST_API_TOKEN are required in production");
    }
    // Dev fallback: always allow
    return {
      limit: async () => ({
        success: true,
        remaining: 4,
        reset: Date.now() + 900_000,
        limit: 5,
        pending: Promise.resolve(),
      }),
    } as unknown as Ratelimit;
  }

  _limiter = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    prefix: "scss2026:rl",
    analytics: false,
  });
  return _limiter;
}

export async function checkRateLimit(ip: string): Promise<{
  ok: boolean;
  remaining: number;
  resetAt: number;
}> {
  const { success, remaining, reset } = await getLimiter().limit(ip);
  return { ok: success, remaining, resetAt: reset };
}
