import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = "test-secret-thirty-two-chars-or-more-yes";
  process.env.ADMIN_EMAILS = "ops@example.com, support@example.com";
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.test";
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

async function load() {
  return import("./admin-auth");
}

describe("isAllowedEmail", () => {
  it("matches case-insensitively and trims", async () => {
    const { isAllowedEmail } = await load();
    expect(isAllowedEmail("OPS@example.com")).toBe(true);
    expect(isAllowedEmail("  support@example.com  ")).toBe(true);
    expect(isAllowedEmail("intruder@example.com")).toBe(false);
  });

  it("falls back to CONTACT_EMAIL when ADMIN_EMAILS is unset", async () => {
    delete process.env.ADMIN_EMAILS;
    process.env.CONTACT_EMAIL = "owner@example.com";
    vi.resetModules();
    const { isAllowedEmail } = await load();
    expect(isAllowedEmail("owner@example.com")).toBe(true);
  });
});

describe("login token round-trip", () => {
  it("verifies a freshly minted token", async () => {
    const { mintLoginToken, consumeLoginToken } = await load();
    const token = mintLoginToken("ops@example.com");
    expect(consumeLoginToken(token)).toBe("ops@example.com");
  });

  it("rejects a tampered signature", async () => {
    const { mintLoginToken, consumeLoginToken } = await load();
    const token = mintLoginToken("ops@example.com");
    const tampered = token.slice(0, -2) + "XX";
    expect(consumeLoginToken(tampered)).toBeNull();
  });

  it("rejects garbage input", async () => {
    const { consumeLoginToken } = await load();
    expect(consumeLoginToken("")).toBeNull();
    expect(consumeLoginToken("nope")).toBeNull();
    expect(consumeLoginToken("a.b.c")).toBeNull();
  });

  it("rejects an expired token", async () => {
    const { mintLoginToken, consumeLoginToken } = await load();
    const realDateNow = Date.now;
    Date.now = () => 0;
    const token = mintLoginToken("ops@example.com");
    Date.now = () => 60 * 60 * 1000; // 1 hour later, well past 15 min TTL
    expect(consumeLoginToken(token)).toBeNull();
    Date.now = realDateNow;
  });
});

describe("buildLoginUrl", () => {
  it("uses NEXT_PUBLIC_SITE_URL with no trailing slash", async () => {
    const { buildLoginUrl } = await load();
    expect(buildLoginUrl("abc.def")).toBe("https://example.test/admin/auth?t=abc.def");
  });

  it("URL-encodes the token", async () => {
    const { buildLoginUrl } = await load();
    expect(buildLoginUrl("a/b+c")).toBe("https://example.test/admin/auth?t=a%2Fb%2Bc");
  });
});
