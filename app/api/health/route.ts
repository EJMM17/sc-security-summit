import { NextResponse } from "next/server";

// =============================================================
// GET /api/health
// =============================================================
// Lightweight liveness check for Vercel uptime monitors.
//   • returns 200 { ok: true, ... } while the app is serving requests
//
// The site has no runtime database dependency: ticketing lives in
// Eventbrite and the inquiry forms deliver over Resend, so there is
// nothing to probe beyond the app itself. Resend failures surface in
// Sentry (see lib/email.ts), not here.
// =============================================================

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export function GET() {
  const startedAt = Date.now();

  return NextResponse.json(
    {
      ok: true,
      service: "sc-security-summit",
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    { status: 200, headers: NO_STORE },
  );
}
