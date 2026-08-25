import "server-only";

import { listStalePendingTicketOrderIds } from "@/server/repositories/ticket-order-repository";
import { isMercadoPagoConfigured } from "@/server/services/mercadopago-client";
import { recordPaymentEvent } from "@/server/services/payment-observability";
import { reconcileTicketOrder } from "@/server/use-cases/reconcile-ticket-order";

/**
 * An order is only swept once it has been pending longer than the checkout can
 * legitimately take. Below this it is pending for the ordinary reason — the
 * buyer is still on MercadoPago — and asking the provider would just cost a
 * call.
 */
export const SWEEP_MIN_AGE_SECONDS = 15 * 60;

/**
 * Past this the preference has long expired and MercadoPago has nothing new to
 * say. Sweeping forever would turn abandoned checkouts into a permanent cost.
 */
export const SWEEP_MAX_AGE_DAYS = 7;

export const SWEEP_DEFAULT_BATCH_SIZE = 20;
export const SWEEP_MAX_BATCH_SIZE = 50;

export type SweepResult = {
  scanned: number;
  resolved: number;
  stillPending: number;
};

/**
 * Reconciles orders left `pending`, without waiting for anyone to visit a
 * return page.
 *
 * The return pages already reconcile, but only for a buyer who comes back. One
 * who pays and closes the tab — or who never had a webhook to rely on because
 * `MERCADOPAGO_WEBHOOK_SECRET` is not configured yet — would otherwise leave a
 * paid order stranded in `pending`: no receipt, no seat committed, nothing in
 * `/admin` that looks wrong. This sweep is what makes selling without a
 * registered webhook safe rather than merely possible.
 *
 * Every write goes through the same idempotent `record_ticket_order_payment`,
 * so a sweep racing a webhook cannot double-apply a payment.
 */
export async function sweepPendingTicketOrders(
  batchSize: number = SWEEP_DEFAULT_BATCH_SIZE,
  now: Date = new Date(),
): Promise<SweepResult> {
  // Without credentials there is nobody to ask. Reporting a clean empty sweep
  // beats failing a cron run for a checkout that is deliberately switched off.
  if (!isMercadoPagoConfigured()) {
    return { scanned: 0, resolved: 0, stillPending: 0 };
  }

  const limit = Math.min(Math.max(1, batchSize), SWEEP_MAX_BATCH_SIZE);
  const orderIds = await listStalePendingTicketOrderIds({
    minAgeSeconds: SWEEP_MIN_AGE_SECONDS,
    maxAgeDays: SWEEP_MAX_AGE_DAYS,
    limit,
    now,
  });

  if (orderIds.length === 0) {
    return { scanned: 0, resolved: 0, stillPending: 0 };
  }

  // Sequential on purpose: a burst of parallel provider calls is how a sweep
  // gets rate limited by MercadoPago, and nothing here is latency sensitive.
  let resolved = 0;
  for (const orderId of orderIds) {
    const order = await reconcileTicketOrder(orderId, { throttle: false }).catch(
      () => null,
    );
    if (order && order.status !== "pending") resolved += 1;
  }

  const result: SweepResult = {
    scanned: orderIds.length,
    resolved,
    stillPending: orderIds.length - resolved,
  };

  recordPaymentEvent("ticket_order_sweep_completed", {
    scanned: result.scanned,
    resolved: result.resolved,
  });

  return result;
}
