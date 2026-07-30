import { describe, expect, it } from "vitest";
import { resolveClientIp } from "@/lib/rate-limit";

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
