import "server-only";

import { cookies } from "next/headers";
import {
  adminSessionSecret,
  isAdminLinkGateEnabled,
  isAdminPanelConfigured,
} from "@/lib/admin/config";
import {
  ADMIN_GATE_TTL_SECONDS,
  ADMIN_SESSION_TTL_SECONDS,
  verifyAdminGateToken,
  verifyAdminSessionToken,
} from "@/lib/admin/session";

/**
 * `__Host-` pins the cookie to this exact origin and forbids a Domain
 * attribute, but the prefix also requires Secure, which plain-HTTP localhost
 * cannot satisfy. Development therefore falls back to the unprefixed name.
 */
const SECURE_COOKIE_NAME = "__Host-summit_admin";
const DEV_COOKIE_NAME = "summit_admin";
const SECURE_GATE_COOKIE_NAME = "__Host-summit_admin_gate";
const DEV_GATE_COOKIE_NAME = "summit_admin_gate";

function secureCookiesEnabled(): boolean {
  return process.env.NODE_ENV === "production";
}

export function adminCookieName(): string {
  return secureCookiesEnabled() ? SECURE_COOKIE_NAME : DEV_COOKIE_NAME;
}

export function adminGateCookieName(): string {
  return secureCookiesEnabled() ? SECURE_GATE_COOKIE_NAME : DEV_GATE_COOKIE_NAME;
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: secureCookiesEnabled(),
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  };
}

export async function hasAdminSession(): Promise<boolean> {
  if (!isAdminPanelConfigured()) return false;
  const secret = adminSessionSecret();
  if (!secret) return false;

  const store = await cookies();
  if (
    isAdminLinkGateEnabled() &&
    !verifyAdminGateToken(store.get(adminGateCookieName())?.value, secret)
  ) {
    // A session cookie without the gate cookie is not enough: the private link
    // stays a precondition for every read and every write, not just for the
    // first page render.
    return false;
  }
  return verifyAdminSessionToken(store.get(adminCookieName())?.value, secret);
}

/**
 * Whether this browser is allowed to see that the panel exists at all.
 *
 * With no access key configured the gate is open and `/admin` behaves as it
 * always has. With one configured, only a browser that followed the private
 * link carries the signed gate cookie; every other visitor gets a 404 from the
 * layout, so the login screen is not even discoverable.
 */
export async function hasAdminAccessGate(): Promise<boolean> {
  if (!isAdminLinkGateEnabled()) return true;
  const secret = adminSessionSecret();
  if (!secret) return false;

  const store = await cookies();
  return verifyAdminGateToken(
    store.get(adminGateCookieName())?.value,
    secret,
  );
}

export function adminGateCookieOptions() {
  return { ...adminCookieOptions(), maxAge: ADMIN_GATE_TTL_SECONDS };
}
