import "server-only";

import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { Inquiry } from "@/lib/inquiries/schema";

export type PersistedInquiry = {
  inquiryId: string;
  notificationId: string;
  outcome: "created" | "replayed";
};

export type PersistInquiryResult =
  | PersistedInquiry
  | {
      outcome: "conflict";
      inquiryId: string;
    };

export type ClaimedInquiryNotification = {
  notificationId: string;
  inquiryId: string;
  attemptNumber: number;
  template: string;
};

export type StoredInquiry = {
  id: string;
  kind: "corporate" | "sponsor";
  contactName: string;
  email: string;
  phone: string;
  company: string;
  language: "es" | "en";
  jobTitle: string | null;
  requestedSeats: number | null;
  interest: string | null;
};

export type NotificationStatus = "pending" | "processing" | "sent" | "retry" | "dead";

export class InquiryRepositoryError extends Error {
  readonly code: string;

  constructor(operation: string, error: unknown) {
    const code = safeTechnicalCode(error);
    super(`Inquiry repository operation failed: ${operation} (${code})`);
    this.name = "InquiryRepositoryError";
    this.code = code;
  }
}

const createInquiryRowSchema = z.object({
  inquiry_id: z.string().uuid(),
  notification_id: z.string().uuid().nullable(),
  outcome: z.enum(["created", "replayed", "conflict"]),
});

const claimedNotificationRowSchema = z.object({
  notification_id: z.string().uuid(),
  inquiry_id: z.string().uuid(),
  attempt_number: z.coerce.number().int().min(1),
  template: z.string().min(1).max(120),
});

const storedInquiryRowSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(["corporate", "sponsor"]),
  contact_name: z.string(),
  email: z.string(),
  phone: z.string(),
  company: z.string(),
  language: z.enum(["es", "en"]),
  job_title: z.string().nullable(),
  requested_seats: z.number().int().nullable(),
  interest: z.string().nullable(),
});

const notificationStatusRowSchema = z.object({
  status: z.enum(["pending", "processing", "sent", "retry", "dead"]),
});

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

function contactName(inquiry: Inquiry): string {
  return inquiry.kind === "corporate"
    ? `${inquiry.firstName} ${inquiry.lastName}`
    : inquiry.name;
}

/**
 * Adds calendar months while clamping end-of-month dates instead of allowing
 * JavaScript's Date rollover to silently add extra days.
 */
