// =============================================================
// Admin session — Edge-compatible primitives (Web Crypto only)
// =============================================================
// This module is intentionally free of next/headers, bcrypt and
// Supabase imports so it can be pulled into the Edge runtime (the
// middleware) without bringing Node-only dependencies along.
// =============================================================

export type AdminSession = { id: string; email: string; nombre: string };

export const ADMIN_COOKIE_NAME = "admin_session";
export const SESSION_TTL_S = 60 * 60 * 8; // 8 hours

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[admin-session] ADMIN_SESSION_SECRET must be set and >=32 chars in production",
      );
    }
    return "DEV-INSECURE-fallback-secret-do-not-use-in-prod-32+chars";
  }
  return secret;
}

function b64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const bin = atob(str.replaceAll("-", "+").replaceAll("_", "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return b64urlEncode(new Uint8Array(sig));
}

async function hmacVerify(data: string, sig: string, secret: string): Promise<boolean> {
  const expected = await hmacSign(data, secret);
  if (expected.length !== sig.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return mismatch === 0;
}

type TokenPayload = AdminSession & { exp: number };

export async function signSession(session: AdminSession): Promise<string> {
  const payload: TokenPayload = {
    ...session,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_S,
  };
  const body = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmacSign(body, getSecret());
  return `${body}.${sig}`;
}

export async function verifySessionToken(token: string): Promise<AdminSession | null> {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  if (!(await hmacVerify(body, sig, getSecret()))) return null;

  try {
    const decoded = new TextDecoder().decode(b64urlDecode(body));
    const payload = JSON.parse(decoded) as TokenPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (typeof payload.id !== "string" || typeof payload.email !== "string") return null;
    return { id: payload.id, email: payload.email, nombre: payload.nombre ?? "" };
  } catch {
    return null;
  }
}

function extractCookie(cookieHeader: string | null | undefined): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]+)`),
  );
  return match?.[1];
}

// Edge-compatible. Called from middleware with `request.headers.get('cookie')`.
export async function verifyAdminSession(
  cookieHeader: string | null | undefined,
): Promise<AdminSession | null> {
  const token = extractCookie(cookieHeader);
  if (!token) return null;
  return verifySessionToken(token);
}
