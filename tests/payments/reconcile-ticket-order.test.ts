import { beforeEach, describe, expect, it, vi } from "vitest";

const ORDER_ID = "9b2d0c26-2f3d-4a1e-8f2b-6ce0f9b1a742";

const getTicketOrderSummary = vi.fn();
const recordPayment = vi.fn();
const listDeliverableTicketOrderNotificationIds = vi.fn();
const findPaymentByExternalReference = vi.fn();
const tryImmediateTicketOrderNotification = vi.fn();
const checkRateLimit = vi.fn();

vi.mock("@/server/repositories/ticket-order-repository", () => ({
  getTicketOrderSummary: (...args: unknown[]) => getTicketOrderSummary(...args),
  recordPayment: (...args: unknown[]) => recordPayment(...args),
  listDeliverableTicketOrderNotificationIds: (...args: unknown[]) =>
    listDeliverableTicketOrderNotificationIds(...args),
}));

vi.mock("@/server/services/mercadopago-client", async () => {
  const actual = await vi.importActual<
    typeof import("@/server/services/mercadopago-client")
  >("@/server/services/mercadopago-client");
  return {
    ...actual,
    findPaymentByExternalReference: (...args: unknown[]) =>
      findPaymentByExternalReference(...args),
  };
});

vi.mock("@/server/services/ticket-order-notifier", () => ({
  tryImmediateTicketOrderNotification: (...args: unknown[]) =>
    tryImmediateTicketOrderNotification(...args),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
  RateLimitError: class RateLimitError extends Error {},
}));

const { reconcileTicketOrder } = await import(
  "@/server/use-cases/reconcile-ticket-order"
);

function storedOrder(status: string) {
  return {
    id: ORDER_ID,
    status,
    tier: "plus",
    quantity: 1,
    subtotal_cents: 250_000,
    tax_cents: 40_000,
    total_cents: 290_000,
    language: "es",
    requires_invoice: false,
  };
}

describe("reconcileTicketOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockResolvedValue(undefined);
    listDeliverableTicketOrderNotificationIds.mockResolvedValue([]);
  });

  it("returns an unknown order without contacting the provider", async () => {
    getTicketOrderSummary.mockResolvedValue(null);

    expect(await reconcileTicketOrder(ORDER_ID)).toBeNull();
    expect(findPaymentByExternalReference).not.toHaveBeenCalled();
  });

  it("never re-reads a terminal order, so a late pending cannot degrade it", async () => {
    getTicketOrderSummary.mockResolvedValue(storedOrder("paid"));

    const result = await reconcileTicketOrder(ORDER_ID);

    expect(result?.status).toBe("paid");
    expect(findPaymentByExternalReference).not.toHaveBeenCalled();
    expect(recordPayment).not.toHaveBeenCalled();
  });

  it("records a payment the webhook never delivered and dispatches the receipt", async () => {
    getTicketOrderSummary
      .mockResolvedValueOnce(storedOrder("pending"))
      .mockResolvedValueOnce(storedOrder("paid"));
    findPaymentByExternalReference.mockResolvedValue({
      id: "111",
      status: "approved",
      statusDetail: "accredited",
      externalReference: ORDER_ID,
      transactionAmount: 2900,
      currencyId: "MXN",
      dateApproved: "2026-08-24T10:00:00.000-06:00",
    });
    recordPayment.mockResolvedValue({
      orderId: ORDER_ID,
      status: "paid",
      outcome: "updated",
    });
    listDeliverableTicketOrderNotificationIds.mockResolvedValue(["n1", "n2"]);
    tryImmediateTicketOrderNotification.mockResolvedValue("sent");

    const result = await reconcileTicketOrder(ORDER_ID);

    expect(recordPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: ORDER_ID,
        paymentId: "111",
        status: "paid",
        providerStatus: "approved",
      }),
    );
    expect(tryImmediateTicketOrderNotification).toHaveBeenCalledTimes(2);
    expect(result?.status).toBe("paid");
  });

  it("leaves the order alone when the provider still reports pending", async () => {
    getTicketOrderSummary.mockResolvedValue(storedOrder("pending"));
    findPaymentByExternalReference.mockResolvedValue({
      id: "111",
      status: "pending",
      statusDetail: null,
      externalReference: ORDER_ID,
      transactionAmount: 2900,
      currencyId: "MXN",
      dateApproved: null,
    });

    const result = await reconcileTicketOrder(ORDER_ID);

    expect(recordPayment).not.toHaveBeenCalled();
    expect(result?.status).toBe("pending");
  });

  it("returns the stored order when no payment exists yet", async () => {
    getTicketOrderSummary.mockResolvedValue(storedOrder("pending"));
    findPaymentByExternalReference.mockResolvedValue(null);

    expect((await reconcileTicketOrder(ORDER_ID))?.status).toBe("pending");
    expect(recordPayment).not.toHaveBeenCalled();
  });

  it("degrades to the stored status when the provider call fails", async () => {
    getTicketOrderSummary.mockResolvedValue(storedOrder("pending"));
    findPaymentByExternalReference.mockRejectedValue(new Error("network"));

    expect((await reconcileTicketOrder(ORDER_ID))?.status).toBe("pending");
    expect(recordPayment).not.toHaveBeenCalled();
  });

  it("skips the provider when the order is being refreshed too often", async () => {
    getTicketOrderSummary.mockResolvedValue(storedOrder("pending"));
    checkRateLimit.mockRejectedValue(new Error("RATE_LIMITED"));

    expect((await reconcileTicketOrder(ORDER_ID))?.status).toBe("pending");
    expect(findPaymentByExternalReference).not.toHaveBeenCalled();
  });

  it("throttles on the order id, not on the visitor", async () => {
    getTicketOrderSummary.mockResolvedValue(storedOrder("pending"));
    findPaymentByExternalReference.mockResolvedValue(null);

    await reconcileTicketOrder(ORDER_ID);

    expect(checkRateLimit).toHaveBeenCalledWith(`reconcile:${ORDER_ID}`);
  });
});
