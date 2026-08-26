import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Stateless signed cookies. Each one carries only a scope, an expiry and a
 * random identifier — never the password, never the access key and never
 * operator data — so a leaked cookie expires on its own and reveals nothing
 * about the credential that minted it.
 */
const TOKEN_VERSION = "v1";
export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function equals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  // timingSafeEqual throws on length mismatch, so compare lengths separately
  // and still run the constant-time comparison on a fixed-size digest.
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export const ADMIN_GATE_TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * Both cookies carry the same shape and differ only by scope, so a session
 * token can never be replayed as a gate token or the other way round.
 */
type TokenScope = "session" | "gate";

function createToken(
  secret: string,
  scope: TokenScope,
  ttlSeconds: number,
  now: Date,
): string {
  const expiresAt = Math.floor(now.getTime() / 1000) + ttlSeconds;
  const payload = `${TOKEN_VERSION}.${scope}.${expiresAt}.${randomBytes(12).toString("base64url")}`;
  return `${payload}.${sign(payload, secret)}`;
}

function verifyToken(
  token: string | undefined,
  secret: string,
  scope: TokenScope,
  now: Date,
): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 5) return false;

  const [version, tokenScope, expiresAt, , signature] = parts;
  if (version !== TOKEN_VERSION) return false;
  if (tokenScope !== scope) return false;
  if (!/^\d{1,15}$/.test(expiresAt)) return false;

  const payload = parts.slice(0, 4).join(".");
  if (!equals(signature, sign(payload, secret))) return false;

  return Number(expiresAt) * 1000 > now.getTime();
}

export function createAdminSessionToken(
  secret: string,
  now: Date = new Date(),
): string {
  return createToken(secret, "session", ADMIN_SESSION_TTL_SECONDS, now);
}

export function verifyAdminSessionToken(
  token: string | undefined,
  secret: string,
  now: Date = new Date(),
): boolean {
  return verifyToken(token, secret, "session", now);
}

/**
 * The gate cookie only records that this browser once followed the private
 * link. It grants no data by itself — the password login still runs — so it is
 * allowed to outlive a work session and spare the operator the long URL.
 */
export function createAdminGateToken(
  secret: string,
  now: Date = new Date(),
): string {
  return createToken(secret, "gate", ADMIN_GATE_TTL_SECONDS, now);
}

export function verifyAdminGateToken(
  token: string | undefined,
  secret: string,
  now: Date = new Date(),
): boolean {
  return verifyToken(token, secret, "gate", now);
}

/**
 * Timing-safe password check that does not leak the expected length through an
 * early return.
 */
export function passwordMatches(candidate: string, expected: string): boolean {
  return secretMatches(candidate, expected, "admin-password-comparison");
}

/** Same constant-time comparison for the private-link access key. */
export function accessKeyMatches(candidate: string, expected: string): boolean {
  return secretMatches(candidate, expected, "admin-access-key-comparison");
}

function secretMatches(
  candidate: string,
  expected: string,
  domain: string,
): boolean {
  const digest = (value: string) =>
    createHmac("sha256", domain).update(value).digest();
  return timingSafeEqual(digest(candidate), digest(expected));
}
