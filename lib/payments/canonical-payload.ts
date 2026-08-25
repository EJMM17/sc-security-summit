import "server-only";

import { createHash } from "node:crypto";
import type { TicketCheckout } from "@/lib/payments/schema";

const CANONICAL_PAYLOAD_VERSION = "ticket-order-payload-v2";

/**
 * The insertion order below is part of the versioned idempotency contract.
 *
 * Attribution is excluded for the same reason as on the inquiry forms: a retry
 * from a different campaign link must still be recognized as the same order.
 * The invoice block IS included — asking for a CFDI, or changing the RFC, is a
 * materially different order and must not silently replay the original.
 */
export function canonicalTicketOrderPayload(order: TicketCheckout): string {
  return JSON.stringify({
    version: CANONICAL_PAYLOAD_VERSION,
    tier: order.tier,
    quantity: order.quantity,
    buyerName: `${order.firstName} ${order.lastName}`,
    email: order.email,
    phone: order.phone,
    company: order.company ?? null,
    language: order.language,
    consentVersion: order.consentVersion,
    requiresInvoice: order.requiresInvoice,
    referral: order.referral ?? null,
    // The roster is part of the order: changing a participant's name is a
    // different block, not a replay of the one already stored.
    attendees: order.attendees ?? null,
    invoice: order.invoice
      ? {
          rfc: order.invoice.rfc,
          legalName: order.invoice.legalName,
          taxRegime: order.invoice.taxRegime,
          cfdiUse: order.invoice.cfdiUse,
          postalCode: order.invoice.postalCode,
          billingEmail: order.invoice.billingEmail ?? null,
        }
      : null,
  });
}

export function hashTicketOrderPayload(order: TicketCheckout): string {
  return createHash("sha256")
    .update(canonicalTicketOrderPayload(order), "utf8")
    .digest("hex");
}
