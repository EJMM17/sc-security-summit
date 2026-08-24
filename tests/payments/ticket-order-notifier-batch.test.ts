import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/repositories/ticket-order-repository", async () => {
  const actual = await vi.importActual<
    typeof import("@/server/repositories/ticket-order-repository")
  >("@/server/repositories/ticket-order-repository");
  return {
    ...actual,
    claimDueTicketOrderNotifications: vi.fn(),
    claimTicketOrderNotification: vi.fn(),
    completeTicketOrderNotification: vi.fn(),
    getNotifiableTicketOrder: vi.fn(),
    getTicketNotificationStatus: vi.fn(),
  };
});

vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }));

import { sendEmail } from "@/lib/email";
import {
  claimDueTicketOrderNotifications,
  claimTicketOrderNotification,
  completeTicketOrderNotification,
  getNotifiableTicketOrder,
  getTicketNotificationStatus,
} from "@/server/repositories/ticket-order-repository";
import {
  processDueTicketOrderNotifications,
  tryImmediateTicketOrderNotification,
} from "@/server/services/ticket-order-notifier";

const ORDER_ID = "9b2d0c26-2f3d-4a1e-8f2b-6ce0f9b1a742";

const mockedClaimDue = vi.mocked(claimDueTicketOrderNotifications);
const mockedClaimOne = vi.mocked(claimTicketOrderNotification);
const mockedComplete = vi.mocked(completeTicketOrderNotification);
const mockedGetOrder = vi.mocked(getNotifiableTicketOrder);
const mockedGetStatus = vi.mocked(getTicketNotificationStatus);
const mockedSend = vi.mocked(sendEmail);

function claim(id: string) {
  return {
    notificationId: id,
    orderId: ORDER_ID,
    attemptNumber: 1,
    template: "ticket_buyer_receipt_v1",
  };
}

const PAID_ORDER = {
  id: ORDER_ID,
  status: "paid" as const,
  tier: "plus" as const,
  quantity: 1,
  subtotal_cents: 250_000,
  tax_cents: 40_000,
  total_cents: 290_000,
  tax_rate_basis_points: 1_600,
  buyer_name: "María González",
  email: "maria@empresa.com",
  phone: "+52 899 123 4567",
  company: null,
  language: "es" as const,
  requires_invoice: false,
};

describe("processDueTicketOrderNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("CONTACT_EMAIL", "ops@scsecuritysummit.com");
    mockedGetOrder.mockResolvedValue(PAID_ORDER);
    mockedComplete.mockResolvedValue("sent");
    mockedSend.mockResolvedValue({ ok: true, id: "msg-1" });
  });

  it("summarizes an empty queue without contacting the provider", async () => {
    mockedClaimDue.mockResolvedValue([]);
    await expect(processDueTicketOrderNotifications(10)).resolves.toEqual({
      claimed: 0,
      sent: 0,
      queued: 0,
      dead: 0,
      failed: 0,
    });
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it("counts each outcome", async () => {
    mockedClaimDue.mockResolvedValue([
      claim("11111111-1111-4111-8111-111111111111"),
      claim("22222222-2222-4222-8222-222222222222"),
    ]);
    mockedSend
      .mockResolvedValueOnce({ ok: true, id: "msg-1" })
      .mockResolvedValueOnce({ ok: false, code: "rate_limit_exceeded" });

    await expect(processDueTicketOrderNotifications(10)).resolves.toEqual({
      claimed: 2,
      sent: 1,
      queued: 1,
      dead: 0,
      failed: 0,
    });
  });

  it("keeps draining the batch when one row throws", async () => {
    mockedClaimDue.mockResolvedValue([
      claim("11111111-1111-4111-8111-111111111111"),
      claim("22222222-2222-4222-8222-222222222222"),
    ]);
    mockedComplete
      .mockRejectedValueOnce(new Error("row is poisoned"))
      .mockResolvedValue("sent");

    const summary = await processDueTicketOrderNotifications(10);
    expect(summary.failed).toBe(1);
    expect(summary.sent).toBe(1);
  });
});

describe("tryImmediateTicketOrderNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.stubEnv("CONTACT_EMAIL", "ops@scsecuritysummit.com");
    mockedGetOrder.mockResolvedValue(PAID_ORDER);
    mockedComplete.mockResolvedValue("sent");
    mockedSend.mockResolvedValue({ ok: true, id: "msg-1" });
  });

  it("sends when the claim succeeds", async () => {
    mockedClaimOne.mockResolvedValue(
      claim("11111111-1111-4111-8111-111111111111"),
    );
    await expect(
      tryImmediateTicketOrderNotification("11111111-1111-4111-8111-111111111111"),
    ).resolves.toBe("sent");
  });

  it("reports the stored status when another worker already holds the claim", async () => {
    mockedClaimOne.mockResolvedValue(null);
    mockedGetStatus.mockResolvedValue("sent");
    await expect(
      tryImmediateTicketOrderNotification("11111111-1111-4111-8111-111111111111"),
    ).resolves.toBe("sent");
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it("reports queued when the notification is still pending elsewhere", async () => {
    mockedClaimOne.mockResolvedValue(null);
    mockedGetStatus.mockResolvedValue("processing");
    await expect(
      tryImmediateTicketOrderNotification("11111111-1111-4111-8111-111111111111"),
    ).resolves.toBe("queued");
  });
});
