import { beforeEach, describe, expect, it, vi } from "vitest";
import { corporateInquiryFixture } from "@/tests/inquiry-fixtures";

const { getClientMock } = vi.hoisted(() => ({
  getClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase-server", () => ({
  getSupabaseServerClient: getClientMock,
}));

import {
  claimInquiryNotification,
  claimDueInquiryNotifications,
  completeInquiryNotification,
  getNotificationStatus,
  getStoredInquiry,
  InquiryRepositoryError,
  persistInquiry,
  probeInquiryStorage,
  retentionDateFrom,
} from "@/server/repositories/inquiry-repository";
import { sponsorInquiryFixture } from "@/tests/inquiry-fixtures";

describe("retentionDateFrom", () => {
  it("adds 18 calendar months", () => {
    expect(retentionDateFrom(new Date("2026-07-29T12:00:00.000Z"))).toBe("2028-01-29");
  });

  it("clamps an end-of-month date", () => {
    expect(retentionDateFrom(new Date("2025-08-31T12:00:00.000Z"), 6)).toBe(
      "2026-02-28",
    );
  });
});

describe("inquiry repository RPC adapter", () => {
  const rpc = vi.fn();
  const from = vi.fn();

  beforeEach(() => {
    rpc.mockReset();
    from.mockReset();
    getClientMock.mockReset();
    getClientMock.mockReturnValue({ rpc, from });
  });

  it("passes the normalized inquiry to the atomic create RPC", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          inquiry_id: "02b99bb9-23ab-4c6e-8dc3-a5819ba65506",
          notification_id: "6b899fb2-5501-46ae-9621-d0d87983351d",
          outcome: "created",
        },
      ],
      error: null,
    });

    await expect(
      persistInquiry(
        corporateInquiryFixture,
        "a".repeat(64),
        new Date("2026-07-29T12:00:00.000Z"),
      ),
    ).resolves.toEqual({
      inquiryId: "02b99bb9-23ab-4c6e-8dc3-a5819ba65506",
      notificationId: "6b899fb2-5501-46ae-9621-d0d87983351d",
      outcome: "created",
    });
    expect(rpc).toHaveBeenCalledWith(
      "create_inquiry",
      expect.objectContaining({
        p_submission_id: corporateInquiryFixture.submissionId,
        p_payload_hash: "a".repeat(64),
        p_contact_name: "Ada Lovelace",
        p_requested_seats: 6,
        p_interest: undefined,
        p_retention_until: "2028-01-29",
        p_utm_source: "linkedin",
      }),
    );
  });

  it("returns a typed collision without a notification id", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          inquiry_id: "02b99bb9-23ab-4c6e-8dc3-a5819ba65506",
          notification_id: null,
          outcome: "conflict",
        },
      ],
      error: null,
    });

    await expect(
      persistInquiry(
        corporateInquiryFixture,
        "b".repeat(64),
        new Date("2026-07-29T12:00:00.000Z"),
      ),
    ).resolves.toEqual({
      inquiryId: "02b99bb9-23ab-4c6e-8dc3-a5819ba65506",
      outcome: "conflict",
    });
  });

  it("maps sponsor-only fields and absent attribution", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          inquiry_id: "02b99bb9-23ab-4c6e-8dc3-a5819ba65506",
          notification_id: "6b899fb2-5501-46ae-9621-d0d87983351d",
          outcome: "created",
        },
      ],
      error: null,
    });

    await persistInquiry(
      sponsorInquiryFixture,
      "c".repeat(64),
      new Date("2026-07-29T12:00:00.000Z"),
    );
    expect(rpc).toHaveBeenCalledWith(
      "create_inquiry",
      expect.objectContaining({
        p_contact_name: "Grace Hopper",
        p_interest: sponsorInquiryFixture.interest,
        p_job_title: undefined,
        p_requested_seats: undefined,
        p_utm_source: undefined,
      }),
    );
  });

  it("sanitizes database errors and rejects malformed create responses", async () => {
    rpc.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST000" },
    });
    await expect(
      persistInquiry(
        corporateInquiryFixture,
        "a".repeat(64),
        new Date("2026-07-29T12:00:00.000Z"),
      ),
    ).rejects.toMatchObject({ code: "PGRST000" });

    rpc.mockResolvedValueOnce({
      data: [{ unexpected: true }],
      error: null,
    });
    await expect(
      persistInquiry(
        corporateInquiryFixture,
        "a".repeat(64),
        new Date("2026-07-29T12:00:00.000Z"),
      ),
    ).rejects.toMatchObject({ code: "invalid_response" });

    rpc.mockResolvedValueOnce({
      data: [
        {
          inquiry_id: "02b99bb9-23ab-4c6e-8dc3-a5819ba65506",
          notification_id: null,
          outcome: "created",
        },
      ],
      error: null,
    });
    await expect(
      persistInquiry(
        corporateInquiryFixture,
        "a".repeat(64),
        new Date("2026-07-29T12:00:00.000Z"),
      ),
    ).rejects.toMatchObject({ code: "missing_notification" });
  });

  it("maps claimed due notifications and bounds the batch", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          notification_id: "6b899fb2-5501-46ae-9621-d0d87983351d",
          inquiry_id: "02b99bb9-23ab-4c6e-8dc3-a5819ba65506",
          attempt_number: 2,
          template: "corporate_internal_v1",
        },
      ],
      error: null,
    });

    await expect(claimDueInquiryNotifications(999)).resolves.toEqual([
      {
        notificationId: "6b899fb2-5501-46ae-9621-d0d87983351d",
        inquiryId: "02b99bb9-23ab-4c6e-8dc3-a5819ba65506",
        attemptNumber: 2,
        template: "corporate_internal_v1",
      },
    ]);
    expect(rpc).toHaveBeenCalledWith("claim_inquiry_notifications", { p_limit: 25 });
  });

  it("claims one notification or returns null when another worker owns it", async () => {
    rpc.mockResolvedValueOnce({
      data: [
        {
          notification_id: "6b899fb2-5501-46ae-9621-d0d87983351d",
          inquiry_id: "02b99bb9-23ab-4c6e-8dc3-a5819ba65506",
          attempt_number: 1,
          template: "corporate_internal_v1",
        },
      ],
      error: null,
    });
    await expect(
      claimInquiryNotification("6b899fb2-5501-46ae-9621-d0d87983351d"),
    ).resolves.toMatchObject({ attemptNumber: 1 });

    rpc.mockResolvedValueOnce({ data: [], error: null });
    await expect(
      claimInquiryNotification("6b899fb2-5501-46ae-9621-d0d87983351d"),
    ).resolves.toBeNull();
  });

  it("rejects RPC claim errors and malformed claim rows", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { code: "PGRST001" } });
    await expect(
      claimInquiryNotification("6b899fb2-5501-46ae-9621-d0d87983351d"),
    ).rejects.toMatchObject({ code: "PGRST001" });

    rpc.mockResolvedValueOnce({ data: "not-an-array", error: null });
    await expect(claimDueInquiryNotifications(0)).rejects.toMatchObject({
      code: "invalid_response",
    });

    rpc.mockResolvedValueOnce({ data: [{ invalid: true }], error: null });
    await expect(claimDueInquiryNotifications(10)).rejects.toMatchObject({
      code: "invalid_response",
    });
  });

  it("maps stored inquiry and notification status query results", async () => {
    const inquirySingle = vi.fn().mockResolvedValue({
      data: {
        id: "02b99bb9-23ab-4c6e-8dc3-a5819ba65506",
        kind: "corporate",
        contact_name: "Ada Lovelace",
        email: "ada@example.com",
        phone: "+52 899 123 4567",
        company: "Analytical Engines",
        language: "es",
        job_title: "Director",
        requested_seats: 6,
        interest: null,
      },
      error: null,
    });
    const statusSingle = vi.fn().mockResolvedValue({
      data: { status: "retry" },
      error: null,
    });
    from.mockImplementation((table: string) => ({
      select: () => ({
        eq: () => ({
          single: table === "inquiries" ? inquirySingle : statusSingle,
        }),
      }),
    }));

    await expect(
      getStoredInquiry("02b99bb9-23ab-4c6e-8dc3-a5819ba65506"),
    ).resolves.toMatchObject({
      contactName: "Ada Lovelace",
      requestedSeats: 6,
    });
    await expect(
      getNotificationStatus("6b899fb2-5501-46ae-9621-d0d87983351d"),
    ).resolves.toBe("retry");
  });

  it("rejects database query errors and malformed rows without returning raw data", async () => {
    const single = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: { code: "PGRST404" } })
      .mockResolvedValueOnce({ data: { id: "bad" }, error: null })
      .mockResolvedValueOnce({ data: null, error: { code: "PGRST404" } })
      .mockResolvedValueOnce({ data: { status: "unknown" }, error: null });
    from.mockReturnValue({
      select: () => ({ eq: () => ({ single }) }),
    });

    await expect(
      getStoredInquiry("02b99bb9-23ab-4c6e-8dc3-a5819ba65506"),
    ).rejects.toMatchObject({ code: "PGRST404" });
    await expect(
      getStoredInquiry("02b99bb9-23ab-4c6e-8dc3-a5819ba65506"),
    ).rejects.toMatchObject({ code: "invalid_response" });
    await expect(
      getNotificationStatus("6b899fb2-5501-46ae-9621-d0d87983351d"),
    ).rejects.toMatchObject({ code: "PGRST404" });
    await expect(
      getNotificationStatus("6b899fb2-5501-46ae-9621-d0d87983351d"),
    ).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("probes inquiry storage through the repository boundary", async () => {
    const abortSignal = vi.fn().mockResolvedValue({ data: null, error: null });
    from.mockReturnValue({
      select: () => ({
        limit: () => ({ abortSignal }),
      }),
    });
    const signal = new AbortController().signal;
    await expect(probeInquiryStorage(signal)).resolves.toBeUndefined();
    expect(abortSignal).toHaveBeenCalledWith(signal);

    abortSignal.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST503" },
    });
    await expect(probeInquiryStorage(signal)).rejects.toMatchObject({
      code: "PGRST503",
    });
  });

  it("clamps attempt duration to the database contract", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          notification_id: "6b899fb2-5501-46ae-9621-d0d87983351d",
          status: "sent",
          attempt_count: 1,
        },
      ],
      error: null,
    });

    await completeInquiryNotification({
      notificationId: "6b899fb2-5501-46ae-9621-d0d87983351d",
      attemptNumber: 1,
      result: "sent",
      durationMs: Number.MAX_SAFE_INTEGER,
      providerMessageId: "provider-id",
    });
    expect(rpc).toHaveBeenCalledWith(
      "complete_inquiry_notification",
      expect.objectContaining({ p_duration_ms: 900_000 }),
    );
  });

  it("rejects completion errors and malformed completion responses", async () => {
    const input = {
      notificationId: "6b899fb2-5501-46ae-9621-d0d87983351d",
      attemptNumber: 1,
      result: "retry" as const,
      durationMs: -100,
      errorCode: "provider_timeout",
      nextAttemptAt: "2026-07-29T12:01:00.000Z",
    };
    rpc.mockResolvedValueOnce({ data: null, error: { code: "PGRST500" } });
    await expect(completeInquiryNotification(input)).rejects.toMatchObject({
      code: "PGRST500",
    });
    expect(rpc).toHaveBeenLastCalledWith(
      "complete_inquiry_notification",
      expect.objectContaining({ p_duration_ms: 0 }),
    );

    rpc.mockResolvedValueOnce({ data: [{ status: "unknown" }], error: null });
    await expect(completeInquiryNotification(input)).rejects.toMatchObject({
      code: "invalid_response",
    });
  });

  it("falls back to a non-sensitive code for malformed errors", () => {
    expect(new InquiryRepositoryError("test", null).code).toBe("database_error");
    expect(
      new InquiryRepositoryError("test", { code: "ada@example.com" }).code,
    ).toBe("database_error");
  });
});
