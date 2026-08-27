import { describe, expect, it } from "vitest";
import {
  buildSalesTracking,
  eventDay,
  expandSoldTickets,
  seatAmountCents,
  ticketCode,
} from "@/lib/admin/tickets";
import type {
  AdminTicketOrder,
  AdminTicketOrderAttendee,
} from "@/lib/admin/types";

const BASE: AdminTicketOrder = {
  id: "11111111-2222-4333-8444-555555555555",
  status: "paid",
  tier: "general",
  quantity: 1,
  subtotal_cents: 431_034,
  tax_cents: 68_966,
  total_cents: 500_000,
  tax_rate_basis_points: 1600,
  buyer_name: "Comprador Uno",
  email: "uno@example.com",
  phone: "+528110000000",
  company: null,
  referral_source: null,
  coupon_code: null,
  coupon_discount_basis_points: null,
  coupon_discount_cents: null,
  language: "es",
  requires_invoice: false,
  invoice_status: "not_requested",
  invoiced_at: null,
  cfdi_uuid: null,
  provider_payment_id: "1",
  provider_status: "approved",
  paid_at: "2026-08-20T18:00:00.000Z",
  owner: null,
  internal_notes: null,
  created_at: "2026-08-20T17:55:00.000Z",
  updated_at: "2026-08-20T18:00:00.000Z",
  retention_until: "2031-08-20T18:00:00.000Z",
};

function order(patch: Partial<AdminTicketOrder>): AdminTicketOrder {
  return { ...BASE, ...patch };
}

function roster(
  orderId: string,
  names: string[],
): Map<string, AdminTicketOrderAttendee[]> {
  return new Map([
    [
      orderId,
      names.map((full_name, index) => ({
        seat_number: index + 1,
        full_name,
      })),
    ],
  ]);
}

describe("seat amounts", () => {
  it("splits a total across seats without losing a cent", () => {
    const total = 1_000_01;
    const quantity = 3;
    const seats = [1, 2, 3].map((seat) =>
      seatAmountCents(total, quantity, seat),
    );
    expect(seats.reduce((sum, value) => sum + value, 0)).toBe(total);
    // The remainder lands on the first seats, never on a fractional cent.
    expect(seats).toEqual([33334, 33334, 33333]);
  });

  it("answers zero for a quantity that cannot exist", () => {
    expect(seatAmountCents(1000, 0, 1)).toBe(0);
  });
});

describe("ticket code", () => {
  it("is stable, uppercase and seat-padded", () => {
    expect(ticketCode(BASE.id, 7)).toBe("SCS-11111111-07");
    expect(ticketCode(BASE.id, 7)).toBe(ticketCode(BASE.id, 7));
  });
});

describe("event day", () => {
  it("buckets a late-night sale in the event's timezone, not UTC", () => {
    // 2026-08-21T02:30Z is still 2026-08-20 in America/Monterrey.
    expect(eventDay("2026-08-21T02:30:00.000Z")).toBe("2026-08-20");
    expect(eventDay("not-a-date")).toBeNull();
  });
});

describe("expandSoldTickets", () => {
  it("emits one row per seat and names them from the roster", () => {
    const corporate = order({
      id: "99999999-2222-4333-8444-555555555555",
      tier: "corporativo",
      quantity: 3,
      total_cents: 900_000,
      company: "ACME",
    });

    const tickets = expandSoldTickets(
      [corporate],
      roster(corporate.id, ["Ana", "Beto", "Caro"]),
    );

    expect(tickets).toHaveLength(3);
    expect(tickets.map((ticket) => ticket.attendee_name)).toEqual([
      "Ana",
      "Beto",
      "Caro",
    ]);
    expect(tickets.map((ticket) => ticket.seat_number)).toEqual([1, 2, 3]);
    expect(
      tickets.reduce((sum, ticket) => sum + ticket.amount_cents, 0),
    ).toBe(900_000);
  });

  it("leaves an individual seat unnamed instead of inventing a roster", () => {
    const [ticket] = expandSoldTickets([order({})], new Map());
    expect(ticket.attendee_name).toBeNull();
    expect(ticket.buyer_name).toBe("Comprador Uno");
    expect(ticket.seats_in_order).toBe(1);
  });

  it("keeps a partial roster aligned to its seat numbers", () => {
    const partial = order({ quantity: 3, total_cents: 300_000 });
    const tickets = expandSoldTickets(
      [partial],
      new Map([[partial.id, [{ seat_number: 2, full_name: "Solo Beto" }]]]),
    );
    expect(tickets.map((ticket) => ticket.attendee_name)).toEqual([
      null,
      "Solo Beto",
      null,
    ]);
  });

  it("sorts newest sale first and keeps a block together", () => {
    const older = order({
      id: "aaaaaaaa-2222-4333-8444-555555555555",
      quantity: 2,
      paid_at: "2026-08-01T10:00:00.000Z",
    });
    const newer = order({
      id: "bbbbbbbb-2222-4333-8444-555555555555",
      paid_at: "2026-08-15T10:00:00.000Z",
    });

    const tickets = expandSoldTickets([older, newer], new Map());
    expect(tickets.map((ticket) => ticket.order_id)).toEqual([
      newer.id,
      older.id,
      older.id,
    ]);
  });
});

