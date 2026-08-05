import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Stateless signed session. The cookie carries only an expiry and a random
 * identifier, never the password and never operator data, so a leaked cookie
 * expires on its own and reveals nothing about the credential that minted it.
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

export function createAdminSessionToken(
  secret: string,
  now: Date = new Date(),
): string {
  const expiresAt = Math.floor(now.getTime() / 1000) + ADMIN_SESSION_TTL_SECONDS;
  const payload = `${TOKEN_VERSION}.${expiresAt}.${randomBytes(12).toString("base64url")}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyAdminSessionToken(
  token: string | undefined,
  secret: string,
  now: Date = new Date(),
): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 4) return false;

  const [version, expiresAt, , signature] = parts;
  if (version !== TOKEN_VERSION) return false;
  if (!/^\d{1,15}$/.test(expiresAt)) return false;

  const payload = parts.slice(0, 3).join(".");
  if (!equals(signature, sign(payload, secret))) return false;

  return Number(expiresAt) * 1000 > now.getTime();
}

/**
 * Timing-safe password check that does not leak the expected length through an
 * early return.
 */
export function passwordMatches(candidate: string, expected: string): boolean {
  const digest = (value: string) =>
    createHmac("sha256", "admin-password-comparison").update(value).digest();
  return timingSafeEqual(digest(candidate), digest(expected));
}
