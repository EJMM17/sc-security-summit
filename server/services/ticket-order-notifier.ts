import "server-only";

import { sendEmail, type SendEmailResult } from "@/lib/email";
import { emailShell, escapeHtml } from "@/lib/email-templates";
import { TICKET_TIERS } from "@/lib/payments/catalog";
import { formatMxn, formatTaxRate } from "@/lib/payments/tax";
import {
  claimDueTicketOrderNotifications,
  claimTicketOrderNotification,
  completeTicketOrderNotification,
  getNotifiableTicketOrder,
  getTicketNotificationStatus,
  TicketOrderRepositoryError,
  type ClaimedTicketOrderNotification,
  type NotifiableTicketOrder,
} from "@/server/repositories/ticket-order-repository";
import { recordPaymentEvent } from "@/server/services/payment-observability";

const MAX_NOTIFICATION_ATTEMPTS = 5;
// Four retry delays are consumed before the fifth and final attempt is dead.
const RETRY_DELAYS_MINUTES = [1, 5, 15, 60] as const;
const PERMANENT_PROVIDER_CODES = new Set([
  "invalid_from_address",
  "invalid_parameter",
  "invalid_to_address",
  "missing_required_field",
  "restricted_api_key",
  "unauthorized",
  "validation_error",
]);

export type TicketNotificationProcessingResult = "sent" | "queued" | "dead";

type TicketNotifierDependencies = {
  send: typeof sendEmail;
  getOrder: typeof getNotifiableTicketOrder;
  complete: typeof completeTicketOrderNotification;
  now: () => Date;
};

const DEFAULT_DEPENDENCIES: TicketNotifierDependencies = {
  send: sendEmail,
  getOrder: getNotifiableTicketOrder,
  complete: completeTicketOrderNotification,
  now: () => new Date(),
};

const COPY = {
  es: {
    subject: "Confirmación de compra — SC Security Summit 2026",
    heading: "¡Gracias por tu compra!",
    intro:
      "Recibimos tu pago. Guarda este correo: es tu comprobante de compra para el SC Security Summit 2026.",
    access: "Acceso",
    quantity: "Cantidad",
    unitPrice: "Precio por acceso",
    total: "Total pagado",
    reference: "Referencia de tu orden",
    invoice:
      "Solicitaste factura (CFDI). La emitimos dentro de las 72 horas siguientes con los datos fiscales que capturaste.",
    noInvoice:
      "No solicitaste factura para esta compra. Si la necesitas, escríbenos a hola@scsecuritysummit.com dentro del mismo mes en que pagaste.",
    event: "24 de septiembre de 2026 · Centro de Convenciones de Reynosa",
    studentNote:
      "El acceso Estudiante requiere credencial vigente al momento del check-in.",
    taxIncluded: "El total pagado incluye IVA del 16%.",
  },
  en: {
    subject: "Purchase confirmation — SC Security Summit 2026",
    heading: "Thank you for your purchase",
    intro:
      "We received your payment. Keep this email: it is your proof of purchase for SC Security Summit 2026.",
    access: "Pass",
    quantity: "Quantity",
    unitPrice: "Price per pass",
    total: "Total paid",
    reference: "Your order reference",
    invoice:
      "You requested a CFDI invoice. We issue it within 72 hours using the tax details you provided.",
    noInvoice:
      "You did not request an invoice for this purchase. If you need one, email hola@scsecuritysummit.com within the same calendar month as your payment.",
    event: "September 24, 2026 · Reynosa Convention Center",
    studentNote:
      "The Student pass requires a valid student ID at check-in.",
    taxIncluded: "The total paid includes 16% VAT.",
  },
} as const;

function row(label: string, value: string): string {
  return `<tr><th style="padding:10px 14px;text-align:left;vertical-align:top;color:#475569;font-weight:600">${escapeHtml(
    label,
  )}</th><td style="padding:10px 14px;color:#0f172a">${escapeHtml(value)}</td></tr>`;
}

/**
 * Receipt sent to the buyer. It restates the amounts and whether a CFDI was
 * requested, but never echoes the RFC, legal name or postal code: an email
 * inbox is not a place to duplicate someone's tax identity.
 */
