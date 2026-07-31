import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  claimOne: vi.fn(),
  claimDue: vi.fn(),
  complete: vi.fn(),
  getStatus: vi.fn(),
  getInquiry: vi.fn(),
  send: vi.fn(),
  record: vi.fn(),
}));

vi.mock("@/server/repositories/inquiry-repository", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/server/repositories/inquiry-repository")>();
  return {
    ...original,
    claimInquiryNotification: mocks.claimOne,
    claimDueInquiryNotifications: mocks.claimDue,
    completeInquiryNotification: mocks.complete,
    getNotificationStatus: mocks.getStatus,
    getStoredInquiry: mocks.getInquiry,
  };
});

vi.mock("@/lib/email", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/email")>();
  return { ...original, sendEmail: mocks.send };
});

vi.mock("@/server/services/inquiry-observability", () => ({
  recordInquiryEvent: mocks.record,
}));

import {
  processDueInquiryNotifications,
  tryImmediateInquiryNotification,
} from "@/server/services/inquiry-notifier";
import type {
  ClaimedInquiryNotification,
  StoredInquiry,
} from "@/server/repositories/inquiry-repository";

const CORPORATE: StoredInquiry = {
  id: "02b99bb9-23ab-4c6e-8dc3-a5819ba65506",
  kind: "corporate",
  contactName: "Ada Lovelace",
  email: "ada@example.com",
  phone: "+52 899 123 4567",
  company: "Analytical Engines",
  language: "es",
  jobTitle: "Director",
  requestedSeats: 6,
  interest: null,
};

function claim(
  suffix: number,
  template = "corporate_internal_v1",
): ClaimedInquiryNotification {
  return {
    notificationId: `6b899fb2-5501-46ae-9621-d0d8798335${suffix
      .toString()
      .padStart(2, "0")}`,
    inquiryId: CORPORATE.id,
    attemptNumber: 1,
    template,
  };
}

describe("notification orchestration", () => {
  beforeEach(() => {
    process.env.CONTACT_EMAIL = "operations@example.com";
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getInquiry.mockResolvedValue(CORPORATE);
    mocks.complete.mockResolvedValue("sent");
    mocks.send.mockResolvedValue({ ok: true, id: "provider-id" });
  });

  afterEach(() => {
    delete process.env.CONTACT_EMAIL;
  });

  it("processes a claimed immediate notification", async () => {
    mocks.claimOne.mockResolvedValue(claim(1));
    await expect(
      tryImmediateInquiryNotification(claim(1).notificationId),
    ).resolves.toBe("sent");
    expect(mocks.send).toHaveBeenCalledOnce();
  });

  it.each([
    ["sent", "sent"],
    ["retry", "queued"],
    ["dead", "queued"],
  ])("maps an already-owned %s notification to %s", async (status, expected) => {
    mocks.claimOne.mockResolvedValue(null);
    mocks.getStatus.mockResolvedValue(status);
    await expect(
      tryImmediateInquiryNotification(claim(1).notificationId),
    ).resolves.toBe(expected);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("summarizes sent, queued, and dead work from one claimed batch", async () => {
    const claims = [claim(1), claim(2), claim(3)];
    mocks.claimDue.mockResolvedValue(claims);
    mocks.send
      .mockResolvedValueOnce({ ok: true, id: "provider-id" })
      .mockResolvedValueOnce({
        ok: false,
        code: "provider_timeout",
      })
      .mockResolvedValueOnce({
        ok: false,
        code: "validation_error",
      });
    mocks.complete
      .mockResolvedValueOnce("sent")
      .mockResolvedValueOnce("retry")
      .mockResolvedValueOnce("dead");

    await expect(processDueInquiryNotifications()).resolves.toEqual({
      claimed: 3,
      sent: 1,
      queued: 1,
      dead: 1,
      failed: 0,
    });
    expect(mocks.claimDue).toHaveBeenCalledWith(10);
  });

  it("counts a completion failure and relies on the database lease", async () => {
    mocks.claimDue.mockResolvedValue([claim(1)]);
    mocks.complete.mockRejectedValue(new Error("database unavailable"));

    await expect(processDueInquiryNotifications(4)).resolves.toEqual({
      claimed: 1,
      sent: 0,
      queued: 0,
      dead: 0,
      failed: 1,
    });
  });
});
