import { NextResponse } from "next/server";
import { readHealthSnapshot } from "@/lib/health-readiness";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const HEALTHY_CACHE_CONTROL =
  "public, max-age=0, s-maxage=30, stale-while-revalidate=60";
const UNAVAILABLE_CACHE_CONTROL =
  "public, max-age=0, s-maxage=5, stale-while-revalidate=10";

export async function GET() {
  const snapshot = await readHealthSnapshot();
  if (snapshot.ok) {
    return NextResponse.json(
      {
        ok: true,
        service: "sc-security-summit",
        status: "healthy",
        durationMs: snapshot.durationMs,
        timestamp: new Date(snapshot.checkedAt).toISOString(),
      },
      {
        status: 200,
        headers: { "Cache-Control": HEALTHY_CACHE_CONTROL },
      },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      service: "sc-security-summit",
      status: "unavailable",
      durationMs: snapshot.durationMs,
      timestamp: new Date(snapshot.checkedAt).toISOString(),
    },
    {
      status: 503,
      headers: { "Cache-Control": UNAVAILABLE_CACHE_CONTROL },
    },
  );
}
