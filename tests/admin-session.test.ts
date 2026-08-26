import { describe, expect, it } from "vitest";
import {
  accessKeyMatches,
  ADMIN_GATE_TTL_SECONDS,
  ADMIN_SESSION_TTL_SECONDS,
  createAdminGateToken,
  createAdminSessionToken,
  passwordMatches,
  verifyAdminGateToken,
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
    const [, scope, expiresAt, nonce, signature] = token.split(".");
    const forged = `v1.${scope}.${Number(expiresAt) + 86_400}.${nonce}.${signature}`;
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

describe("admin gate token", () => {
  it("accepts a gate token signed with the same secret", () => {
    expect(verifyAdminGateToken(createAdminGateToken(SECRET), SECRET)).toBe(
      true,
    );
  });

  it("outlives a work session so the private link is followed once", () => {
    expect(ADMIN_GATE_TTL_SECONDS).toBeGreaterThan(ADMIN_SESSION_TTL_SECONDS);
  });

  it("expires", () => {
    const token = createAdminGateToken(SECRET);
    const afterExpiry = new Date(
      Date.now() + (ADMIN_GATE_TTL_SECONDS + 60) * 1000,
    );
    expect(verifyAdminGateToken(token, SECRET, afterExpiry)).toBe(false);
  });

  it("does not accept a session token, and a session does not accept a gate", () => {
    expect(verifyAdminGateToken(createAdminSessionToken(SECRET), SECRET)).toBe(
      false,
    );
    expect(verifyAdminSessionToken(createAdminGateToken(SECRET), SECRET)).toBe(
      false,
    );
  });

  it("rejects a token signed with a different secret", () => {
    const token = createAdminGateToken(SECRET);
    expect(verifyAdminGateToken(token, "another-secret-value-here")).toBe(false);
  });
});

describe("access key comparison", () => {
  it("accepts the exact key and rejects anything else", () => {
    const key = "a".repeat(48);
    expect(accessKeyMatches(key, key)).toBe(true);
    expect(accessKeyMatches(`${key}b`, key)).toBe(false);
    expect(accessKeyMatches("", key)).toBe(false);
  });
});
