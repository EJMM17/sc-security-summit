import { NextResponse, type NextRequest } from "next/server";
import {
  adminGateCookieName,
  adminGateCookieOptions,
} from "@/lib/admin/auth";
import {
  adminAccessKey,
  adminSessionSecret,
  isAdminLinkGateEnabled,
  isAdminPanelConfigured,
} from "@/lib/admin/config";
import { accessKeyMatches, createAdminGateToken } from "@/lib/admin/session";
import { checkRateLimit, getClientIp, RateLimitError } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * The private entrance to the panel.
 *
 * `/admin/acceso?k=<ADMIN_ACCESS_KEY>` mints the signed gate cookie and sends
 * the operator to the ordinary password login. Every other request — wrong
 * key, missing key, gate disabled — answers 404, exactly like the rest of
 * `/admin` does for a browser that never followed the link, so the route never
 * confirms that a panel is deployed here.
 *
 * The key travels in the URL, which is why it grants nothing on its own: it
 * only makes the login reachable.
 */
function notFound(): NextResponse {
  return new NextResponse("Not Found", {
    status: 404,
    headers: { "cache-control": "no-store" },
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAdminPanelConfigured() || !isAdminLinkGateEnabled()) return notFound();

  const expected = adminAccessKey();
  const secret = adminSessionSecret();
  if (!expected || !secret) return notFound();

  try {
    await checkRateLimit(`admin-access:${await getClientIp()}`);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "cache-control": "no-store" },
      });
    }
    return notFound();
  }

  const candidate = request.nextUrl.searchParams.get("k");
  if (typeof candidate !== "string" || !accessKeyMatches(candidate, expected)) {
    return notFound();
  }

  // Redirect without the key so it leaves the address bar, the referrer and
  // the browser history entry the operator keeps.
  const response = NextResponse.redirect(new URL("/admin/login", request.url), {
    status: 303,
  });
  response.headers.set("cache-control", "no-store");
  response.cookies.set(
    adminGateCookieName(),
    createAdminGateToken(secret),
    adminGateCookieOptions(),
  );
  return response;
}
