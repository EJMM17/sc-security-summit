import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminSession } from "@/lib/admin-session";

export async function middleware(request: NextRequest) {
  // ─── Admin guard (runs first) ─────────────────────────────────────────────
  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    !request.nextUrl.pathname.startsWith("/admin/login") &&
    !request.nextUrl.pathname.startsWith("/admin/logout")
  ) {
    const session = await verifyAdminSession(request.headers.get("cookie"));
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Web Crypto API (Edge Runtime compatible — not Node's crypto module)
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const nonce = btoa(String.fromCharCode(...array));

  // Nonce-based CSP: script-src no longer needs 'unsafe-inline'.
  // style-src retains 'unsafe-inline' because Tailwind + inline style props require it.
  // CSP allowlist notes:
  //   script-src  GTM/GA + Google Ads (googleadservices, doubleclick) + Meta + LinkedIn
  //   img-src     conversion/remarketing pixels (google, doubleclick)
  //   connect-src GA4 (incl. regional *.google-analytics.com endpoints) + Ads beacons
  //   frame-src   Ads remarketing iframes (doubleclick)
  // Keep this in sync with docs/TRACKING.md. Validate at csp-evaluator.withgoogle.com.
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://connect.facebook.net https://snap.licdn.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com https://www.google.com https://www.google.com.mx https://www.googleadservices.com https://googleads.g.doubleclick.net https://*.g.doubleclick.net https://www.facebook.com https://px.ads.linkedin.com",
    "frame-src https://www.google.com https://maps.google.com https://www.googletagmanager.com https://td.doubleclick.net https://bid.g.doubleclick.net",
    "connect-src 'self' https://*.supabase.co https://vitals.vercel-insights.com https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://*.g.doubleclick.net https://stats.g.doubleclick.net https://www.facebook.com https://px.ads.linkedin.com",
    "form-action 'self'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const response = NextResponse.next();
  response.headers.set("x-nonce", nonce);
  // Layouts can't read searchParams, so forward ?lang= as a header — keeps
  // SSR <html lang> in sync with the content language on first visit
  // (hreflang/social-share traffic arrives with ?lang=en and no cookie).
  const langParam = request.nextUrl.searchParams.get("lang");
  if (langParam === "es" || langParam === "en") {
    response.headers.set("x-lang", langParam);
  }
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|images/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
