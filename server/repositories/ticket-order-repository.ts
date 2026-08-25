import "server-only";

import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { TicketCheckout } from "@/lib/payments/schema";
import type { TicketQuote } from "@/lib/payments/catalog";
import { validateRfc } from "@/lib/payments/rfc";
import type { TicketOrderStatus } from "@/lib/payments/result";
import { TICKET_ORDER_STATUSES } from "@/lib/payments/result";

/**
 * The generated types now describe the ticket tables and RPCs, so the shared
 * server client is used directly and no local database contract is needed.
 */
function rpcClient() {
  return getSupabaseServerClient();
}

export class TicketOrderRepositoryError extends Error {
  readonly code: string;

  constructor(operation: string, error: unknown) {
    const code = safeTechnicalCode(error);
    super(`Ticket order repository operation failed: ${operation} (${code})`);
    this.name = "TicketOrderRepositoryError";
    this.code = code;
  }
}

function safeTechnicalCode(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return "database_error";
  }
  const code = String(error.code);
  return /^[a-zA-Z0-9_.-]{1,64}$/.test(code) ? code : "database_error";
}

function firstRpcRow(data: unknown): unknown {
  return Array.isArray(data) ? data[0] : undefined;
}

const createOrderRowSchema = z.object({
  // `sold_out` carries no order because none was created.
  order_id: z.string().uuid().nullable(),
  outcome: z.enum(["created", "replayed", "conflict", "sold_out"]),
  total_cents: z.coerce.number().int().nonnegative().nullable(),
});

const preferenceRowSchema = z.object({
  order_id: z.string().uuid(),
  preference_id: z.string().min(1).max(128),
});

const paymentRowSchema = z.object({
  order_id: z.string().uuid(),
  order_status: z.enum(
    TICKET_ORDER_STATUSES as unknown as [TicketOrderStatus, ...TicketOrderStatus[]],
  ),
  outcome: z.enum(["updated", "duplicate", "ignored"]),
});

const storedOrderRowSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(
    TICKET_ORDER_STATUSES as unknown as [TicketOrderStatus, ...TicketOrderStatus[]],
  ),
  tier: z.enum(["plus", "general", "estudiante"]),
  quantity: z.coerce.number().int().min(1),
  subtotal_cents: z.coerce.number().int().nonnegative(),
  tax_cents: z.coerce.number().int().nonnegative(),
  total_cents: z.coerce.number().int().nonnegative(),
  language: z.enum(["es", "en"]),
  requires_invoice: z.boolean(),
});

export type PersistTicketOrderResult =
  | { outcome: "created" | "replayed"; orderId: string; totalCents: number }
  | { outcome: "conflict"; orderId: string }
  | { outcome: "sold_out" };

export type StoredTicketOrder = z.infer<typeof storedOrderRowSchema>;

export type RecordPaymentResult = {
  orderId: string;
  status: TicketOrderStatus;
  outcome: "updated" | "duplicate" | "ignored";
};

/**
 * Adds calendar months while clamping end-of-month dates. Ticket orders are
 * fiscal records, so they are retained for five years (CFDI obligation)
 * instead of the 18 months that apply to marketing inquiries.
 */
