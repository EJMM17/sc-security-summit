export type CheckoutFailureReason =
  | "invalid"
  | "invalid_invoice"
  | "rate_limited"
  | "storage_unavailable"
  | "idempotency_conflict"
  | "sold_out"
  | "provider_unavailable"
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
