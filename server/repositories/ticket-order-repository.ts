import "server-only";

import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { TicketCheckout } from "@/lib/payments/schema";
import type { TicketQuote } from "@/lib/payments/catalog";
import { validateRfc } from "@/lib/payments/rfc";
import type { TicketOrderStatus } from "@/lib/payments/result";
import { TICKET_ORDER_STATUSES } from "@/lib/payments/result";

/**
 * `lib/database.types.ts` is generated from the database and must not be
 * hand-edited. It will only describe the tables added by
 * `20260824120000_add_ticket_orders.sql` after that migration is applied and
 * `npm run db:types` is re-run.
 *
 * Until then this narrow local contract types the three new RPCs. It is
 * deliberately confined to this module so no other file depends on it, and it
 * is the one place to delete once the generated types catch up.
 */
type TicketOrderRpc = {
  create_ticket_order: {
    Args: Record<string, unknown>;
    Returns: unknown;
  };
  attach_ticket_order_preference: {
    Args: Record<string, unknown>;
    Returns: unknown;
  };
  record_ticket_order_payment: {
    Args: Record<string, unknown>;
    Returns: unknown;
  };
};

type TicketOrderDatabase = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: TicketOrderRpc;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

function rpcClient(): SupabaseClient<TicketOrderDatabase> {
  return getSupabaseServerClient() as unknown as SupabaseClient<TicketOrderDatabase>;
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
  order_id: z.string().uuid(),
  outcome: z.enum(["created", "replayed", "conflict"]),
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
  | { outcome: "conflict"; orderId: string };

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
    .from("ticket_orders" as never)
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
