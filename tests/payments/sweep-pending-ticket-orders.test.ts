import { beforeEach, describe, expect, it, vi } from "vitest";

const listStalePendingTicketOrderIds = vi.fn();
const isMercadoPagoConfigured = vi.fn();
const reconcileTicketOrder = vi.fn();

vi.mock("@/server/repositories/ticket-order-repository", () => ({
  listStalePendingTicketOrderIds: (...args: unknown[]) =>
    listStalePendingTicketOrderIds(...args),
}));

vi.mock("@/server/services/mercadopago-client", () => ({
  isMercadoPagoConfigured: () => isMercadoPagoConfigured(),
}));

vi.mock("@/server/use-cases/reconcile-ticket-order", () => ({
  reconcileTicketOrder: (...args: unknown[]) => reconcileTicketOrder(...args),
}));

const {
  sweepPendingTicketOrders,
  SWEEP_MAX_BATCH_SIZE,
  SWEEP_MIN_AGE_SECONDS,
  SWEEP_MAX_AGE_DAYS,
} = await import("@/server/use-cases/sweep-pending-ticket-orders");

const NOW = new Date("2026-08-25T12:00:00.000Z");

describe("sweepPendingTicketOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isMercadoPagoConfigured.mockReturnValue(true);
    listStalePendingTicketOrderIds.mockResolvedValue([]);
  });

  it("does nothing when the provider is not configured", async () => {
    isMercadoPagoConfigured.mockReturnValue(false);

    expect(await sweepPendingTicketOrders(10, NOW)).toEqual({
      scanned: 0,
      resolved: 0,
      stillPending: 0,
    });
    expect(listStalePendingTicketOrderIds).not.toHaveBeenCalled();
  });

  it("only asks about orders past the checkout window and inside retention", async () => {
    await sweepPendingTicketOrders(10, NOW);

    expect(listStalePendingTicketOrderIds).toHaveBeenCalledWith({
      minAgeSeconds: SWEEP_MIN_AGE_SECONDS,
      maxAgeDays: SWEEP_MAX_AGE_DAYS,
      limit: 10,
      now: NOW,
    });
  });

  it("caps the batch size so one run cannot hammer the provider", async () => {
    await sweepPendingTicketOrders(5_000, NOW);

    expect(listStalePendingTicketOrderIds).toHaveBeenCalledWith(
      expect.objectContaining({ limit: SWEEP_MAX_BATCH_SIZE }),
    );
  });

  it("bypasses the visitor throttle, which exists for refreshing buyers", async () => {
    listStalePendingTicketOrderIds.mockResolvedValue(["order-1"]);
    reconcileTicketOrder.mockResolvedValue({ status: "paid" });

    await sweepPendingTicketOrders(10, NOW);

    expect(reconcileTicketOrder).toHaveBeenCalledWith("order-1", {
      throttle: false,
    });
  });

  it("counts the orders it actually resolved", async () => {
    listStalePendingTicketOrderIds.mockResolvedValue(["a", "b", "c"]);
    reconcileTicketOrder
      .mockResolvedValueOnce({ status: "paid" })
      .mockResolvedValueOnce({ status: "pending" })
      .mockResolvedValueOnce({ status: "cancelled" });

    expect(await sweepPendingTicketOrders(10, NOW)).toEqual({
      scanned: 3,
      resolved: 2,
      stillPending: 1,
    });
  });

  it("keeps sweeping when one order fails", async () => {
    listStalePendingTicketOrderIds.mockResolvedValue(["a", "b"]);
    reconcileTicketOrder
      .mockRejectedValueOnce(new Error("provider down"))
      .mockResolvedValueOnce({ status: "paid" });

    expect(await sweepPendingTicketOrders(10, NOW)).toEqual({
      scanned: 2,
      resolved: 1,
      stillPending: 1,
    });
  });
});
