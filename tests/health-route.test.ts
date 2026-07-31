import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { probeStorageMock } = vi.hoisted(() => ({
  probeStorageMock: vi.fn(),
}));

vi.mock("@/server/repositories/inquiry-repository", () => ({
  probeInquiryStorage: probeStorageMock,
}));

import { GET } from "@/app/api/health/route";
import { resetHealthProbeCacheForTests } from "@/lib/health-readiness";

describe("GET /api/health", () => {
  beforeEach(() => {
    probeStorageMock.mockReset();
    resetHealthProbeCacheForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns healthy when inquiry storage responds", async () => {
    probeStorageMock.mockResolvedValue(undefined);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=0, s-maxage=30, stale-while-revalidate=60",
    );
    expect(await response.json()).toMatchObject({
      ok: true,
      service: "sc-security-summit",
      status: "healthy",
    });
    expect(probeStorageMock.mock.calls[0][0]).toBeInstanceOf(AbortSignal);
  });

  it("returns a privacy-safe 503 when configuration is absent", async () => {
    probeStorageMock.mockRejectedValue(
      new Error("SUPABASE_SECRET_KEY with-sensitive-value"),
    );
    const response = await GET();
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body).toMatchObject({
      ok: false,
      service: "sc-security-summit",
      status: "unavailable",
    });
    expect(JSON.stringify(body)).not.toContain("SUPABASE_SECRET_KEY");
    expect(JSON.stringify(body)).not.toContain("with-sensitive-value");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=0, s-maxage=5, stale-while-revalidate=10",
    );
  });

  it("returns 503 without exposing a database error", async () => {
    probeStorageMock.mockRejectedValue(
      new Error("row ada@example.com failed"),
    );
    const response = await GET();
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("ada@example.com");
  });

  it("times out a hanging dependency after three seconds", async () => {
    vi.useFakeTimers();
    probeStorageMock.mockImplementation(
      () => new Promise<void>(() => undefined),
    );

    const responsePromise = GET();
    await vi.advanceTimersByTimeAsync(0);
    const signal = probeStorageMock.mock.calls[0][0] as AbortSignal;
    expect(signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(3_000);
    const response = await responsePromise;
    expect(response.status).toBe(503);
    expect(signal.aborted).toBe(true);
    expect(await response.json()).toMatchObject({
      ok: false,
      status: "unavailable",
    });
  });

  it("coalesces concurrent probes and reuses a healthy snapshot", async () => {
    let finishProbe: (() => void) | undefined;
    probeStorageMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishProbe = resolve;
        }),
    );

    const first = GET();
    const second = GET();
    await vi.waitFor(() => expect(probeStorageMock).toHaveBeenCalledOnce());
    finishProbe?.();

    const [firstResponse, secondResponse] = await Promise.all([first, second]);
    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(probeStorageMock).toHaveBeenCalledOnce();

    expect((await GET()).status).toBe(200);
    expect(probeStorageMock).toHaveBeenCalledOnce();
  });

  it("retries an unavailable dependency after the short failure TTL", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T12:00:00.000Z"));
    probeStorageMock
      .mockRejectedValueOnce(new Error("unavailable"))
      .mockResolvedValueOnce(undefined);

    expect((await GET()).status).toBe(503);
    expect((await GET()).status).toBe(503);
    expect(probeStorageMock).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(5_001);
    expect((await GET()).status).toBe(200);
    expect(probeStorageMock).toHaveBeenCalledTimes(2);
  });
});
