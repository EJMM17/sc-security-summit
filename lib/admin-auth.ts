// =============================================================
// Admin auth — Server-only (Node runtime)
// =============================================================
// Wraps the Edge-safe session primitives in lib/admin-session with
// the Node-only pieces: bcrypt, the Supabase client, and the
// next/headers cookie jar. The middleware MUST import directly
// from lib/admin-session to avoid bundling bcryptjs into the Edge
// runtime.
// =============================================================

import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { createAdminClient } from "./supabase";
import {
  ADMIN_COOKIE_NAME,
  SESSION_TTL_S,
  type AdminSession,
  signSession,
  verifySessionToken,
} from "./admin-session";

export type { AdminSession } from "./admin-session";
export { verifyAdminSession } from "./admin-session";

export async function getCurrentAdmin(): Promise<AdminSession | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getCurrentAdmin();
  if (!session) redirect("/admin/login");
  return session;
}

export async function setSessionCookie(admin: AdminSession): Promise<void> {
  const token = await signSession(admin);
  const jar = await cookies();
  jar.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_S,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE_NAME);
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
): Promise<AdminSession | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admins")
    .select("id, email, password_hash, nombre, active")
    .eq("email", email.toLowerCase().trim())
    .eq("active", true)
    .single();

  if (!data) return null;

  const valid = await verifyPassword(password, data.password_hash as string);
  if (!valid) return null;

  return {
    id: data.id as string,
    email: data.email as string,
    nombre: (data.nombre as string) ?? "",
  };
}