export function orderRetentionDateFrom(consentedAt: Date, months = 60): string {
  const monthIndex = consentedAt.getUTCMonth() + months;
  const targetYear = consentedAt.getUTCFullYear() + Math.floor(monthIndex / 12);
  const targetMonth = ((monthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(consentedAt.getUTCDate(), lastDay);
  return new Date(Date.UTC(targetYear, targetMonth, targetDay))
    .toISOString()
    .slice(0, 10);
}

export async function persistTicketOrder(
  order: TicketCheckout,
  quote: TicketQuote,
  payloadHash: string,
  consentedAt: Date,
): Promise<PersistTicketOrderResult> {
  const attribution = order.attribution;
  const invoice = order.invoice;
  const personType = invoice
    ? (() => {
        const validated = validateRfc(invoice.rfc);
        return validated.valid ? validated.personType : undefined;
      })()
    : undefined;

  const { data, error } = await rpcClient().rpc("create_ticket_order", {
    p_submission_id: order.submissionId,
    p_payload_hash: payloadHash,
    p_tier: quote.tier,
    p_quantity: quote.quantity,
    p_unit_price_cents: quote.unitPriceCents,
    p_subtotal_cents: quote.subtotalCents,
    p_tax_rate_basis_points: quote.taxRateBasisPoints,
    p_tax_cents: quote.taxCents,
    p_buyer_name: `${order.firstName} ${order.lastName}`,
    p_email: order.email,
    p_phone: order.phone,
    p_language: order.language,
    p_consent_version: order.consentVersion,
    p_consented_at: consentedAt.toISOString(),
    p_retention_until: orderRetentionDateFrom(consentedAt),
    p_requires_invoice: order.requiresInvoice,
    p_company: order.company,
    p_rfc: invoice?.rfc,
    p_person_type: personType,
    p_legal_name: invoice?.legalName,
    p_tax_regime: invoice?.taxRegime,
    p_cfdi_use: invoice?.cfdiUse,
    p_postal_code: invoice?.postalCode,
    p_billing_email: invoice?.billingEmail,
    p_utm_source: attribution.utm_source,
    p_utm_medium: attribution.utm_medium,
    p_utm_campaign: attribution.utm_campaign,
    p_utm_term: attribution.utm_term,
    p_utm_content: attribution.utm_content,
    p_landing_page: attribution.landing_page,
    p_referrer: attribution.referrer,
    p_first_touch_at: attribution.first_touch_timestamp,
    p_last_touch_at: attribution.last_touch_timestamp,
  });

  if (error) throw new TicketOrderRepositoryError("create_ticket_order", error);

  const parsed = createOrderRowSchema.safeParse(firstRpcRow(data));
  if (!parsed.success) {
    throw new TicketOrderRepositoryError("create_ticket_order_response", {
      code: "invalid_response",
    });
  }

  const row = parsed.data;
  if (row.outcome === "sold_out") {
    return { outcome: "sold_out" };
  }
  if (!row.order_id) {
    throw new TicketOrderRepositoryError("create_ticket_order_response", {
      code: "missing_order_id",
    });
  }
  if (row.outcome === "conflict") {
    return { outcome: "conflict", orderId: row.order_id };
  }
  if (row.total_cents === null) {
    throw new TicketOrderRepositoryError("create_ticket_order_response", {
      code: "missing_total",
    });
  }

  return {
    outcome: row.outcome,
    orderId: row.order_id,
    totalCents: row.total_cents,
  };
}

export async function attachPreference(
  orderId: string,
  preferenceId: string,
): Promise<string> {
  const { data, error } = await rpcClient().rpc(
    "attach_ticket_order_preference",
    { p_order_id: orderId, p_preference_id: preferenceId },
  );

  if (error) {
    throw new TicketOrderRepositoryError("attach_ticket_order_preference", error);
  }

  const parsed = preferenceRowSchema.safeParse(firstRpcRow(data));
  if (!parsed.success) {
    throw new TicketOrderRepositoryError(
      "attach_ticket_order_preference_response",
      { code: "invalid_response" },
    );
  }
  return parsed.data.preference_id;
}

export async function recordPayment(input: {
  orderId: string;
  paymentId: string;
  status: TicketOrderStatus;
  providerStatus?: string;
  providerStatusDetail?: string;
  paidAt?: string;
}): Promise<RecordPaymentResult> {
  const { data, error } = await rpcClient().rpc("record_ticket_order_payment", {
    p_order_id: input.orderId,
    p_payment_id: input.paymentId,
    p_status: input.status,
    p_provider_status: input.providerStatus?.slice(0, 120),
    p_provider_status_detail: input.providerStatusDetail?.slice(0, 120),
    p_paid_at: input.paidAt,
  });

  if (error) {
    throw new TicketOrderRepositoryError("record_ticket_order_payment", error);
  }

  const parsed = paymentRowSchema.safeParse(firstRpcRow(data));
  if (!parsed.success) {
    throw new TicketOrderRepositoryError(
      "record_ticket_order_payment_response",
      { code: "invalid_response" },
    );
  }

  return {
    orderId: parsed.data.order_id,
    status: parsed.data.order_status,
    outcome: parsed.data.outcome,
  };
}

/**
 * Reads the non-sensitive summary the return pages render. Buyer name, email,
 * phone and every fiscal identifier are deliberately excluded: the return URL
 * is guessable-adjacent and must not become a PII disclosure.
 */
export async function getTicketOrderSummary(
  orderId: string,
): Promise<StoredTicketOrder | null> {
  const { data, error } = await getSupabaseServerClient()
    .from("ticket_orders")
    .select(
      "id,status,tier,quantity,subtotal_cents,tax_cents,total_cents,language,requires_invoice",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw new TicketOrderRepositoryError("get_ticket_order", error);
  if (!data) return null;

  const parsed = storedOrderRowSchema.safeParse(data);
  if (!parsed.success) {
    throw new TicketOrderRepositoryError("get_ticket_order_response", {
      code: "invalid_response",
    });
  }
  return parsed.data;
}

// ---------------------------------------------------------------------------
// Notification outbox
// ---------------------------------------------------------------------------

const claimedNotificationRowSchema = z.object({
  notification_id: z.string().uuid(),
  order_id: z.string().uuid(),
  attempt_number: z.coerce.number().int().min(1),
  template: z.string().min(1).max(120),
});

const notificationStatusRowSchema = z.object({
  status: z.enum(["pending", "processing", "sent", "retry", "dead"]),
});

export type TicketNotificationStatus = z.infer<
  typeof notificationStatusRowSchema
>["status"];

export type ClaimedTicketOrderNotification = {
  notificationId: string;
  orderId: string;
  attemptNumber: number;
  template: string;
};

function parseNotificationClaims(
  data: unknown,
  operation: string,
): ClaimedTicketOrderNotification[] {
  if (!Array.isArray(data)) {
    throw new TicketOrderRepositoryError(operation, { code: "invalid_response" });
  }

  return data.map((value) => {
    const parsed = claimedNotificationRowSchema.safeParse(value);
    if (!parsed.success) {
      throw new TicketOrderRepositoryError(operation, {
        code: "invalid_response",
      });
    }
    return {
      notificationId: parsed.data.notification_id,
      orderId: parsed.data.order_id,
      attemptNumber: parsed.data.attempt_number,
      template: parsed.data.template,
    };
  });
}

export async function claimTicketOrderNotification(
  notificationId: string,
): Promise<ClaimedTicketOrderNotification | null> {
  const { data, error } = await rpcClient().rpc(
    "claim_ticket_order_notification",
    { p_notification_id: notificationId },
  );
  if (error) {
    throw new TicketOrderRepositoryError("claim_ticket_order_notification", error);
  }
  return (
    parseNotificationClaims(data, "claim_ticket_order_notification_response")[0] ??
    null
  );
}

export async function claimDueTicketOrderNotifications(
  limit: number,
): Promise<ClaimedTicketOrderNotification[]> {
  const boundedLimit = Math.max(1, Math.min(Math.trunc(limit), 25));
  const { data, error } = await rpcClient().rpc(
    "claim_ticket_order_notifications",
    { p_limit: boundedLimit },
  );
  if (error) {
    throw new TicketOrderRepositoryError("claim_ticket_order_notifications", error);
  }
  return parseNotificationClaims(
    data,
    "claim_ticket_order_notifications_response",
  );
}

export async function completeTicketOrderNotification(input: {
  notificationId: string;
  attemptNumber: number;
  result: "sent" | "retry" | "dead";
  durationMs: number;
  providerMessageId?: string;
  errorCode?: string;
  nextAttemptAt?: string;
}): Promise<TicketNotificationStatus> {
  const { data, error } = await rpcClient().rpc(
    "complete_ticket_order_notification",
    {
      p_notification_id: input.notificationId,
      p_attempt_number: input.attemptNumber,
      p_result: input.result,
      p_duration_ms: Math.max(0, Math.min(Math.trunc(input.durationMs), 900_000)),
      p_provider_message_id: input.providerMessageId?.slice(0, 255),
      p_error_code: input.errorCode?.slice(0, 120),
      p_next_attempt_at: input.nextAttemptAt,
    },
  );

  if (error) {
    throw new TicketOrderRepositoryError(
      "complete_ticket_order_notification",
      error,
    );
  }

  const parsed = notificationStatusRowSchema.safeParse(firstRpcRow(data));
  if (!parsed.success) {
    throw new TicketOrderRepositoryError(
      "complete_ticket_order_notification_response",
      { code: "invalid_response" },
    );
  }
  return parsed.data.status;
}

export async function getTicketNotificationStatus(
  notificationId: string,
): Promise<TicketNotificationStatus> {
  const { data, error } = await getSupabaseServerClient()
    .from("ticket_order_notifications")
    .select("status")
    .eq("id", notificationId)
    .single();

  if (error) {
    throw new TicketOrderRepositoryError("get_notification_status", error);
  }
  const parsed = notificationStatusRowSchema.safeParse(data);
  if (!parsed.success) {
    throw new TicketOrderRepositoryError("get_notification_status_response", {
      code: "invalid_response",
    });
  }
  return parsed.data.status;
}

const notifiableOrderRowSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(
    TICKET_ORDER_STATUSES as unknown as [TicketOrderStatus, ...TicketOrderStatus[]],
  ),
  tier: z.enum(["plus", "general", "estudiante"]),
  quantity: z.coerce.number().int().min(1),
  unit_price_cents: z.coerce.number().int().nonnegative(),
  subtotal_cents: z.coerce.number().int().nonnegative(),
  tax_cents: z.coerce.number().int().nonnegative(),
  total_cents: z.coerce.number().int().nonnegative(),
  tax_rate_basis_points: z.coerce.number().int().nonnegative(),
  buyer_name: z.string(),
  email: z.string(),
  phone: z.string(),
  company: z.string().nullable(),
  language: z.enum(["es", "en"]),
  requires_invoice: z.boolean(),
});

export type NotifiableTicketOrder = z.infer<typeof notifiableOrderRowSchema>;

/**
 * Reads the fields the confirmation emails need. Fiscal data is deliberately
 * not joined: the receipt states that a CFDI was requested, never the RFC.
 */
export async function getNotifiableTicketOrder(
  orderId: string,
): Promise<NotifiableTicketOrder> {
  const { data, error } = await getSupabaseServerClient()
    .from("ticket_orders")
    .select(
      "id,status,tier,quantity,unit_price_cents,subtotal_cents,tax_cents,total_cents,tax_rate_basis_points,buyer_name,email,phone,company,language,requires_invoice",
    )
    .eq("id", orderId)
    .single();

  if (error) throw new TicketOrderRepositoryError("get_notifiable_order", error);
  const parsed = notifiableOrderRowSchema.safeParse(data);
  if (!parsed.success) {
    throw new TicketOrderRepositoryError("get_notifiable_order_response", {
      code: "invalid_response",
    });
  }
  return parsed.data;
}

const notificationIdRowSchema = z.object({ id: z.string().uuid() });

/**
 * Notification ids enqueued for an order and not yet delivered. The webhook
 * uses this to attempt an immediate send; anything it misses is picked up by
 * cron from the same outbox.
 */
export async function listDeliverableTicketOrderNotificationIds(
  orderId: string,
): Promise<string[]> {
  const { data, error } = await getSupabaseServerClient()
    .from("ticket_order_notifications")
    .select("id")
    .eq("order_id", orderId)
    .in("status", ["pending", "retry"]);

  if (error) {
    throw new TicketOrderRepositoryError("list_order_notifications", error);
  }
  if (!Array.isArray(data)) return [];

  return data.flatMap((row) => {
    const parsed = notificationIdRowSchema.safeParse(row);
    return parsed.success ? [parsed.data.id] : [];
  });
}

const pendingOrderIdRowSchema = z.object({ id: z.string().uuid() });

/**
 * Orders still `pending` that are old enough to be worth asking the provider
 * about, oldest first.
 *
 * `minAgeSeconds` keeps the sweep away from orders whose buyer is still on the
 * MercadoPago checkout: those are pending for the ordinary reason and the
 * webhook, or the buyer's own return to the site, will resolve them. Only an
 * order that stayed pending past that window is evidence something was lost.
 */
export async function listStalePendingTicketOrderIds(input: {
  minAgeSeconds: number;
  maxAgeDays: number;
  limit: number;
  now: Date;
}): Promise<string[]> {
  const newestAt = new Date(
    input.now.getTime() - input.minAgeSeconds * 1_000,
  ).toISOString();
  const oldestAt = new Date(
    input.now.getTime() - input.maxAgeDays * 86_400_000,
  ).toISOString();

  const { data, error } = await getSupabaseServerClient()
    .from("ticket_orders")
    .select("id")
    .eq("status", "pending")
    .lte("created_at", newestAt)
    // An order older than the provider's own retention is never going to be
    // answered; sweeping it forever would be a permanent, pointless cost.
    .gte("created_at", oldestAt)
    .order("created_at", { ascending: true })
    .limit(input.limit);

  if (error) {
    throw new TicketOrderRepositoryError("list_stale_pending_orders", error);
  }
  if (!Array.isArray(data)) return [];

  return data.flatMap((row) => {
    const parsed = pendingOrderIdRowSchema.safeParse(row);
    return parsed.success ? [parsed.data.id] : [];
  });
}
