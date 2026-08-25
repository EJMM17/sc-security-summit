import "server-only";

import { checkRateLimit } from "@/lib/rate-limit";
import {
  getTicketOrderSummary,
  listDeliverableTicketOrderNotificationIds,
  recordPayment,
  type StoredTicketOrder,
} from "@/server/repositories/ticket-order-repository";
import {
  findPaymentByExternalReference,
  mapPaymentStatus,
  MercadoPagoConfigurationError,
} from "@/server/services/mercadopago-client";
import { recordPaymentEvent } from "@/server/services/payment-observability";
import { tryImmediateTicketOrderNotification } from "@/server/services/ticket-order-notifier";

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
  const throttle = options.throttle ?? true;
  const stored = await getTicketOrderSummary(orderId).catch(() => null);
  if (!stored || stored.status !== "pending") return stored;

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
      return stored;
    }
  }

  let status: ReturnType<typeof mapPaymentStatus>;
  let paymentId: string;
  let providerStatus: string;
  let providerStatusDetail: string | undefined;
  let paidAt: string | undefined;

  try {
    const payment = await findPaymentByExternalReference(orderId);
    if (!payment || !payment.id) return stored;

    status = mapPaymentStatus(payment.status);
    if (status === "pending") return stored;

    paymentId = payment.id;
    providerStatus = payment.status;
    providerStatusDetail = payment.statusDetail ?? undefined;
    paidAt = payment.dateApproved ?? undefined;
  } catch (error) {
    recordPaymentEvent("ticket_order_reconcile_failed", {
      orderId,
      code:
        error instanceof MercadoPagoConfigurationError
          ? "not_configured"
          : technicalCode(error),
    });
    return stored;
  }

  try {
    const result = await recordPayment({
      orderId,
      paymentId,
      status,
      providerStatus,
      providerStatusDetail,
      paidAt,
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
    return stored;
  }

  return (await getTicketOrderSummary(orderId).catch(() => stored)) ?? stored;
}

function technicalCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String((error as { code: unknown }).code);
    if (/^[a-zA-Z0-9_.-]{1,64}$/.test(code)) return code;
  }
  return "unexpected_error";
}
