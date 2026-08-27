export type CheckoutFailureReason =
  | "invalid"
  | "invalid_invoice"
  | "rate_limited"
  | "storage_unavailable"
  | "idempotency_conflict"
  | "sold_out"
  | "provider_unavailable"
  | "discount_code_changed"
  | "unexpected";

export type CheckoutResult =
  | {
      ok: true;
      orderId: string;
      /** MercadoPago hosted checkout URL the browser must be sent to. */
      checkoutUrl: string;
      subtotalCents: number;
      taxCents: number;
      totalCents: number;
    }
  | {
      ok: false;
      reason: CheckoutFailureReason;
    };

/**
 * Why an optional discount code was not applied. The buyer is told the code
 * does not apply and nothing more: naming the exact rule would turn the form
 * into an oracle for probing partner agreements.
 */
export type DiscountCodeRejection =
  | "unknown"
  | "not_applicable"
  | "rate_limited"
  | "unavailable";

/**
 * What the checkout form is told about a code it asked the server to check.
 *
 * Every amount is computed server side from the tier and quantity the form
 * already sends; the browser never supplies a price. The answer is
 * informational only — the pay action re-reads the coupon and re-prices the
 * order from scratch.
 */
export type DiscountCodeResult =
  | {
      valid: true;
      code: string;
      discountBasisPoints: number;
      /** Gross line total before the code, in cents. */
      listTotalCents: number;
      discountCents: number;
      totalCents: number;
    }
  | {
      valid: false;
      reason: DiscountCodeRejection;
      listTotalCents: number;
      discountCents: 0;
      totalCents: number;
    };

export type TicketOrderStatus =
  | "pending"
  | "in_process"
  | "paid"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back";

export const TICKET_ORDER_STATUSES: readonly TicketOrderStatus[] = [
  "pending",
  "in_process",
  "paid",
  "rejected",
  "cancelled",
  "refunded",
  "charged_back",
];

export type TicketOrderNotificationTemplate =
  | "ticket_buyer_receipt_v1"
  | "ticket_order_internal_v1";

export const TICKET_ORDER_NOTIFICATION_TEMPLATES: readonly TicketOrderNotificationTemplate[] =
  ["ticket_buyer_receipt_v1", "ticket_order_internal_v1"];
