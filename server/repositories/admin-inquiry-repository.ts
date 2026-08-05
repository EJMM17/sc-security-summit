import "server-only";

import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import {
  INQUIRY_STATUSES,
  type AdminInquiry,
  type InquiryKind,
  type InquiryStatus,
} from "@/lib/admin/types";

/**
 * Read and operations access for the internal panel. Every Supabase query for
 * `/admin` lives here, and the write path accepts only the four fields
 * Operations is allowed to touch (`docs/INQUIRY_OPERATIONS.md`), so the panel
 * cannot rewrite submitted evidence, consent or attribution.
 */
export type { AdminInquiry, InquiryKind, InquiryStatus };

export class AdminRepositoryError extends Error {
  readonly code: string;

  constructor(operation: string, error: unknown) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code).slice(0, 64)
        : "database_error";
    super(`Admin repository operation failed: ${operation} (${code})`);
    this.name = "AdminRepositoryError";
    this.code = code;
  }
}

const LIST_COLUMNS =
  "id, kind, status, contact_name, email, phone, company, job_title, requested_seats, interest, language, owner, internal_notes, next_follow_up_at, created_at, updated_at, consent_version, consented_at, retention_until";

const notificationSchema = z.object({
  inquiry_id: z.string().uuid(),
  status: z.enum(["pending", "processing", "sent", "retry", "dead"]),
  attempt_count: z.coerce.number().int().min(0),
  provider_message_id: z.string().nullable(),
  last_error_code: z.string().nullable(),
  last_error_at: z.string().nullable(),
  sent_at: z.string().nullable(),
  next_attempt_at: z.string().nullable(),
});

const inquirySchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(["corporate", "sponsor"]),
  status: z.enum(INQUIRY_STATUSES),
  contact_name: z.string(),
  email: z.string(),
  phone: z.string(),
  company: z.string(),
  job_title: z.string().nullable(),
  requested_seats: z.number().int().nullable(),
  interest: z.string().nullable(),
  language: z.enum(["es", "en"]),
  owner: z.string().nullable(),
  internal_notes: z.string().nullable(),
  next_follow_up_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  consent_version: z.string(),
  consented_at: z.string(),
  retention_until: z.string(),
});

export type InquiryFilters = {
  status?: InquiryStatus | "all";
  kind?: InquiryKind | "all";
  search?: string;
  limit?: number;
};

export type InquiryCounts = {
  total: number;
  byStatus: Record<InquiryStatus, number>;
  notificationsPending: number;
  notificationsDead: number;
};

function escapeSearchTerm(value: string): string {
  // PostgREST treats these as pattern/list syntax inside `or(...)`.
  return value.replace(/[%,()\\]/g, " ").trim().slice(0, 120);
}

async function notificationsFor(
  inquiryIds: string[],
): Promise<Map<string, z.infer<typeof notificationSchema>>> {
  if (inquiryIds.length === 0) return new Map();

  const { data, error } = await getSupabaseServerClient()
    .from("inquiry_notifications")
    .select(
      "inquiry_id, status, attempt_count, provider_message_id, last_error_code, last_error_at, sent_at, next_attempt_at",
    )
    .in("inquiry_id", inquiryIds);

  if (error) throw new AdminRepositoryError("list_notifications", error);

  const map = new Map<string, z.infer<typeof notificationSchema>>();
  for (const row of data ?? []) {
    const parsed = notificationSchema.safeParse(row);
    if (parsed.success) map.set(parsed.data.inquiry_id, parsed.data);
  }
  return map;
}

export async function listInquiries(
  filters: InquiryFilters = {},
): Promise<AdminInquiry[]> {
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 200);
  let query = getSupabaseServerClient()
    .from("inquiries")
    .select(LIST_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.kind && filters.kind !== "all") {
    query = query.eq("kind", filters.kind);
  }

  const term = filters.search ? escapeSearchTerm(filters.search) : "";
  if (term) {
    query = query.or(
      `company.ilike.%${term}%,contact_name.ilike.%${term}%,email.ilike.%${term}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw new AdminRepositoryError("list_inquiries", error);

  const rows = (data ?? []).flatMap((row) => {
    const parsed = inquirySchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });

  const notifications = await notificationsFor(rows.map((row) => row.id));
  return rows.map((row) => ({
    ...row,
    notification: notifications.get(row.id) ?? null,
  }));
}

export async function getInquiry(id: string): Promise<AdminInquiry | null> {
  const { data, error } = await getSupabaseServerClient()
    .from("inquiries")
    .select(LIST_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new AdminRepositoryError("get_inquiry", error);
  if (!data) return null;

  const parsed = inquirySchema.safeParse(data);
  if (!parsed.success) throw new AdminRepositoryError("get_inquiry", { code: "invalid_row" });

  const notifications = await notificationsFor([parsed.data.id]);
  return {
    ...parsed.data,
    notification: notifications.get(parsed.data.id) ?? null,
  };
}

export async function countInquiries(): Promise<InquiryCounts> {
  const client = getSupabaseServerClient();
  const { data, error } = await client.from("inquiries").select("status");
  if (error) throw new AdminRepositoryError("count_inquiries", error);

  const byStatus = Object.fromEntries(
    INQUIRY_STATUSES.map((status) => [status, 0]),
  ) as Record<InquiryStatus, number>;

  for (const row of data ?? []) {
    const status = (row as { status: string }).status;
    if (status in byStatus) byStatus[status as InquiryStatus] += 1;
  }

  const { data: notifications, error: notificationError } = await client
    .from("inquiry_notifications")
    .select("status");
  if (notificationError) {
    throw new AdminRepositoryError("count_notifications", notificationError);
  }

  let notificationsPending = 0;
  let notificationsDead = 0;
  for (const row of notifications ?? []) {
    const status = (row as { status: string }).status;
    if (status === "pending" || status === "processing" || status === "retry") {
      notificationsPending += 1;
    }
    if (status === "dead") notificationsDead += 1;
  }

  return {
    total: data?.length ?? 0,
    byStatus,
    notificationsPending,
    notificationsDead,
  };
}

export type InquiryOperationsUpdate = {
  status: InquiryStatus;
  owner: string | null;
  internalNotes: string | null;
  nextFollowUpAt: string | null;
};

export async function updateInquiryOperations(
  id: string,
  update: InquiryOperationsUpdate,
): Promise<void> {
  const { error } = await getSupabaseServerClient()
    .from("inquiries")
    .update({
      status: update.status,
      owner: update.owner,
      internal_notes: update.internalNotes,
      next_follow_up_at: update.nextFollowUpAt,
    })
    .eq("id", id);

  if (error) throw new AdminRepositoryError("update_inquiry", error);
}
