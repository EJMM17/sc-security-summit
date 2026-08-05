import { describe, expect, it } from "vitest";
import {
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSessionToken,
  passwordMatches,
  verifyAdminSessionToken,
} from "@/lib/admin/session";

const SECRET = "test-admin-session-secret-value";

describe("admin session token", () => {
  it("accepts a token signed with the same secret", () => {
    const token = createAdminSessionToken(SECRET);
    expect(verifyAdminSessionToken(token, SECRET)).toBe(true);
  });

  it("rejects a token signed with a different secret", () => {
    const token = createAdminSessionToken(SECRET);
    expect(verifyAdminSessionToken(token, "another-secret-value-here")).toBe(
      false,
    );
  });

  it("rejects a tampered expiry", () => {
    const token = createAdminSessionToken(SECRET);
    const [, expiresAt, nonce, signature] = token.split(".");
    const forged = `v1.${Number(expiresAt) + 86_400}.${nonce}.${signature}`;
    expect(verifyAdminSessionToken(forged, SECRET)).toBe(false);
  });

  it("rejects an expired token", () => {
    const issuedAt = new Date("2026-08-01T00:00:00Z");
    const token = createAdminSessionToken(SECRET, issuedAt);
    const afterExpiry = new Date(
      issuedAt.getTime() + (ADMIN_SESSION_TTL_SECONDS + 60) * 1000,
    );
    expect(verifyAdminSessionToken(token, SECRET, afterExpiry)).toBe(false);
    expect(verifyAdminSessionToken(token, SECRET, issuedAt)).toBe(true);
  });

  it("rejects missing and malformed tokens", () => {
    expect(verifyAdminSessionToken(undefined, SECRET)).toBe(false);
    expect(verifyAdminSessionToken("", SECRET)).toBe(false);
    expect(verifyAdminSessionToken("garbage", SECRET)).toBe(false);
    expect(verifyAdminSessionToken("v1.abc.def.ghi", SECRET)).toBe(false);
    expect(verifyAdminSessionToken("v2.999999999999.a.b", SECRET)).toBe(false);
  });

  it("never emits the secret inside the token", () => {
    expect(createAdminSessionToken(SECRET)).not.toContain(SECRET);
  });
});

describe("password comparison", () => {
  it("accepts the exact password and rejects near misses", () => {
    expect(passwordMatches("correct horse battery", "correct horse battery")).toBe(
      true,
    );
    expect(passwordMatches("correct horse batter", "correct horse battery")).toBe(
      false,
    );
    expect(passwordMatches("", "correct horse battery")).toBe(false);
  });
});
