import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Web Crypto API (Edge Runtime compatible — not Node's crypto module)
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const nonce = btoa(String.fromCharCode(...array));

  // Nonce-based CSP: script-src no longer needs 'unsafe-inline'.
  // style-src retains 'unsafe-inline' because Tailwind + inline style props require it.
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "frame-src https://www.google.com https://maps.google.com https://challenges.cloudflare.com",
    "connect-src 'self' https://*.supabase.co https://vitals.vercel-insights.com https://challenges.cloudflare.com",
    "form-action 'self'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
  ].join("; ");

  const response = NextResponse.next();
  response.headers.set("x-nonce", nonce);
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
