import { beforeEach, describe, expect, it, vi } from "vitest";

const listStalePendingTicketOrderIds = vi.fn();
const isMercadoPagoConfigured = vi.fn();
const recordPaymentEvent = vi.fn();
const reconcileTicketOrderWithOutcome = vi.fn();
const expireStaleTicketOrders = vi.fn();

vi.mock("@/server/repositories/ticket-order-repository", () => ({
  listStalePendingTicketOrderIds: (...args: unknown[]) =>
    listStalePendingTicketOrderIds(...args),
  expireStaleTicketOrders: (...args: unknown[]) =>
    expireStaleTicketOrders(...args),
}));

vi.mock("@/server/services/mercadopago-client", () => ({
  isMercadoPagoConfigured: () => isMercadoPagoConfigured(),
}));

vi.mock("@/server/services/payment-observability", () => ({
  recordPaymentEvent: (...args: unknown[]) => recordPaymentEvent(...args),
}));

vi.mock("@/server/use-cases/reconcile-ticket-order", () => ({
  reconcileTicketOrderWithOutcome: (...args: unknown[]) =>
    reconcileTicketOrderWithOutcome(...args),
}));

const {
  sweepPendingTicketOrders,
  SWEEP_MAX_BATCH_SIZE,
  SWEEP_MIN_AGE_SECONDS,
  SWEEP_MAX_AGE_DAYS,
  EXPIRY_MINUTES,
} = await import("@/server/use-cases/sweep-pending-ticket-orders");

/** The provider answered and had something terminal to say. */
function updated(status: string) {
  return { order: { status }, outcome: "updated" as const };
}

/** The provider answered: there is no payment for this order at all. */
function abandoned() {
  return { order: { status: "pending" }, outcome: "no_payment" as const };
}

/** A payment exists, but with nothing terminal to say yet. */
function providerPending() {
  return { order: { status: "pending" }, outcome: "provider_pending" as const };
}

/** The provider could not be reached. */
function unavailable() {
  return { order: { status: "pending" }, outcome: "unavailable" as const };
}

const NOW = new Date("2026-08-25T12:00:00.000Z");

describe("sweepPendingTicketOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isMercadoPagoConfigured.mockReturnValue(true);
    listStalePendingTicketOrderIds.mockResolvedValue([]);
    expireStaleTicketOrders.mockResolvedValue([]);
  });

  it("does nothing when the provider is not configured", async () => {
    isMercadoPagoConfigured.mockReturnValue(false);

    expect(await sweepPendingTicketOrders(10, NOW)).toEqual({
      scanned: 0,
      resolved: 0,
      stillPending: 0,
      expired: 0,
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
    reconcileTicketOrderWithOutcome.mockResolvedValue(updated("paid"));

    await sweepPendingTicketOrders(10, NOW);

    expect(reconcileTicketOrderWithOutcome).toHaveBeenCalledWith("order-1", {
      throttle: false,
    });
  });

  it("counts the orders it actually resolved", async () => {
    listStalePendingTicketOrderIds.mockResolvedValue(["a", "b", "c"]);
    reconcileTicketOrderWithOutcome
      .mockResolvedValueOnce(updated("paid"))
      .mockResolvedValueOnce(unavailable())
      .mockResolvedValueOnce(updated("cancelled"));

    expect(await sweepPendingTicketOrders(10, NOW)).toEqual({
      scanned: 3,
      resolved: 2,
      stillPending: 1,
      expired: 0,
    });
  });

  it("keeps sweeping when one order fails", async () => {
    listStalePendingTicketOrderIds.mockResolvedValue(["a", "b"]);
    reconcileTicketOrderWithOutcome
      .mockRejectedValueOnce(new Error("provider down"))
      .mockResolvedValueOnce(updated("paid"));

    expect(await sweepPendingTicketOrders(10, NOW)).toEqual({
      scanned: 2,
      resolved: 1,
      stillPending: 1,
      expired: 0,
    });
  });

  it("expires abandoned checkouts once the provider confirms there is no payment", async () => {
    listStalePendingTicketOrderIds.mockResolvedValue(["a", "b"]);
    reconcileTicketOrderWithOutcome
      .mockResolvedValueOnce(abandoned())
      .mockResolvedValueOnce(updated("paid"));
    expireStaleTicketOrders.mockResolvedValue(["a"]);

    expect(await sweepPendingTicketOrders(10, NOW)).toEqual({
      scanned: 2,
      resolved: 1,
      stillPending: 0,
      expired: 1,
    });
    // Only the order the provider confirmed abandoned is named.
    expect(expireStaleTicketOrders).toHaveBeenCalledWith({
      orderIds: ["a"],
      expiryMinutes: EXPIRY_MINUTES,
    });
  });

  it("never names an order the provider had news about", async () => {
    listStalePendingTicketOrderIds.mockResolvedValue(["a", "b", "c"]);
    reconcileTicketOrderWithOutcome
      .mockResolvedValueOnce(abandoned())
      // A payment exists but has nothing terminal to say yet: this order is
      // not abandoned, whatever its age.
      .mockResolvedValueOnce(providerPending())
      .mockResolvedValueOnce(unavailable());
    expireStaleTicketOrders.mockResolvedValue(["a"]);

    await sweepPendingTicketOrders(10, NOW);

    expect(expireStaleTicketOrders).toHaveBeenCalledWith({
      orderIds: ["a"],
      expiryMinutes: EXPIRY_MINUTES,
    });
  });

  it("never expires below the checkout window the buyer was given", () => {
    expect(EXPIRY_MINUTES).toBeGreaterThanOrEqual(30);
  });

  it("expires nothing when the provider could not be reached", async () => {
    listStalePendingTicketOrderIds.mockResolvedValue(["a", "b"]);
    reconcileTicketOrderWithOutcome.mockResolvedValue(unavailable());

    expect(await sweepPendingTicketOrders(10, NOW)).toEqual({
      scanned: 2,
      resolved: 0,
      stillPending: 2,
      expired: 0,
    });
    expect(expireStaleTicketOrders).toHaveBeenCalledWith({
      orderIds: [],
      expiryMinutes: EXPIRY_MINUTES,
    });
  });

  it("expires nothing when every order threw before an answer arrived", async () => {
    listStalePendingTicketOrderIds.mockResolvedValue(["a"]);
    reconcileTicketOrderWithOutcome.mockRejectedValue(new Error("boom"));

    await sweepPendingTicketOrders(10, NOW);

    expect(expireStaleTicketOrders).toHaveBeenCalledWith({
      orderIds: [],
      expiryMinutes: EXPIRY_MINUTES,
    });
  });

  it("still reports the sweep when expiry itself fails, and says so", async () => {
    listStalePendingTicketOrderIds.mockResolvedValue(["a"]);
    reconcileTicketOrderWithOutcome.mockResolvedValue(abandoned());
    expireStaleTicketOrders.mockRejectedValue(
      Object.assign(new Error("missing function"), { code: "PGRST202" }),
    );

    expect(await sweepPendingTicketOrders(10, NOW)).toEqual({
      scanned: 1,
      resolved: 0,
      stillPending: 1,
      expired: 0,
    });
    // A migration that was never applied must not look like a quiet sweep.
    expect(recordPaymentEvent).toHaveBeenCalledWith(
      "ticket_order_expiry_failed",
      { code: "PGRST202" },
    );
  });
});
