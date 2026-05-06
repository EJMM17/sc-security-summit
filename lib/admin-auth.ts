// =============================================================
// Admin auth — password-based sessions
// =============================================================
// Replaces the previous magic-link HMAC flow with email+password
// authentication backed by the public.admins table in Supabase.
//
// Flow:
//   1. /admin/login — operator types email + password
//   2. server verifies credentials against bcrypt hash in DB
//   3. on success, sets an HMAC-signed session cookie
//   4. /admin/* pages call requireAdmin(); unauthenticated users
//      are redirected to /admin/login
//
// Sessions live 7 days, are HttpOnly + Secure + SameSite=Strict.
// The session cookie contains a signed payload { email, exp, kind }.
// =============================================================

import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { createAdminClient } from "./supabase";

const SESSION_COOKIE = "scss_admin_session";
const SESSION_TTL_S = 60 * 60 * 24 * 7; // 7 days

let _devWarned = false;
function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[admin-auth] ADMIN_SESSION_SECRET must be set and >=32 chars in production",
    );
  }

  if (!_devWarned) {
    console.warn(
      "[admin-auth] ADMIN_SESSION_SECRET no configurado — usando fallback inseguro (solo dev)",
    );
    _devWarned = true;
  }
  return "DEV-INSECURE-fallback-secret-do-not-use-in-prod-32+chars";
}

export async function hashPassword(password: string): Promise<string> {
  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
  return bcrypt.hash(password, rounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function verifyAdminCredentials(
  email: string,
  password: string,
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admins")
    .select("email, password_hash, active")
    .eq("email", email.trim().toLowerCase())
    .single();

  if (error || !data || !data.active) return null;

  const valid = await verifyPassword(password, data.password_hash);
  if (!valid) return null;

  return data.email as string;
}

// ─── Token / cookie helpers ──────────────────────────────────────────────────

type TokenPayload = { email: string; exp: number; kind: "session" };

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

  // Verify the admin still exists and is active in the database
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admins")
    .select("email")
    .eq("email", payload.email)
    .eq("active", true)
    .single();

  if (error || !data) return null;
  return data.email as string;
}

export async function requireAdmin(): Promise<string> {
  const email = await getCurrentAdmin();
  if (!email) redirect("/admin/login");
  return email;
}
