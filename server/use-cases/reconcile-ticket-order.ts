import "server-only";

import { checkRateLimit } from "@/lib/rate-limit";
import {
  getTicketOrderSummary,
  listDeliverableTicketOrderNotificationIds,
  recordPayment,
  type StoredTicketOrder,
} from "@/server/repositories/ticket-order-repository";
import {
  capturedAmountCents,
  findPaymentByExternalReference,
  mapPaymentStatus,
  MercadoPagoConfigurationError,
} from "@/server/services/mercadopago-client";
import { recordPaymentEvent } from "@/server/services/payment-observability";
import { tryImmediateTicketOrderNotification } from "@/server/services/ticket-order-notifier";

/**
 * What the provider had to say about an order.
 *
 * The sweep needs more than the resulting order: "MercadoPago has no payment
 * for this order" is what separates an abandoned checkout from one that could
 * not be checked, and only the first of those may be expired.
 */
export type ReconcileOutcome =
  /** The stored order moved to a terminal status. */
  | "updated"
  /** The provider answered and holds no payment for this order at all. */
  | "no_payment"
  /** A payment exists but has nothing terminal to say yet. */
  | "provider_pending"
  /** The order was already terminal, or does not exist. */
  | "not_pending"
  /** Throttled, misconfigured or failed: the provider was not heard from. */
  | "unavailable";

export type ReconcileResult = {
  order: StoredTicketOrder | null;
  outcome: ReconcileOutcome;
};

/**
 * Brings one order's stored status back in line with MercadoPago.
 *
 * The webhook is the primary path and stays authoritative; this is the safety
 * net for the case it never arrived — a notification URL registered wrong, a
 * provider outage, or a delivery dropped while the site was down. Without it a
 * paid order can sit `pending` forever: no receipt for the buyer, no seat
 * committed, and nothing in `/admin` to suggest anything went wrong.
 *
 * Only a `pending` order is reconciled. Every terminal state was written by
 * `record_ticket_order_payment`, and re-reading the provider cannot improve on
 * it — a late `pending` notification must never degrade a `paid` order.
 */
export async function reconcileTicketOrder(
  orderId: string,
  options: { throttle?: boolean } = {},
): Promise<StoredTicketOrder | null> {
  return (await reconcileTicketOrderWithOutcome(orderId, options)).order;
}

/**
 * The same reconciliation, reporting what the provider said.
 *
 * Only the sweep needs this: a page renders the order and nothing else.
 */
export async function reconcileTicketOrderWithOutcome(
  orderId: string,
  options: { throttle?: boolean } = {},
): Promise<ReconcileResult> {
  const throttle = options.throttle ?? true;
  const stored = await getTicketOrderSummary(orderId).catch(() => null);
  if (!stored || stored.status !== "pending") {
    return { order: stored, outcome: "not_pending" };
  }

  // A buyer refreshing the return page must not turn into a stream of provider
  // calls. Being throttled is not an error here: the stored state still
  // renders, and the webhook or the next visit will catch up.
  // The cron sweep opts out: it already paces itself by schedule and batch
  // size, and sharing the visitor budget would let a refreshing buyer starve
  // the sweep that exists precisely for buyers who never came back.
  if (throttle) {
    try {
      await checkRateLimit(`reconcile:${orderId}`);
    } catch {
      return { order: stored, outcome: "unavailable" };
    }
  }

  let status: ReturnType<typeof mapPaymentStatus>;
  let paymentId: string;
  let providerStatus: string;
  let providerStatusDetail: string | undefined;
  let paidAt: string | undefined;
  let paidAmountCents: number | null = null;

  try {
    const payment = await findPaymentByExternalReference(orderId);
    // No payment at all is the abandoned checkout: the buyer never got as far
    // as one. A payment without an id is malformed rather than absent, so it
    // is reported as pending news and never as evidence of abandonment.
    if (!payment) return { order: stored, outcome: "no_payment" };
    if (!payment.id) return { order: stored, outcome: "provider_pending" };

    status = mapPaymentStatus(payment.status);
    if (status === "pending") {
      return { order: stored, outcome: "provider_pending" };
    }

    paymentId = payment.id;
    providerStatus = payment.status;
    providerStatusDetail = payment.statusDetail ?? undefined;
    paidAt = payment.dateApproved ?? undefined;
    // Same amount guard the webhook applies: reconciliation is a second path
    // to the same write, so it must not be a way around it.
    paidAmountCents = capturedAmountCents(payment);
  } catch (error) {
    recordPaymentEvent("ticket_order_reconcile_failed", {
      orderId,
      code:
        error instanceof MercadoPagoConfigurationError
          ? "not_configured"
          : technicalCode(error),
    });
    return { order: stored, outcome: "unavailable" };
  }

  try {
    const result = await recordPayment({
      orderId,
      paymentId,
      status,
      providerStatus,
      providerStatusDetail,
      paidAt,
      paidAmountCents,
    });

    recordPaymentEvent("ticket_order_reconciled", {
      orderId: result.orderId,
      status: result.status,
      outcome: result.outcome,
    });

    // Reaching `paid` here means the webhook never did, so the receipt and the
    // internal notice are enqueued by the same trigger and still undelivered.
    if (result.outcome === "updated" && result.status === "paid") {
      const notificationIds =
        await listDeliverableTicketOrderNotificationIds(result.orderId);
      await Promise.all(
        notificationIds.map((id) =>
          tryImmediateTicketOrderNotification(id).catch(() => "queued"),
        ),
      );
    }
  } catch (error) {
    recordPaymentEvent("ticket_order_reconcile_failed", {
      orderId,
      code: technicalCode(error),
    });
    return { order: stored, outcome: "unavailable" };
  }

  const refreshed =
    (await getTicketOrderSummary(orderId).catch(() => stored)) ?? stored;
  return { order: refreshed, outcome: "updated" };
}

function technicalCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String((error as { code: unknown }).code);
    if (/^[a-zA-Z0-9_.-]{1,64}$/.test(code)) return code;
  }
  return "unexpected_error";
}
