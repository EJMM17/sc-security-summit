import "server-only";

import { Redis } from "@upstash/redis";
import { env, features } from "@/env";

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!features.ratelimit) return null;
  if (_redis) return _redis;
  _redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL!,
    token: env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return _redis;
}

const PREFIX = "scss2026:idem:";
const TTL_SECONDS = 3600;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidIdempotencyKey(key: string | null | undefined): key is string {
  return typeof key === "string" && UUID_RE.test(key);
}

export async function getIdempotentResult(key: string): Promise<string | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const value = await r.get<string>(`${PREFIX}${key}`);
    return value ?? null;
  } catch {
    return null;
  }
}

export async function setIdempotentResult(key: string, value: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(`${PREFIX}${key}`, value, { ex: TTL_SECONDS });
  } catch {
    // intentional swallow — idempotency is best-effort
  }
}
