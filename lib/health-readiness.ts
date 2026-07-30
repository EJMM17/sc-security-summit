import "server-only";

const HEALTH_TIMEOUT_MS = 3_000;
const HEALTHY_TTL_MS = 30_000;
const UNAVAILABLE_TTL_MS = 5_000;

export type HealthSnapshot = {
  ok: boolean;
  checkedAt: number;
  durationMs: number;
};

let cachedSnapshot: HealthSnapshot | null = null;
let inFlightProbe: Promise<HealthSnapshot> | null = null;

async function probeInquiryStorage(signal: AbortSignal): Promise<void> {
  // Keep the repository lazy so builds without runtime secrets can import the
  // public route safely.
  const repository = await import("@/server/repositories/inquiry-repository");
  await repository.probeInquiryStorage(signal);
}

async function withTimeout(
  operation: (signal: AbortSignal) => Promise<void>,
  timeoutMs: number,
): Promise<void> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
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
    if (timeout) clearTimeout(timeout);
  }
}

function snapshotTtl(snapshot: HealthSnapshot): number {
  return snapshot.ok ? HEALTHY_TTL_MS : UNAVAILABLE_TTL_MS;
}

/**
 * Coalesces concurrent readiness checks and briefly reuses the privacy-safe
 * result so the public health endpoint cannot amplify traffic to Supabase.
 */
export async function readHealthSnapshot(): Promise<HealthSnapshot> {
  const now = Date.now();
  if (
    cachedSnapshot &&
    now - cachedSnapshot.checkedAt < snapshotTtl(cachedSnapshot)
  ) {
    return cachedSnapshot;
  }
  if (inFlightProbe) return inFlightProbe;

  const startedAt = Date.now();
  inFlightProbe = (async () => {
    let ok = false;
    try {
      await withTimeout(probeInquiryStorage, HEALTH_TIMEOUT_MS);
      ok = true;
    } catch {
      // The public response intentionally exposes no provider detail.
    }

    const checkedAt = Date.now();
    cachedSnapshot = {
      ok,
      checkedAt,
      durationMs: checkedAt - startedAt,
    };
    return cachedSnapshot;
  })();

  try {
    return await inFlightProbe;
  } finally {
    inFlightProbe = null;
  }
}

export function resetHealthProbeCacheForTests(): void {
  cachedSnapshot = null;
  inFlightProbe = null;
}
