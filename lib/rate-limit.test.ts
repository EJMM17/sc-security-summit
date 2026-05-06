import { afterEach, beforeEach, describe, expect, it } from "vitest";

beforeEach(() => {
  // Wipe Upstash env so the lazy clients return null and we exercise the
  // fail-open dev fallback. (The fail-closed prod assertion lives in env.ts.)
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "srv";
});

afterEach(() => {});

describe("lib/rate-limit (graceful degradation)", () => {
  it("checkRateLimit returns ok when Upstash is not configured", async () => {
    const { checkRateLimit } = await import("./rate-limit");
    const r = await checkRateLimit("anon-ip");
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(Number.POSITIVE_INFINITY);
  });

  it("checkOrdenRateLimit returns ok when Upstash is not configured", async () => {
    const { checkOrdenRateLimit } = await import("./rate-limit");
    const r = await checkOrdenRateLimit("anon-ip");
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(Number.POSITIVE_INFINITY);
  });

  it("checkWebhookRateLimit returns ok when Upstash is not configured", async () => {
    const { checkWebhookRateLimit } = await import("./rate-limit");
    const r = await checkWebhookRateLimit("ip-1");
    expect(r.ok).toBe(true);
  });
});
