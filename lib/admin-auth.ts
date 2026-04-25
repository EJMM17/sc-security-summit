// =============================================================
// Admin auth — HMAC-signed magic-link sessions
// =============================================================
// Lightweight passwordless auth for the organizer dashboard. No
// dependency on Supabase Auth or NextAuth — every step is custom but
// deliberately minimal:
//
//   1. /admin/login — operator types their email
//   2. server checks the email is in ADMIN_EMAILS (csv) allowlist
//   3. server mints a signed token { email, exp } and emails the link
//   4. /admin/auth?t=... verifies the HMAC, sets a session cookie that
//      itself is HMAC-signed with the same secret
//   5. /admin/* pages call requireAdmin(); the layout redirects to
//      /admin/login when unauthenticated
//
// Threat model: the token IS the auth — anyone with the link can log
// in. So tokens expire in 15 min, are single-purpose (login only), and
// the email is sent to a known operator address only. Sessions live for
// 7 days, are HttpOnly + Secure + SameSite=Strict.
// =============================================================

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "scss_admin_session";
const SESSION_TTL_S = 60 * 60 * 24 * 7; // 7 days
const LOGIN_TOKEN_TTL_S = 60 * 15; // 15 minutes

let _devWarned = false;
function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[admin-auth] ADMIN_SESSION_SECRET must be set and >=32 chars in production",
    );
  }

  // Dev fallback. The secret is per-process (hostname) but otherwise stable
  // so reloads don't invalidate sessions during local dev. NEVER ship to prod.
  if (!_devWarned) {
    console.warn(
      "[admin-auth] ADMIN_SESSION_SECRET no configurado — usando fallback inseguro (solo dev)",
    );
    _devWarned = true;
  }
  return "DEV-INSECURE-fallback-secret-do-not-use-in-prod-32+chars";
}

export function getAllowlist(): string[] {
  const list = process.env.ADMIN_EMAILS ?? process.env.CONTACT_EMAIL ?? "";
  return list
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedEmail(email: string): boolean {
  return getAllowlist().includes(email.trim().toLowerCase());
}

// ─── Token / cookie helpers ──────────────────────────────────────────────────

type TokenPayload = { email: string; exp: number; kind: "login" | "session" };

function base64url(bytes: Buffer): string {
  return bytes.toString("base64").replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64url(str: string): Buffer {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  return Buffer.from(str.replaceAll("-", "+").replaceAll("_", "/") + pad, "base64");
}

function sign(payload: TokenPayload): string {
  const body = base64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = base64url(createHmac("sha256", getSecret()).update(body).digest());
  return `${body}.${sig}`;
}

function verify(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;

  const expected = base64url(createHmac("sha256", getSecret()).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(fromBase64url(body).toString("utf8")) as TokenPayload;
    if (typeof payload.email !== "string" || typeof payload.exp !== "number") return null;
    if (Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function mintLoginToken(email: string): string {
  return sign({
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + LOGIN_TOKEN_TTL_S,
    kind: "login",
  });
}

export function consumeLoginToken(token: string): string | null {
  const payload = verify(token);
  if (!payload || payload.kind !== "login") return null;
  return payload.email;
}

export async function setSessionCookie(email: string): Promise<void> {
  const token = sign({
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_S,
    kind: "session",
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: SESSION_TTL_S,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentAdmin(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verify(token);
  if (!payload || payload.kind !== "session") return null;
  if (!isAllowedEmail(payload.email)) return null;
  return payload.email;
}

export async function requireAdmin(): Promise<string> {
  const email = await getCurrentAdmin();
  if (!email) redirect("/admin/login");
  return email;
}

// ─── Magic link URL ──────────────────────────────────────────────────────────

export function buildLoginUrl(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${base}/admin/auth?t=${encodeURIComponent(token)}`;
}
