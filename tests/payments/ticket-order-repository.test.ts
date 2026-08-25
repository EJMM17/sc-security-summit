import { beforeEach, describe, expect, it, vi } from "vitest";

const { getClientMock } = vi.hoisted(() => ({ getClientMock: vi.fn() }));

vi.mock("@/lib/supabase-server", () => ({
  getSupabaseServerClient: getClientMock,
}));

import {
  orderRetentionDateFrom,
  persistTicketOrder,
} from "@/server/repositories/ticket-order-repository";
import { quoteCorporateOrder, quoteTicketOrder } from "@/lib/payments/catalog";
import {
  checkoutFixture,
  corporateCheckoutFixture,
} from "@/tests/payments/checkout-fixtures";

describe("orderRetentionDateFrom", () => {
  it("retains a fiscal record for five years by default", () => {
    expect(orderRetentionDateFrom(new Date("2026-08-24T12:00:00.000Z"))).toBe(
      "2031-08-24",
    );
  });

  it("clamps an end-of-month date instead of rolling into the next month", () => {
    // 2026-08-31 + 6 months is 2027-02-31, which does not exist.
    expect(orderRetentionDateFrom(new Date("2026-08-31T00:00:00.000Z"), 6)).toBe(
      "2027-02-28",
    );
    expect(orderRetentionDateFrom(new Date("2027-08-31T00:00:00.000Z"), 6)).toBe(
      "2028-02-29",
    );
  });

  it("handles a leap day origin", () => {
    expect(orderRetentionDateFrom(new Date("2028-02-29T00:00:00.000Z"), 12)).toBe(
      "2029-02-28",
    );
  });
});

describe("persistTicketOrder", () => {
  const rpc = vi.fn();

  beforeEach(() => {
    rpc.mockReset();
    getClientMock.mockReset();
    getClientMock.mockReturnValue({ rpc });
    rpc.mockResolvedValue({
      data: [
        {
          order_id: "9b2d0c26-2f3d-4a1e-8f2b-6ce0f9b1a742",
          outcome: "created",
          total_cents: 937_500,
        },
      ],
      error: null,
    });
  });

  it("sends the roster and the referrer with a corporate block", async () => {
    await persistTicketOrder(
      corporateCheckoutFixture,
      quoteCorporateOrder(corporateCheckoutFixture.quantity),
      "b".repeat(64),
      new Date("2026-08-25T12:00:00.000Z"),
    );

    const [name, args] = rpc.mock.calls[0];
    expect(name).toBe("create_ticket_order");
    expect(args).toMatchObject({
      p_tier: "corporativo",
      p_quantity: 5,
      p_unit_price_cents: 187_500,
      p_referral_source: "Cámara de Comercio de Reynosa",
      p_attendees: corporateCheckoutFixture.attendees,
    });
  });

  it("sends no roster with an individual access", async () => {
    await persistTicketOrder(
      checkoutFixture,
      quoteTicketOrder(checkoutFixture.tier as "plus", checkoutFixture.quantity),
      "c".repeat(64),
      new Date("2026-08-25T12:00:00.000Z"),
    );

    const args = rpc.mock.calls[0][1];
    expect(args.p_attendees).toBeUndefined();
    expect(args.p_referral_source).toBeUndefined();
  });
});
