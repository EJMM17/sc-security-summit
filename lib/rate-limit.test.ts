import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isValidUpstashRestUrl,
  resolveClientIp,
} from "@/lib/rate-limit";

function requestHeaders(values: Record<string, string>): Pick<Headers, "get"> {
  const normalized = new Map(
    Object.entries(values).map(([name, value]) => [name.toLowerCase(), value]),
  );
  return {
    get: (name: string) => normalized.get(name.toLowerCase()) ?? null,
  };
}

describe("resolveClientIp", () => {
  it("prefers the Vercel-protected address over proxy and vendor headers", () => {
    expect(
      resolveClientIp(
        requestHeaders({
          "x-vercel-forwarded-for": "203.0.113.10",
          "x-forwarded-for": "198.51.100.1",
          "cf-connecting-ip": "192.0.2.2",
        }),
      ),
    ).toBe("203.0.113.10");
  });

  it("uses valid standard fallbacks outside Vercel", () => {
    expect(
      resolveClientIp(
        requestHeaders({
          "x-forwarded-for": "2001:db8::1, 198.51.100.1",
        }),
      ),
    ).toBe("2001:db8::1");
  });

  it("rejects spoofed or malformed values", () => {
    expect(
      resolveClientIp(
        requestHeaders({
          "x-vercel-forwarded-for": "attacker-controlled",
          "x-forwarded-for": "not-an-ip",
          "x-real-ip": "also-invalid",
          "cf-connecting-ip": "203.0.113.99",
        }),
      ),
    ).toBe("unknown");
  });
});

describe("checkRateLimit environment isolation", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("ignores copied Upstash credentials outside Vercel Production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL", "0");
    vi.stubEnv("KV_REST_API_URL", "https://example.upstash.io");
    vi.stubEnv("KV_REST_API_TOKEN", "abcdefghijklmnop");
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.resetModules();

    const { checkRateLimit } = await import("@/lib/rate-limit");
    await expect(checkRateLimit("local-test")).resolves.toBeUndefined();
    expect(warning).toHaveBeenCalledOnce();
    warning.mockRestore();
  });

  it("allows a local production build to run without hosted Redis", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "0");
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("KV_REST_API_TOKEN", "");
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.resetModules();

    const { checkRateLimit } = await import("@/lib/rate-limit");
    await expect(checkRateLimit("local-start")).resolves.toBeUndefined();
    expect(warning).toHaveBeenCalledOnce();
    warning.mockRestore();
  });

  it("fails closed when Redis is absent in Vercel Production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_TARGET_ENV", "production");
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("KV_REST_API_TOKEN", "");
    vi.resetModules();

    const { checkRateLimit } = await import("@/lib/rate-limit");
    await expect(checkRateLimit("production")).rejects.toThrow(
      "requeridos en Vercel Production",
    );
  });
});

describe("isValidUpstashRestUrl", () => {
  it("accepts only a root HTTPS Upstash endpoint", () => {
    expect(isValidUpstashRestUrl("https://summit-rate-limit.upstash.io")).toBe(
      true,
    );
  });

  it.each([
    "http://summit-rate-limit.upstash.io",
    "https://attacker.example.com",
    "https://summit-rate-limit.upstash.io.attacker.example",
    "https://user:password@summit-rate-limit.upstash.io",
    "https://summit-rate-limit.upstash.io:8443",
    "https://summit-rate-limit.upstash.io/path",
    "https://summit-rate-limit.upstash.io?token=leak",
    "https://summit-rate-limit.upstash.io#fragment",
  ])("rejects the unsafe endpoint %s", (url) => {
    expect(isValidUpstashRestUrl(url)).toBe(false);
  });
});
