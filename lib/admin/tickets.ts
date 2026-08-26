import type {
  AdminSalesTracking,
  AdminSoldTicket,
  AdminTicketOrder,
  AdminTicketOrderAttendee,
  AdminTicketTier,
} from "@/lib/admin/types";

/**
 * Turning orders into the two things Operations actually asks for: the list of
 * accesses that were sold, one row per seat, and the sales tracking above it.
 *
 * Both are pure functions over rows already read by the repository. The panel
 * sells nothing and stores nothing here — a "ticket" is not a table, it is a
 * seat of a paid order, named by the roster when the buyer supplied one — so
 * this logic is unit-testable without a database and cannot drift from what
 * the buyer was charged.
 */

/** Orders whose seats count as sold. */
export const SOLD_ORDER_STATUS = "paid" as const;

/** Orders still on their way to being sold: the seat is held, not sold. */
export const IN_FLIGHT_ORDER_STATUSES = ["pending", "in_process"] as const;

/**
 * The provider status the sweep writes when it cancels a checkout nobody ever
 * paid. MercadoPago has no status by that name, so it cannot collide with a
 * real one.
 */
export const EXPIRED_PROVIDER_STATUS = "expired" as const;

const EVENT_TIME_ZONE = "America/Monterrey";

const DAY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** `YYYY-MM-DD` in the event's timezone, so a late-night sale is not tomorrow. */
export function eventDay(value: string): string | null {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return DAY_FORMAT.format(parsed);
}

/**
 * A stable, human-quotable reference for one seat. It is derived, never
 * stored: the order id plus the seat number already identify the access
 * uniquely, and the short form is what fits on a check-in list.
 */
export function ticketCode(orderId: string, seatNumber: number): string {
  return `SCS-${orderId.slice(0, 8).toUpperCase()}-${String(seatNumber).padStart(2, "0")}`;
}

/**
 * Split an order's gross amount across its seats without losing a cent: every
 * seat gets the floor, and the remainder goes to the first seats one cent at a
 * time, so the seat prices always add back up to what was charged.
 */
export function seatAmountCents(
  totalCents: number,
  quantity: number,
  seatNumber: number,
): number {
  if (quantity <= 0) return 0;
  const base = Math.floor(totalCents / quantity);
  const remainder = totalCents - base * quantity;
  return seatNumber <= remainder ? base + 1 : base;
}

/**
 * One row per purchased access. A corporate block contributes its named
 * roster; an individual order contributes its seats with no name, which is the
 * ordinary case and not missing data.
 */
export function expandSoldTickets(
  orders: AdminTicketOrder[],
  attendees: Map<string, AdminTicketOrderAttendee[]>,
): AdminSoldTicket[] {
  const tickets: AdminSoldTicket[] = [];

  for (const order of orders) {
    const roster = attendees.get(order.id) ?? [];
    const names = new Map(roster.map((row) => [row.seat_number, row.full_name]));

    for (let seat = 1; seat <= order.quantity; seat += 1) {
      tickets.push({
        order_id: order.id,
        ticket_code: ticketCode(order.id, seat),
        seat_number: seat,
        seats_in_order: order.quantity,
        tier: order.tier,
        attendee_name: names.get(seat) ?? null,
        buyer_name: order.buyer_name,
        email: order.email,
        phone: order.phone,
        company: order.company,
        referral_source: order.referral_source,
        language: order.language,
        status: order.status,
        invoice_status: order.invoice_status,
        amount_cents: seatAmountCents(order.total_cents, order.quantity, seat),
        paid_at: order.paid_at,
        created_at: order.created_at,
      });
    }
  }

  // Newest sale first, and inside one order the roster order, so a block reads
  // as a block instead of interleaving with the sales around it.
  return tickets.sort((a, b) => {
    const left = Date.parse(a.paid_at ?? a.created_at);
    const right = Date.parse(b.paid_at ?? b.created_at);
    if (left !== right) return right - left;
    if (a.order_id !== b.order_id) return a.order_id < b.order_id ? -1 : 1;
    return a.seat_number - b.seat_number;
  });
}

function emptyTierRow(tier: AdminTicketTier) {
  return { tier, seats: 0, orders: 0, grossCents: 0 };
}

/**
 * The tracking header: what has been sold, what it brought in, where it came
 * from and how it is trending. Everything is computed from the same paid rows
 * the table below it shows, so the two can never disagree.
 */
