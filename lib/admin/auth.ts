import "server-only";

import { cookies } from "next/headers";
import { adminSessionSecret, isAdminPanelConfigured } from "@/lib/admin/config";
import {
  ADMIN_SESSION_TTL_SECONDS,
  verifyAdminSessionToken,
} from "@/lib/admin/session";

/**
 * `__Host-` pins the cookie to this exact origin and forbids a Domain
 * attribute, but the prefix also requires Secure, which plain-HTTP localhost
 * cannot satisfy. Development therefore falls back to the unprefixed name.
 */
const SECURE_COOKIE_NAME = "__Host-summit_admin";
const DEV_COOKIE_NAME = "summit_admin";

function secureCookiesEnabled(): boolean {
  return process.env.NODE_ENV === "production";
}

export function adminCookieName(): string {
  return secureCookiesEnabled() ? SECURE_COOKIE_NAME : DEV_COOKIE_NAME;
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
  return verifyAdminSessionToken(store.get(adminCookieName())?.value, secret);
}
