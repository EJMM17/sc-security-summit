import "server-only";

type PaymentEvent =
  | "ticket_order_persisted"
  | "ticket_order_replayed"
  | "ticket_order_persistence_failed"
  | "ticket_order_preference_created"
  | "ticket_order_preference_failed"
  | "ticket_payment_recorded"
  | "ticket_payment_ignored"
  | "ticket_webhook_rejected"
  | "ticket_webhook_failed";

type PaymentEventContext = {
  orderId?: string;
  tier?: "plus" | "general" | "estudiante";
  quantity?: number;
  language?: "es" | "en";
  requiresInvoice?: boolean;
  status?: string;
  outcome?: string;
  code?: string;
  totalCents?: number;
};

/**
 * Deliberately accepts only identifiers, amounts and technical codes approved
 * by the PII policy. Buyer name, email, phone, RFC, legal name, postal code
 * and the MercadoPago payer block must never reach a log line. Do not widen
 * this type to accept arbitrary metadata.
 */
export function recordPaymentEvent(
  event: PaymentEvent,
  context: PaymentEventContext = {},
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    ...context,
  };

  if (
    event === "ticket_order_persistence_failed" ||
    event === "ticket_order_preference_failed" ||
    event === "ticket_webhook_failed"
  ) {
    console.error(JSON.stringify(entry));
  } else {
    console.info(JSON.stringify(entry));
  }
}
