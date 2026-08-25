import "server-only";

import { z } from "zod";
import type { Database } from "@/lib/database.types";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import {
  INVOICE_STATUS_VALUES,
  TICKET_ORDER_STATUS_VALUES,
  type AdminInvoiceDetails,
  type AdminTicketOrderAttendee,
  type AdminInvoiceStatus,
  type AdminTicketCapacity,
  type AdminTicketOrder,
  type AdminTicketOrderNotification,
  type AdminTicketOrderStatus,
} from "@/lib/admin/types";

/**
 * Read and operations access to ticket orders for the internal panel.
 *
 * The write surface is deliberately tiny: Operations may record the CFDI
 * outcome and its own notes, and nothing else. Amounts, buyer data, fiscal
 * identifiers, payment state and consent are submitted evidence and stay
 * read-only, exactly like the inquiry panel.
 */
export class AdminTicketOrderRepositoryError extends Error {
  readonly code: string;

  constructor(operation: string, error: unknown) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code).slice(0, 64)
        : "database_error";
    super(`Admin ticket order operation failed: ${operation} (${code})`);
    this.name = "AdminTicketOrderRepositoryError";
    this.code = code;
  }
}

const LIST_COLUMNS =
  "id, status, tier, quantity, subtotal_cents, tax_cents, total_cents, tax_rate_basis_points, buyer_name, email, phone, company, referral_source, language, requires_invoice, invoice_status, invoiced_at, cfdi_uuid, provider_payment_id, provider_status, paid_at, owner, internal_notes, created_at, updated_at, retention_until";

const orderSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(TICKET_ORDER_STATUS_VALUES),
  tier: z.enum(["plus", "general", "estudiante", "corporativo"]),
  quantity: z.coerce.number().int().min(1),
  subtotal_cents: z.coerce.number().int().min(0),
  tax_cents: z.coerce.number().int().min(0),
  total_cents: z.coerce.number().int().min(0),
  tax_rate_basis_points: z.coerce.number().int().min(0),
  buyer_name: z.string(),
  email: z.string(),
  phone: z.string(),
  company: z.string().nullable(),
  referral_source: z.string().nullable(),
  language: z.enum(["es", "en"]),
  requires_invoice: z.boolean(),
  invoice_status: z.enum(INVOICE_STATUS_VALUES),
  invoiced_at: z.string().nullable(),
  cfdi_uuid: z.string().nullable(),
  provider_payment_id: z.string().nullable(),
  provider_status: z.string().nullable(),
  paid_at: z.string().nullable(),
  owner: z.string().nullable(),
  internal_notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  retention_until: z.string(),
});

const invoiceDetailsSchema = z.object({
  order_id: z.string().uuid(),
  rfc: z.string(),
  person_type: z.enum(["fisica", "moral"]),
  legal_name: z.string(),
  tax_regime: z.string(),
  cfdi_use: z.string(),
  postal_code: z.string(),
  billing_email: z.string().nullable(),
});

const notificationSchema = z.object({
  id: z.string().uuid(),
  template: z.string(),
  status: z.enum(["pending", "processing", "sent", "retry", "dead"]),
  attempt_count: z.coerce.number().int().min(0),
  last_error_code: z.string().nullable(),
  sent_at: z.string().nullable(),
  next_attempt_at: z.string().nullable(),
});

const capacitySchema = z.object({
  scope: z.string(),
  total_seats: z.coerce.number().int().min(0),
  hold_minutes: z.coerce.number().int().min(0),
});

type TicketTableName = Extract<
  keyof Database["public"]["Tables"],
  `ticket_${string}`
>;

/**
 * The generated types now describe the ticket tables, so the panel's reads and
 * its one write are checked against the real schema instead of being cast away.
 */
function table<Name extends TicketTableName>(name: Name) {
  return getSupabaseServerClient().from(name);
}

export type ListTicketOrdersFilters = {
  status: AdminTicketOrderStatus | "all";
  invoice: AdminInvoiceStatus | "all";
  search: string;
};

export async function listTicketOrders(
  filters: ListTicketOrdersFilters,
  limit = 200,
): Promise<AdminTicketOrder[]> {
  let query = table("ticket_orders")
    .select(LIST_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.invoice !== "all") {
    query = query.eq("invoice_status", filters.invoice);
  }
  if (filters.search) {
    // PostgREST `or` takes a comma-separated filter list; commas and
    // parentheses inside the term would break out of it.
    const term = filters.search.replace(/[,()]/g, " ").trim();
    if (term) {
      query = query.or(
        `buyer_name.ilike.%${term}%,email.ilike.%${term}%,company.ilike.%${term}%`,
      );
    }
  }

  const { data, error } = await query;
  if (error) throw new AdminTicketOrderRepositoryError("list_orders", error);

  const parsed = z.array(orderSchema).safeParse(data);
  if (!parsed.success) {
    throw new AdminTicketOrderRepositoryError("list_orders_response", {
      code: "invalid_response",
    });
  }
  return parsed.data;
}

export async function getTicketOrder(
  orderId: string,
): Promise<AdminTicketOrder | null> {
  const { data, error } = await table("ticket_orders")
    .select(LIST_COLUMNS)
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw new AdminTicketOrderRepositoryError("get_order", error);
  if (!data) return null;

  const parsed = orderSchema.safeParse(data);
  if (!parsed.success) {
    throw new AdminTicketOrderRepositoryError("get_order_response", {
      code: "invalid_response",
    });
  }
  return parsed.data;
}

