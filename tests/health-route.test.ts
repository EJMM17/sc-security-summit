import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { probeStorageMock } = vi.hoisted(() => ({
  probeStorageMock: vi.fn(),
}));

vi.mock("@/server/repositories/inquiry-repository", () => ({
  probeInquiryStorage: probeStorageMock,
}));

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  beforeEach(() => {
    probeStorageMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns healthy when inquiry storage responds", async () => {
    probeStorageMock.mockResolvedValue(undefined);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
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
});