export function retentionDateFrom(consentedAt: Date, months = 18): string {
  const year = consentedAt.getUTCFullYear();
  const monthIndex = consentedAt.getUTCMonth() + months;
  const targetYear = year + Math.floor(monthIndex / 12);
  const targetMonth = ((monthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(consentedAt.getUTCDate(), lastDay);
  return new Date(Date.UTC(targetYear, targetMonth, targetDay)).toISOString().slice(0, 10);
}

export async function persistInquiry(
  inquiry: Inquiry,
  payloadHash: string,
  consentedAt: Date,
): Promise<PersistInquiryResult> {
  const attribution = inquiry.attribution;
  const { data, error } = await getSupabaseServerClient().rpc("create_inquiry", {
    p_submission_id: inquiry.submissionId,
    p_payload_hash: payloadHash,
    p_kind: inquiry.kind,
    p_contact_name: contactName(inquiry),
    p_email: inquiry.email,
    p_phone: inquiry.phone,
    p_company: inquiry.company,
    p_language: inquiry.language,
    p_consent_version: inquiry.consentVersion,
    p_consented_at: consentedAt.toISOString(),
    p_retention_until: retentionDateFrom(consentedAt),
    p_job_title: inquiry.kind === "corporate" ? inquiry.role : undefined,
    p_requested_seats:
      inquiry.kind === "corporate" ? inquiry.requestedSeats : undefined,
    p_interest: inquiry.kind === "sponsor" ? inquiry.interest : undefined,
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

  if (error) throw new InquiryRepositoryError("create_inquiry", error);

  const parsed = createInquiryRowSchema.safeParse(firstRpcRow(data));
  if (!parsed.success) {
    throw new InquiryRepositoryError("create_inquiry_response", {
      code: "invalid_response",
    });
  }

  const row = parsed.data;
  if (row.outcome === "conflict") {
    return { outcome: "conflict", inquiryId: row.inquiry_id };
  }
  if (!row.notification_id) {
    throw new InquiryRepositoryError("create_inquiry_response", {
      code: "missing_notification",
    });
  }

  return {
    outcome: row.outcome,
    inquiryId: row.inquiry_id,
    notificationId: row.notification_id,
  };
}

function parseClaims(data: unknown, operation: string): ClaimedInquiryNotification[] {
  if (!Array.isArray(data)) {
    throw new InquiryRepositoryError(operation, { code: "invalid_response" });
  }

  return data.map((value) => {
    const parsed = claimedNotificationRowSchema.safeParse(value);
    if (!parsed.success) {
      throw new InquiryRepositoryError(operation, { code: "invalid_response" });
    }
    return {
      notificationId: parsed.data.notification_id,
      inquiryId: parsed.data.inquiry_id,
      attemptNumber: parsed.data.attempt_number,
      template: parsed.data.template,
    };
  });
}

export async function claimInquiryNotification(
  notificationId: string,
): Promise<ClaimedInquiryNotification | null> {
  const { data, error } = await getSupabaseServerClient().rpc(
    "claim_inquiry_notification",
    { p_notification_id: notificationId },
  );
  if (error) throw new InquiryRepositoryError("claim_inquiry_notification", error);
  return parseClaims(data, "claim_inquiry_notification_response")[0] ?? null;
}

export async function claimDueInquiryNotifications(
  limit: number,
): Promise<ClaimedInquiryNotification[]> {
  const boundedLimit = Math.max(1, Math.min(Math.trunc(limit), 25));
  const { data, error } = await getSupabaseServerClient().rpc(
    "claim_inquiry_notifications",
    { p_limit: boundedLimit },
  );
  if (error) throw new InquiryRepositoryError("claim_inquiry_notifications", error);
  return parseClaims(data, "claim_inquiry_notifications_response");
}

export async function getStoredInquiry(inquiryId: string): Promise<StoredInquiry> {
  const { data, error } = await getSupabaseServerClient()
    .from("inquiries")
    .select(
      "id,kind,contact_name,email,phone,company,language,job_title,requested_seats,interest",
    )
    .eq("id", inquiryId)
    .single();

  if (error) throw new InquiryRepositoryError("get_inquiry", error);
  const parsed = storedInquiryRowSchema.safeParse(data);
  if (!parsed.success) {
    throw new InquiryRepositoryError("get_inquiry_response", {
      code: "invalid_response",
    });
  }

  return {
    id: parsed.data.id,
    kind: parsed.data.kind,
    contactName: parsed.data.contact_name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    company: parsed.data.company,
    language: parsed.data.language,
    jobTitle: parsed.data.job_title,
    requestedSeats: parsed.data.requested_seats,
    interest: parsed.data.interest,
  };
}

export async function getNotificationStatus(
  notificationId: string,
): Promise<NotificationStatus> {
  const { data, error } = await getSupabaseServerClient()
    .from("inquiry_notifications")
    .select("status")
    .eq("id", notificationId)
    .single();

  if (error) throw new InquiryRepositoryError("get_notification_status", error);
  const parsed = notificationStatusRowSchema.safeParse(data);
  if (!parsed.success) {
    throw new InquiryRepositoryError("get_notification_status_response", {
      code: "invalid_response",
    });
  }
  return parsed.data.status;
}

export async function probeInquiryStorage(signal: AbortSignal): Promise<void> {
  const { error } = await getSupabaseServerClient()
    .from("inquiries")
    .select("id", { head: true })
    .limit(1)
    .abortSignal(signal);
  if (error) throw new InquiryRepositoryError("probe_inquiry_storage", error);
}

export async function completeInquiryNotification(input: {
  notificationId: string;
  attemptNumber: number;
  result: "sent" | "retry" | "dead";
  durationMs: number;
  providerMessageId?: string;
  errorCode?: string;
  nextAttemptAt?: string;
}): Promise<NotificationStatus> {
  const { data, error } = await getSupabaseServerClient().rpc(
    "complete_inquiry_notification",
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

  if (error) throw new InquiryRepositoryError("complete_inquiry_notification", error);
  const parsed = z
    .object({
      status: z.enum(["pending", "processing", "sent", "retry", "dead"]),
    })
    .safeParse(firstRpcRow(data));
  if (!parsed.success) {
    throw new InquiryRepositoryError("complete_inquiry_notification_response", {
      code: "invalid_response",
    });
  }
  return parsed.data.status;
}