export async function getInvoiceDetails(
  orderId: string,
): Promise<AdminInvoiceDetails | null> {
  const { data, error } = await table("ticket_order_invoice_details")
    .select(
      "order_id, rfc, person_type, legal_name, tax_regime, cfdi_use, postal_code, billing_email",
    )
    .eq("order_id", orderId)
    .maybeSingle();

  if (error) {
    throw new AdminTicketOrderRepositoryError("get_invoice_details", error);
  }
  if (!data) return null;

  const parsed = invoiceDetailsSchema.safeParse(data);
  if (!parsed.success) {
    throw new AdminTicketOrderRepositoryError("get_invoice_details_response", {
      code: "invalid_response",
    });
  }
  return parsed.data;
}

const attendeeSchema = z.object({
  seat_number: z.coerce.number().int().min(1),
  full_name: z.string(),
});

/**
 * Roster of a corporate block, in seat order. An individual order has none, so
 * an empty list is the ordinary answer, not a missing row.
 */
export async function listOrderAttendees(
  orderId: string,
): Promise<AdminTicketOrderAttendee[]> {
  const { data, error } = await table("ticket_order_attendees")
    .select("seat_number, full_name")
    .eq("order_id", orderId)
    .order("seat_number", { ascending: true });

  if (error) {
    throw new AdminTicketOrderRepositoryError("list_order_attendees", error);
  }

  const parsed = z.array(attendeeSchema).safeParse(data ?? []);
  if (!parsed.success) {
    throw new AdminTicketOrderRepositoryError("list_order_attendees_response", {
      code: "invalid_response",
    });
  }
  return parsed.data;
}

export async function listOrderNotifications(
  orderId: string,
): Promise<AdminTicketOrderNotification[]> {
  const { data, error } = await table("ticket_order_notifications")
    .select(
      "id, template, status, attempt_count, last_error_code, sent_at, next_attempt_at",
    )
    .eq("order_id", orderId)
    .order("template", { ascending: true });

  if (error) {
    throw new AdminTicketOrderRepositoryError("list_order_notifications", error);
  }

  const parsed = z.array(notificationSchema).safeParse(data ?? []);
  if (!parsed.success) {
    throw new AdminTicketOrderRepositoryError(
      "list_order_notifications_response",
      { code: "invalid_response" },
    );
  }
  return parsed.data;
}

export type TicketOrderCounts = {
  total: number;
  paid: number;
  pending: number;
  invoicesPending: number;
  paidRevenueCents: number;
};

export async function countTicketOrders(): Promise<TicketOrderCounts> {
  const { data, error } = await table("ticket_orders").select(
    "status, invoice_status, total_cents",
  );
  if (error) throw new AdminTicketOrderRepositoryError("count_orders", error);

  const rows = z
    .array(
      z.object({
        status: z.enum(TICKET_ORDER_STATUS_VALUES),
        invoice_status: z.enum(INVOICE_STATUS_VALUES),
        total_cents: z.coerce.number().int().min(0),
      }),
    )
    .safeParse(data ?? []);

  if (!rows.success) {
    throw new AdminTicketOrderRepositoryError("count_orders_response", {
      code: "invalid_response",
    });
  }

  return rows.data.reduce<TicketOrderCounts>(
    (counts, row) => {
      counts.total += 1;
      if (row.status === "paid") {
        counts.paid += 1;
        counts.paidRevenueCents += row.total_cents;
      }
      if (row.status === "pending" || row.status === "in_process") {
        counts.pending += 1;
      }
      if (row.invoice_status === "requested") counts.invoicesPending += 1;
      return counts;
    },
    { total: 0, paid: 0, pending: 0, invoicesPending: 0, paidRevenueCents: 0 },
  );
}

/**
 * Capacity is configured by a human in Supabase Studio; the panel only reports
 * it. An empty list means capacity control is off and selling is unlimited.
 */
export async function listCapacity(): Promise<AdminTicketCapacity[]> {
  const { data, error } = await table("ticket_capacity").select(
    "scope, total_seats, hold_minutes",
  );
  if (error) throw new AdminTicketOrderRepositoryError("list_capacity", error);

  const parsed = z.array(capacitySchema).safeParse(data ?? []);
  if (!parsed.success) {
    throw new AdminTicketOrderRepositoryError("list_capacity_response", {
      code: "invalid_response",
    });
  }
  if (parsed.data.length === 0) return [];

  const client = getSupabaseServerClient();
  return Promise.all(
    parsed.data.map(async (row) => {
      const { data: remaining, error: remainingError } = await client.rpc(
        "remaining_ticket_seats",
        { p_scope: row.scope },
      );
      if (remainingError) {
        throw new AdminTicketOrderRepositoryError(
          "remaining_ticket_seats",
          remainingError,
        );
      }
      const remainingSeats = Number(remaining ?? 0);
      return {
        ...row,
        remaining_seats: Number.isFinite(remainingSeats) ? remainingSeats : 0,
        committed_seats: row.total_seats - (Number.isFinite(remainingSeats) ? remainingSeats : 0),
      };
    }),
  );
}

/**
 * The panel's entire write surface for an order: the CFDI outcome plus the
 * operator's own notes. Everything else stays read-only.
 */
export async function updateTicketOrderOperations(input: {
  id: string;
  invoiceStatus: AdminInvoiceStatus;
  cfdiUuid: string | null;
  owner: string | null;
  internalNotes: string | null;
}): Promise<void> {
  const { error } = await table("ticket_orders")
    .update({
      invoice_status: input.invoiceStatus,
      cfdi_uuid: input.cfdiUuid,
      invoiced_at:
        input.invoiceStatus === "issued" ? new Date().toISOString() : null,
      owner: input.owner,
      internal_notes: input.internalNotes,
    })
    .eq("id", input.id);

  if (error) {
    throw new AdminTicketOrderRepositoryError("update_order_operations", error);
  }
}