export function buildBuyerReceiptEmail(order: NotifiableTicketOrder): {
  subject: string;
  html: string;
} {
  const copy = COPY[order.language];
  const tierLabel = TICKET_TIERS[order.tier].label[order.language];

  // The published price is IVA-inclusive, so the receipt states one final
  // amount. The base and the tax stay on the order row for the CFDI; a buyer
  // who did not ask for one has no use for the split.
  const rows = [
    row(copy.access, tierLabel),
    row(copy.quantity, String(order.quantity)),
    row(copy.unitPrice, formatMxn(order.unit_price_cents, order.language)),
    row(copy.total, `${formatMxn(order.total_cents, order.language)} MXN`),
    row(copy.reference, order.id),
  ].join("");

  const notes = [
    copy.taxIncluded,
    order.requires_invoice ? copy.invoice : copy.noInvoice,
    order.tier === "estudiante" ? copy.studentNote : "",
  ]
    .filter(Boolean)
    .map(
      (note) =>
        `<p style="margin:12px 0 0;font-size:13px;color:#475569">${escapeHtml(note)}</p>`,
    )
    .join("");

  return {
    subject: copy.subject,
    html: emailShell(
      copy.subject,
      `<h1 style="margin:0 0 8px;font-size:20px;color:#0f172a">${escapeHtml(
        copy.heading,
      )}</h1><p style="margin:0 0 16px;font-size:14px;color:#475569">${escapeHtml(
        copy.intro,
      )}</p><p style="margin:0 0 16px;font-size:13px;color:#64748b">${escapeHtml(
        copy.event,
      )}</p><table style="width:100%;border-collapse:collapse;background:#f8fafc">${rows}</table>${notes}`,
    ),
  };
}

/** Internal notice for the operations inbox. */
export function buildInternalOrderEmail(order: NotifiableTicketOrder): {
  subject: string;
  html: string;
} {
  const title = "Nueva compra de accesos";
  const rows = [
    row("Comprador", order.buyer_name),
    row("Correo", order.email),
    row("Teléfono", order.phone),
    row("Empresa", order.company ?? "—"),
    row("Acceso", TICKET_TIERS[order.tier].label.es),
    row("Cantidad", String(order.quantity)),
    row("Total cobrado", `${formatMxn(order.total_cents, "es")} MXN`),
    row("Base gravable", formatMxn(order.subtotal_cents, "es")),
    row(
      `IVA ${formatTaxRate(order.tax_rate_basis_points)} incluido`,
      formatMxn(order.tax_cents, "es"),
    ),
    row("Requiere CFDI", order.requires_invoice ? "Sí" : "No"),
    row("Orden", order.id),
  ].join("");

  return {
    subject: order.requires_invoice ? `${title} (con CFDI)` : title,
    html: emailShell(
      title,
      `<h1 style="margin:0 0 16px;font-size:20px;color:#0f172a">${escapeHtml(
        title,
      )}</h1><table style="width:100%;border-collapse:collapse;background:#f8fafc">${rows}</table>${
        order.requires_invoice
          ? '<p style="margin:12px 0 0;font-size:13px;color:#b45309">Los datos fiscales están en Supabase; no se envían por correo.</p>'
          : ""
      }`,
    ),
  };
}

function safeErrorCode(error: unknown, fallback = "notification_error"): string {
  if (error instanceof TicketOrderRepositoryError) return error.code;
  if (typeof error === "object" && error !== null && "code" in error) {
    const candidate = String((error as { code: unknown }).code);
    if (/^[a-zA-Z0-9_.-]{1,120}$/.test(candidate)) return candidate;
  }
  return fallback;
}

function providerCode(result: Extract<SendEmailResult, { ok: false }>): string {
  return /^[a-zA-Z0-9_.-]{1,120}$/.test(result.code)
    ? result.code
    : "provider_error";
}

function contactEmail(): string | null {
  const value = process.env.CONTACT_EMAIL?.trim();
  return value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
}

async function finalizeFailure(
  claim: ClaimedTicketOrderNotification,
  code: string,
  durationMs: number,
  dependencies: TicketNotifierDependencies,
  permanent = false,
): Promise<TicketNotificationProcessingResult> {
  const dead = permanent || claim.attemptNumber >= MAX_NOTIFICATION_ATTEMPTS;
  const delayIndex = Math.min(
    claim.attemptNumber - 1,
    RETRY_DELAYS_MINUTES.length - 1,
  );
  const nextAttemptAt = new Date(
    dependencies.now().getTime() + RETRY_DELAYS_MINUTES[delayIndex] * 60_000,
  ).toISOString();

  await dependencies.complete({
    notificationId: claim.notificationId,
    attemptNumber: claim.attemptNumber,
    result: dead ? "dead" : "retry",
    durationMs,
    errorCode: code,
    nextAttemptAt: dead ? undefined : nextAttemptAt,
  });

  recordPaymentEvent(
    dead ? "ticket_order_notification_dead" : "ticket_order_notification_retry",
    {
      orderId: claim.orderId,
      notificationId: claim.notificationId,
      template: claim.template,
      code,
      attempt: claim.attemptNumber,
      durationMs,
    },
  );
  return dead ? "dead" : "queued";
}

