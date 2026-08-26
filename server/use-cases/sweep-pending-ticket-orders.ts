import "server-only";

import {
  expireStaleTicketOrders,
  listStalePendingTicketOrderIds,
} from "@/server/repositories/ticket-order-repository";
import { isMercadoPagoConfigured } from "@/server/services/mercadopago-client";
import { recordPaymentEvent } from "@/server/services/payment-observability";
import { reconcileTicketOrderWithOutcome } from "@/server/use-cases/reconcile-ticket-order";

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

/**
 * How long a pending order may stay pending before it is treated as
 * abandoned.
 *
 * Twice the preference expiry (30 minutes in create-ticket-checkout), so a
 * buyer who is slow but real is never cancelled out from under: by this point
 * the preference itself is long dead and MercadoPago has been asked at least
 * once and answered that no payment exists.
 */
export const EXPIRY_MINUTES = 60;

export const SWEEP_DEFAULT_BATCH_SIZE = 20;
export const SWEEP_MAX_BATCH_SIZE = 50;

export type SweepResult = {
  scanned: number;
  resolved: number;
  stillPending: number;
  expired: number;
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
    return { scanned: 0, resolved: 0, stillPending: 0, expired: 0 };
  }

  const limit = Math.min(Math.max(1, batchSize), SWEEP_MAX_BATCH_SIZE);
  const orderIds = await listStalePendingTicketOrderIds({
    minAgeSeconds: SWEEP_MIN_AGE_SECONDS,
    maxAgeDays: SWEEP_MAX_AGE_DAYS,
    limit,
    now,
  });

  if (orderIds.length === 0) {
    return { scanned: 0, resolved: 0, stillPending: 0, expired: 0 };
  }

  // Sequential on purpose: a burst of parallel provider calls is how a sweep
  // gets rate limited by MercadoPago, and nothing here is latency sensitive.
  let resolved = 0;
  const abandonedIds: string[] = [];
  for (const orderId of orderIds) {
    const reconciled = await reconcileTicketOrderWithOutcome(orderId, {
      throttle: false,
    }).catch(() => null);
    if (!reconciled) continue;
    if (reconciled.order && reconciled.order.status !== "pending") resolved += 1;
    if (reconciled.outcome === "no_payment") abandonedIds.push(orderId);
  }

  // Only the orders MercadoPago was just asked about, and answered that it
  // holds no payment for, are named here. Age alone is not evidence of
  // abandonment: a payment can sit in a state the site has not recorded, and
  // an unreachable provider makes "abandoned" and "could not check" look
  // identical. Cancelling on that ambiguity is how a paying buyer loses an
  // order, so an unanswered sweep expires nothing.
  // A failure here must not fail the run — the reconciliation above is the
  // part that protects money — but it must not be silent either: a migration
  // that was never applied would otherwise look exactly like a sweep with
  // nothing to expire, forever.
  const expiredIds = await expireStaleTicketOrders({
    orderIds: abandonedIds,
    expiryMinutes: EXPIRY_MINUTES,
  }).catch((error: unknown) => {
    recordPaymentEvent("ticket_order_expiry_failed", {
      code: technicalCode(error),
    });
    return [] as string[];
  });

  for (const orderId of expiredIds) {
    recordPaymentEvent("ticket_order_expired", { orderId });
  }

  const expired = expiredIds.length;
  const result: SweepResult = {
    scanned: orderIds.length,
    resolved,
    // Every expired order was one of the scanned ones, and was still pending
    // when it was counted, so this cannot go negative.
    stillPending: orderIds.length - resolved - expired,
    expired,
  };

  recordPaymentEvent("ticket_order_sweep_completed", {
    scanned: result.scanned,
    resolved: result.resolved,
    expired: result.expired,
  });

  return result;
}

function technicalCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String((error as { code: unknown }).code);
    if (/^[a-zA-Z0-9_.-]{1,64}$/.test(code)) return code;
  }
  return "unexpected_error";
}
