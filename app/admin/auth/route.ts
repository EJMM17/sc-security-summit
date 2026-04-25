import { NextResponse, type NextRequest } from "next/server";
import { consumeLoginToken, isAllowedEmail, setSessionCookie } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /admin/auth?t=<signed token>
// Verifies the magic-link token and (on success) sets the session cookie,
// then redirects into the dashboard. On any failure we redirect back to
// /admin/login with ?error=invalid — the failure reason isn't disclosed.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t") ?? "";

  const email = consumeLoginToken(token);
  if (!email || !isAllowedEmail(email)) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid", req.url));
  }

  await setSessionCookie(email);
  return NextResponse.redirect(new URL("/admin/registros", req.url));
}
