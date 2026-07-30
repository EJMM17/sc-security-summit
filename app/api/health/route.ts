import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };
const HEALTH_TIMEOUT_MS = 3_000;

async function probeInquiryStorage(signal: AbortSignal): Promise<void> {
  // Keep the repository lazy so builds without runtime
  // secrets can import this route safely.
  const repository = await import("@/server/repositories/inquiry-repository");
  await repository.probeInquiryStorage(signal);
}

async function withTimeout(
  operation: (signal: AbortSignal) => Promise<void>,
  timeoutMs: number,
): Promise<void> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout>;
  try {
    await Promise.race([
      operation(controller.signal),
      new Promise<void>((_resolve, reject) => {
        timeout = setTimeout(
          () => {
            controller.abort();
            reject(new Error("health_timeout"));
          },
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout!);
  }
}

export async function GET() {
  const startedAt = Date.now();

  try {
    await withTimeout(probeInquiryStorage, HEALTH_TIMEOUT_MS);
    return NextResponse.json(
      {
        ok: true,
        service: "sc-security-summit",
        status: "healthy",
        durationMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: NO_STORE },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        service: "sc-security-summit",
        status: "unavailable",
        durationMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: NO_STORE },
    );
  }
}
