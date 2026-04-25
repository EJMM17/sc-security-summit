import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

// =============================================================
// GET /api/health
// =============================================================
// Lightweight liveness/readiness check.
//   • returns 200 { ok: true, ... } when Supabase is reachable and the
//     `registros` table responds to a count query within the budget
//   • returns 503 { ok: false, error } on any failure so Vercel uptime
//     monitors and the on-page status banner can react
//
// Intentionally never returns row data — only a count. Bypass cache via
// vercel.json /api/* no-store header so the check always hits origin.
// =============================================================

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TIMEOUT_MS = 3000;

export async function GET() {
  const startedAt = Date.now();

  try {
    const supabase = createAdminClient();

    // Race the DB query against a hard timeout so a slow Supabase doesn't
    // make the health endpoint itself slow.
    const dbCheck = supabase
      .from("registros")
      .select("*", { count: "exact", head: true });

    const result = await Promise.race([
      dbCheck,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`db timeout after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
      ),
    ]);

    if (result.error) {
      throw new Error(`supabase error: ${result.error.message}`);
    }

    return NextResponse.json(
      {
        ok: true,
        service: "sc-security-summit",
        durationMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        service: "sc-security-summit",
        error: err instanceof Error ? err.message : "unknown",
        durationMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