export function buildSalesTracking(
  orders: AdminTicketOrder[],
  now: Date = new Date(),
): AdminSalesTracking {
  const byTier = new Map<AdminTicketTier, ReturnType<typeof emptyTierRow>>();
  const byDay = new Map<string, { seats: number; grossCents: number }>();
  const byReferral = new Map<string, { seats: number; orders: number }>();

  let soldSeats = 0;
  let paidOrders = 0;
  let grossCents = 0;
  let taxCents = 0;
  let netCents = 0;
  let heldSeats = 0;
  let heldOrders = 0;
  let lostOrders = 0;
  let abandonedOrders = 0;
  let invoicesRequested = 0;
  let invoicesIssued = 0;
  let lastSaleAt: string | null = null;

  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  let seatsLast7Days = 0;

  for (const order of orders) {
    if (
      (IN_FLIGHT_ORDER_STATUSES as readonly string[]).includes(order.status)
    ) {
      heldOrders += 1;
      heldSeats += order.quantity;
      continue;
    }
    if (order.status !== SOLD_ORDER_STATUS) {
      // An abandoned checkout is cancelled like any other, but it is not a
      // lost sale in the sense this panel measures: nobody attempted a
      // payment and nothing was declined. Counting it as lost would let a
      // cleanup quietly redefine the conversion rate.
      if (order.provider_status === EXPIRED_PROVIDER_STATUS) {
        abandonedOrders += 1;
      } else {
        lostOrders += 1;
      }
      continue;
    }

    paidOrders += 1;
    soldSeats += order.quantity;
    grossCents += order.total_cents;
    taxCents += order.tax_cents;
    netCents += order.subtotal_cents;
    if (order.invoice_status === "requested") invoicesRequested += 1;
    if (order.invoice_status === "issued") invoicesIssued += 1;

    const tierRow = byTier.get(order.tier) ?? emptyTierRow(order.tier);
    tierRow.seats += order.quantity;
    tierRow.orders += 1;
    tierRow.grossCents += order.total_cents;
    byTier.set(order.tier, tierRow);

    const soldAt = order.paid_at ?? order.created_at;
    const day = eventDay(soldAt);
    if (day) {
      const dayRow = byDay.get(day) ?? { seats: 0, grossCents: 0 };
      dayRow.seats += order.quantity;
      dayRow.grossCents += order.total_cents;
      byDay.set(day, dayRow);
    }
    const soldAtMs = Date.parse(soldAt);
    if (!Number.isNaN(soldAtMs)) {
      if (soldAtMs >= sevenDaysAgo) seatsLast7Days += order.quantity;
      if (!lastSaleAt || soldAtMs > Date.parse(lastSaleAt)) lastSaleAt = soldAt;
    }

    // A buyer who left the field empty is still a data point: "sin dato" is
    // the honest label for it, not an omitted row.
    const source = order.referral_source?.trim() || "Sin dato";
    const referralRow = byReferral.get(source) ?? { seats: 0, orders: 0 };
    referralRow.seats += order.quantity;
    referralRow.orders += 1;
    byReferral.set(source, referralRow);
  }

  const decidedOrders = paidOrders + lostOrders;

  return {
    soldSeats,
    paidOrders,
    heldSeats,
    heldOrders,
    lostOrders,
    abandonedOrders,
    grossCents,
    taxCents,
    netCents,
    averageOrderCents: paidOrders === 0 ? 0 : Math.round(grossCents / paidOrders),
    averageSeatCents: soldSeats === 0 ? 0 : Math.round(grossCents / soldSeats),
    invoicesRequested,
    invoicesIssued,
    seatsLast7Days,
    lastSaleAt,
    // Share of resolved checkouts that ended in a payment. Orders still in
    // flight are excluded: they have not failed, they just have not finished.
    conversionRate: decidedOrders === 0 ? null : paidOrders / decidedOrders,
    byTier: [...byTier.values()].sort((a, b) => b.seats - a.seats),
    byDay: [...byDay.entries()]
      .map(([day, row]) => ({ day, ...row }))
      .sort((a, b) => (a.day < b.day ? -1 : 1)),
    byReferral: [...byReferral.entries()]
      .map(([source, row]) => ({ source, ...row }))
      .sort((a, b) => b.seats - a.seats || (a.source < b.source ? -1 : 1)),
  };
}
