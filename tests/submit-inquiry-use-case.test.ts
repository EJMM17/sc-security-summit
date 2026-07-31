import { beforeEach, describe, expect, it, vi } from "vitest";
import { RateLimitError } from "@/lib/rate-limit";
import { submitInquiryUseCase } from "@/server/use-cases/submit-inquiry";
import { corporateInquiryFixture } from "@/tests/inquiry-fixtures";
import type { PersistInquiryResult } from "@/server/repositories/inquiry-repository";

function dependencies() {
  return {
    getIp: vi.fn(async () => "203.0.113.10"),
    rateLimit: vi.fn(async () => undefined),
    hashPayload: vi.fn(() => "a".repeat(64)),
    persist: vi.fn(
      async (): Promise<PersistInquiryResult> => ({
        outcome: "created",
        inquiryId: "02b99bb9-23ab-4c6e-8dc3-a5819ba65506",
        notificationId: "6b899fb2-5501-46ae-9621-d0d87983351d",
      }),
    ),
    notify: vi.fn(async (): Promise<"sent" | "queued"> => "sent"),
    now: vi.fn(() => new Date("2026-07-29T12:00:00.000Z")),
  };
}

describe("submitInquiryUseCase", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("persists before sending and returns sent", async () => {
    const deps = dependencies();
    const callOrder: string[] = [];
    deps.persist.mockImplementation(async () => {
      callOrder.push("persist");
      return {
        outcome: "created",
        inquiryId: "02b99bb9-23ab-4c6e-8dc3-a5819ba65506",
        notificationId: "6b899fb2-5501-46ae-9621-d0d87983351d",
      };
    });
    deps.notify.mockImplementation(async () => {
      callOrder.push("notify");
      return "sent";
    });

    await expect(submitInquiryUseCase(corporateInquiryFixture, deps)).resolves.toEqual({
      ok: true,
      inquiryId: "02b99bb9-23ab-4c6e-8dc3-a5819ba65506",
      notification: "sent",
    });
    expect(callOrder).toEqual(["persist", "notify"]);
    expect(deps.rateLimit).toHaveBeenCalledWith("inquiry:203.0.113.10");
  });

  it("returns success with queued when immediate email processing fails", async () => {
    const deps = dependencies();
    deps.notify.mockRejectedValue(new Error("provider unavailable"));

    await expect(submitInquiryUseCase(corporateInquiryFixture, deps)).resolves.toEqual({
      ok: true,
      inquiryId: "02b99bb9-23ab-4c6e-8dc3-a5819ba65506",
      notification: "queued",
    });
  });

  it("does not notify when persistence fails", async () => {
    const deps = dependencies();
    deps.persist.mockRejectedValue(Object.assign(new Error("db failed"), { code: "PGRST000" }));

    await expect(submitInquiryUseCase(corporateInquiryFixture, deps)).resolves.toEqual({
      ok: false,
      reason: "storage_unavailable",
    });
    expect(deps.notify).not.toHaveBeenCalled();
  });

  it("returns the original record for an idempotent replay", async () => {
    const deps = dependencies();
    deps.persist.mockResolvedValue({
      outcome: "replayed",
      inquiryId: "02b99bb9-23ab-4c6e-8dc3-a5819ba65506",
      notificationId: "6b899fb2-5501-46ae-9621-d0d87983351d",
    });
    deps.notify.mockResolvedValue("queued");

    const result = await submitInquiryUseCase(corporateInquiryFixture, deps);
    expect(result).toEqual({
      ok: true,
      inquiryId: "02b99bb9-23ab-4c6e-8dc3-a5819ba65506",
      notification: "queued",
    });
  });

  it("rejects a reused UUID with a different payload", async () => {
    const deps = dependencies();
    deps.persist.mockResolvedValue({
      outcome: "conflict",
      inquiryId: "02b99bb9-23ab-4c6e-8dc3-a5819ba65506",
    });

    await expect(submitInquiryUseCase(corporateInquiryFixture, deps)).resolves.toEqual({
      ok: false,
      reason: "idempotency_conflict",
    });
    expect(deps.notify).not.toHaveBeenCalled();
  });

  it("rate limits before persistence", async () => {
    const deps = dependencies();
    deps.rateLimit.mockRejectedValue(new RateLimitError(60_000));

    await expect(submitInquiryUseCase(corporateInquiryFixture, deps)).resolves.toEqual({
      ok: false,
      reason: "rate_limited",
    });
    expect(deps.persist).not.toHaveBeenCalled();
  });

  it("maps an unexpected rate-limit dependency failure", async () => {
    const deps = dependencies();
    deps.getIp.mockRejectedValue(new Error("headers unavailable"));
    await expect(submitInquiryUseCase(corporateInquiryFixture, deps)).resolves.toEqual({
      ok: false,
      reason: "unexpected",
    });
    expect(deps.persist).not.toHaveBeenCalled();
  });

  it("uses the default clock and sanitizes an untyped storage failure", async () => {
    const deps = dependencies();
    deps.persist.mockRejectedValue(new Error("ada@example.com"));
    const { now, ...withoutClock } = deps;
    void now;

    await expect(
      submitInquiryUseCase(corporateInquiryFixture, withoutClock),
    ).resolves.toEqual({
      ok: false,
      reason: "storage_unavailable",
    });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"code":"storage_error"'),
    );
  });
});
