import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";
import { isIP } from "node:net";
import { isVercelProductionDeployment } from "@/lib/deployment-environment";

const isProtectedProduction = isVercelProductionDeployment();
const upstashUrl = process.env.KV_REST_API_URL?.trim();

export function isValidUpstashRestUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      /^[a-z0-9-]+\.upstash\.io$/i.test(url.hostname) &&
      url.port === "" &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

const hasRedis = isProtectedProduction && !!(
  isValidUpstashRestUrl(upstashUrl) &&
  process.env.KV_REST_API_TOKEN
);

let _warned = false;
function warnMissingOnce() {
  if (_warned) return;
  _warned = true;
  console.warn(
    "[rate-limit] KV_REST_API_URL / KV_REST_API_TOKEN no configurados — rate limiting deshabilitado fuera de Vercel Production",
  );
}

const ratelimit = hasRedis
  ? new Ratelimit({
      redis: new Redis({
        url: upstashUrl!,
        token: process.env.KV_REST_API_TOKEN!,
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
    if (isProtectedProduction) {
      throw new Error(
        "[rate-limit] KV_REST_API_URL / KV_REST_API_TOKEN requeridos en Vercel Production",
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

export function resolveClientIp(
  requestHeaders: Pick<Headers, "get">,
): string {
  // Vercel overwrites x-vercel-forwarded-for at its edge and keeps it
  // independent from an optional upstream proxy. Do not trust vendor-specific
  // headers supplied by the browser without a verified-proxy contract.
  for (const name of [
    "x-vercel-forwarded-for",
    "x-forwarded-for",
    "x-real-ip",
  ]) {
    const candidate = requestHeaders.get(name)?.split(",")[0].trim();
    if (candidate && isIP(candidate) !== 0) return candidate;
  }
  return "unknown";
}

export async function getClientIp(): Promise<string> {
  return resolveClientIp(await headers());
}