describe("buildSalesTracking", () => {
  const now = new Date("2026-08-26T12:00:00.000Z");

  it("counts only paid orders as sold and holds the rest apart", () => {
    const tracking = buildSalesTracking(
      [
        order({ id: "a1111111-2222-4333-8444-555555555555" }),
        order({
          id: "a2222222-2222-4333-8444-555555555555",
          status: "pending",
          quantity: 4,
          paid_at: null,
        }),
        order({
          id: "a3333333-2222-4333-8444-555555555555",
          status: "rejected",
          paid_at: null,
        }),
      ],
      now,
    );

    expect(tracking.soldSeats).toBe(1);
    expect(tracking.paidOrders).toBe(1);
    expect(tracking.heldSeats).toBe(4);
    expect(tracking.heldOrders).toBe(1);
    expect(tracking.lostOrders).toBe(1);
    expect(tracking.grossCents).toBe(500_000);
    expect(tracking.taxCents).toBe(68_966);
    expect(tracking.netCents).toBe(431_034);
    // One paid out of two resolved checkouts; the pending one does not count.
    expect(tracking.conversionRate).toBe(0.5);
  });

  it("counts an expired checkout as abandoned, not as a lost sale", () => {
    const tracking = buildSalesTracking(
      [
        order({}),
        order({
          id: "33333333-2222-4333-8444-555555555555",
          status: "cancelled",
          provider_status: "expired",
          provider_payment_id: null,
          paid_at: null,
        }),
      ],
      now,
    );

    expect(tracking.abandonedOrders).toBe(1);
    expect(tracking.lostOrders).toBe(0);
    // The buyer never attempted a payment, so the conversion rate is still
    // one paid checkout out of one that resolved at the provider.
    expect(tracking.conversionRate).toBe(1);
  });

  it("still counts a cancellation the buyer made as a lost sale", () => {
    const tracking = buildSalesTracking(
      [
        order({}),
        order({
          id: "44444444-2222-4333-8444-555555555555",
          status: "cancelled",
          provider_status: "cancelled",
          paid_at: null,
        }),
      ],
      now,
    );

    expect(tracking.abandonedOrders).toBe(0);
    expect(tracking.lostOrders).toBe(1);
    expect(tracking.conversionRate).toBe(0.5);
  });

  it("reports no conversion rate before any checkout resolves", () => {
    const tracking = buildSalesTracking(
      [order({ status: "pending", paid_at: null })],
      now,
    );
    expect(tracking.conversionRate).toBeNull();
    expect(tracking.averageSeatCents).toBe(0);
    expect(tracking.averageOrderCents).toBe(0);
    expect(tracking.lastSaleAt).toBeNull();
  });

  it("groups seats by tier, day and referrer", () => {
    const tracking = buildSalesTracking(
      [
        order({
          id: "b1111111-2222-4333-8444-555555555555",
          tier: "corporativo",
          quantity: 5,
          total_cents: 1_500_000,
          referral_source: "LinkedIn",
          paid_at: "2026-08-25T16:00:00.000Z",
        }),
        order({
          id: "b2222222-2222-4333-8444-555555555555",
          tier: "plus",
          referral_source: "LinkedIn",
          paid_at: "2026-08-25T18:00:00.000Z",
        }),
        order({
          id: "b3333333-2222-4333-8444-555555555555",
          paid_at: "2026-08-24T18:00:00.000Z",
        }),
      ],
      now,
    );

    expect(tracking.byTier[0]).toMatchObject({ tier: "corporativo", seats: 5 });
    expect(tracking.byDay).toEqual([
      { day: "2026-08-24", seats: 1, grossCents: 500_000 },
      { day: "2026-08-25", seats: 6, grossCents: 2_000_000 },
    ]);
    expect(tracking.byReferral).toEqual([
      { source: "LinkedIn", seats: 6, orders: 2 },
      { source: "Sin dato", seats: 1, orders: 1 },
    ]);
    expect(tracking.seatsLast7Days).toBe(7);
    expect(tracking.lastSaleAt).toBe("2026-08-25T18:00:00.000Z");
  });

  it("excludes sales older than seven days from the trend", () => {
    const tracking = buildSalesTracking(
      [order({ paid_at: "2026-08-01T18:00:00.000Z" })],
      now,
    );
    expect(tracking.soldSeats).toBe(1);
    expect(tracking.seatsLast7Days).toBe(0);
  });

  it("counts invoice work on paid orders only", () => {
    const tracking = buildSalesTracking(
      [
        order({
          id: "c1111111-2222-4333-8444-555555555555",
          requires_invoice: true,
          invoice_status: "requested",
        }),
        order({
          id: "c2222222-2222-4333-8444-555555555555",
          requires_invoice: true,
          invoice_status: "issued",
        }),
        order({
          id: "c3333333-2222-4333-8444-555555555555",
          status: "cancelled",
          requires_invoice: true,
          invoice_status: "requested",
          paid_at: null,
        }),
      ],
      now,
    );
    expect(tracking.invoicesRequested).toBe(1);
    expect(tracking.invoicesIssued).toBe(1);
  });
});