/**
 * Shared processor used by the immediate post-payment attempt and by cron.
 */
export async function processTicketOrderNotification(
  claim: ClaimedTicketOrderNotification,
  dependencyOverrides: Partial<TicketNotifierDependencies> = {},
): Promise<TicketNotificationProcessingResult> {
  const dependencies = { ...DEFAULT_DEPENDENCIES, ...dependencyOverrides };
  const startedAt = Date.now();

  let order: NotifiableTicketOrder;
  try {
    order = await dependencies.getOrder(claim.orderId);
  } catch (error) {
    return finalizeFailure(
      claim,
      safeErrorCode(error, "order_read_failed"),
      Date.now() - startedAt,
      dependencies,
    );
  }

  // A receipt for an order that is no longer paid would be wrong, and a refund
  // between enqueue and delivery is exactly when that happens.
  if (order.status !== "paid") {
    return finalizeFailure(
      claim,
      "order_not_paid",
      Date.now() - startedAt,
      dependencies,
      true,
    );
  }

  let recipient: string | null;
  let email: { subject: string; html: string };

  if (claim.template === "ticket_buyer_receipt_v1") {
    recipient = order.email;
    email = buildBuyerReceiptEmail(order);
  } else if (claim.template === "ticket_order_internal_v1") {
    recipient = contactEmail();
    email = buildInternalOrderEmail(order);
  } else {
    return finalizeFailure(
      claim,
      "template_mismatch",
      Date.now() - startedAt,
      dependencies,
      true,
    );
  }

  if (!recipient) {
    return finalizeFailure(
      claim,
      "missing_contact_email",
      Date.now() - startedAt,
      dependencies,
    );
  }

  let sendResult: SendEmailResult;
  try {
    sendResult = await dependencies.send({
      to: recipient,
      subject: email.subject,
      html: email.html,
      idempotencyKey: `ticket-order-notification/${claim.notificationId}`,
    });
  } catch {
    return finalizeFailure(
      claim,
      "send_exception",
      Date.now() - startedAt,
      dependencies,
    );
  }

  const durationMs = Date.now() - startedAt;
  if (!sendResult.ok) {
    const code = providerCode(sendResult);
    return finalizeFailure(
      claim,
      code,
      durationMs,
      dependencies,
      PERMANENT_PROVIDER_CODES.has(code),
    );
  }

  await dependencies.complete({
    notificationId: claim.notificationId,
    attemptNumber: claim.attemptNumber,
    result: "sent",
    durationMs,
    providerMessageId: sendResult.id,
  });
  recordPaymentEvent("ticket_order_notification_sent", {
    orderId: claim.orderId,
    notificationId: claim.notificationId,
    template: claim.template,
    language: order.language,
    attempt: claim.attemptNumber,
    durationMs,
  });
  return "sent";
}

export async function tryImmediateTicketOrderNotification(
  notificationId: string,
): Promise<"sent" | "queued"> {
  const claim = await claimTicketOrderNotification(notificationId);
  if (claim) {
    const result = await processTicketOrderNotification(claim);
    return result === "sent" ? "sent" : "queued";
  }

  const status = await getTicketNotificationStatus(notificationId);
  return status === "sent" ? "sent" : "queued";
}

export type TicketNotificationBatchResult = {
  claimed: number;
  sent: number;
  queued: number;
  dead: number;
  failed: number;
};

export async function processDueTicketOrderNotifications(
  limit = 10,
): Promise<TicketNotificationBatchResult> {
  const claims = await claimDueTicketOrderNotifications(limit);
  const summary: TicketNotificationBatchResult = {
    claimed: claims.length,
    sent: 0,
    queued: 0,
    dead: 0,
    failed: 0,
  };

  for (const claim of claims) {
    try {
      const result = await processTicketOrderNotification(claim);
      summary[result === "sent" ? "sent" : result === "dead" ? "dead" : "queued"] += 1;
    } catch {
      // One poisoned row must not stop the batch; its lease expires and the
      // next cron run recovers it as a recorded attempt.
      summary.failed += 1;
    }
  }

  return summary;
}
