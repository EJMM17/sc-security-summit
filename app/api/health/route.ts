import { NextResponse } from "next/server";

// =============================================================
// GET /api/health
// =============================================================
// Lightweight liveness/readiness check.
//   • returns 200 { ok: true, ... } when Supabase is reachable and the
//     `registros` table responds to a count query within the budget
//   • returns 503 { ok: false, error } on any failure so Vercel uptime
//     monitors and the on-page status banner can react
//
// Build hardening: imports de `@/lib/supabase` (y por transitivo de
// `@/env`) se hacen DENTRO del handler con `await import(...)`. Eso
// garantiza que durante "Collecting page data" Next.js no evalúe ningún
// código que dependa de variables de entorno — sólo el shape del
// módulo (exports `dynamic`, `runtime`) se inspecciona estáticamente.
// =============================================================

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const TIMEOUT_MS = 3000;

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export async function GET() {
  const startedAt = Date.now();

  try {
    const { createAdminClient } = await import("@/lib/supabase");
    const supabase = createAdminClient();

    const dbCheck = supabase
      .from("registros")
      .select("*", { count: "exact", head: true });

    const result = await Promise.race([
      dbCheck,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`db timeout after ${TIMEOUT_MS}ms`)),
          TIMEOUT_MS,
        ),
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
      { status: 200, headers: NO_STORE },
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
      { status: 503, headers: NO_STORE },
    );
  }
}
