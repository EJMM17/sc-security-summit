import "server-only";

import { sendEmail, type SendEmailResult } from "@/lib/email";
import { emailShell, escapeHtml } from "@/lib/email-templates";
import {
  claimDueInquiryNotifications,
  claimInquiryNotification,
  completeInquiryNotification,
  getNotificationStatus,
  getStoredInquiry,
  InquiryRepositoryError,
  type ClaimedInquiryNotification,
  type StoredInquiry,
} from "@/server/repositories/inquiry-repository";
import { recordInquiryEvent } from "@/server/services/inquiry-observability";

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

export type NotificationProcessingResult = "sent" | "queued" | "dead";

type NotifierDependencies = {
  send: typeof sendEmail;
  getInquiry: typeof getStoredInquiry;
  complete: typeof completeInquiryNotification;
  now: () => Date;
};

const DEFAULT_NOTIFIER_DEPENDENCIES: NotifierDependencies = {
  send: sendEmail,
  getInquiry: getStoredInquiry,
  complete: completeInquiryNotification,
  now: () => new Date(),
};

function safeErrorCode(error: unknown, fallback = "notification_error"): string {
  if (error instanceof InquiryRepositoryError) return error.code;
  if (typeof error === "object" && error !== null && "code" in error) {
    const candidate = String(error.code);
    if (/^[a-zA-Z0-9_.-]{1,120}$/.test(candidate)) return candidate;
  }
  return fallback;
}

function providerCode(result: Extract<SendEmailResult, { ok: false }>): string {
  const code = result.code;
  return /^[a-zA-Z0-9_.-]{1,120}$/.test(code) ? code : "provider_error";
}

function expectedTemplate(inquiry: StoredInquiry): string {
  return inquiry.kind === "corporate"
    ? "corporate_internal_v1"
    : "sponsor_internal_v1";
}

function detailRows(inquiry: StoredInquiry): Array<[string, string]> {
  const rows: Array<[string, string]> = [
    ["Nombre", inquiry.contactName],
    ["Correo", inquiry.email],
    ["Empresa", inquiry.company],
    ["Teléfono", inquiry.phone],
    ["Idioma", inquiry.language.toUpperCase()],
  ];

  if (inquiry.kind === "corporate") {
    rows.push(
      ["Cargo", inquiry.jobTitle ?? ""],
      ["Accesos solicitados", String(inquiry.requestedSeats ?? "")],
    );
  } else {
    rows.push(["Interés", inquiry.interest ?? ""]);
  }
  return rows;
}

export function buildInquiryNotificationEmail(inquiry: StoredInquiry): {
  subject: string;
  html: string;
} {
  const title =
    inquiry.kind === "corporate"
      ? "Nueva solicitud de pase corporativo"
      : "Nueva solicitud de patrocinio";
  const rows = detailRows(inquiry)
    .map(
      ([label, value]) =>
        `<tr><th style="padding:10px 14px;text-align:left;vertical-align:top;color:#475569">${escapeHtml(label)}</th><td style="padding:10px 14px;color:#0f172a">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return {
    subject: title,
    html: emailShell(
      title,
      `<h1 style="margin:0 0 16px;font-size:20px;color:#0f172a">${escapeHtml(title)}</h1><table style="width:100%;border-collapse:collapse;background:#f8fafc">${rows}</table>`,
    ),
  };
}

function contactEmail(): string | null {
  const value = process.env.CONTACT_EMAIL?.trim();
  return value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
}

async function finalizeFailure(
  claim: ClaimedInquiryNotification,
  code: string,
  durationMs: number,
  dependencies: NotifierDependencies,
  permanent = false,
): Promise<NotificationProcessingResult> {
  const dead = permanent || claim.attemptNumber >= MAX_NOTIFICATION_ATTEMPTS;
  const delayIndex = Math.min(claim.attemptNumber - 1, RETRY_DELAYS_MINUTES.length - 1);
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
  recordInquiryEvent(dead ? "inquiry_notification_dead" : "inquiry_notification_retry", {
    inquiryId: claim.inquiryId,
    code,
    attempt: claim.attemptNumber,
    durationMs,
  });
  return dead ? "dead" : "queued";
}

/**
 * Shared processor used by both the immediate post-insert attempt and cron.
 */
export async function processInquiryNotification(
  claim: ClaimedInquiryNotification,
  dependencyOverrides: Partial<NotifierDependencies> = {},
): Promise<NotificationProcessingResult> {
  const dependencies = { ...DEFAULT_NOTIFIER_DEPENDENCIES, ...dependencyOverrides };
  const startedAt = Date.now();

  let inquiry: StoredInquiry;
  try {
    inquiry = await dependencies.getInquiry(claim.inquiryId);
  } catch (error) {
    return finalizeFailure(
      claim,
      safeErrorCode(error, "inquiry_read_failed"),
      Date.now() - startedAt,
      dependencies,
    );
  }

  if (claim.template !== expectedTemplate(inquiry)) {
    return finalizeFailure(
      claim,
      "template_mismatch",
      Date.now() - startedAt,
      dependencies,
      true,
    );
  }

  const recipient = contactEmail();
  if (!recipient) {
    return finalizeFailure(
      claim,
      "missing_contact_email",
      Date.now() - startedAt,
      dependencies,
    );
  }

  const email = buildInquiryNotificationEmail(inquiry);
  let sendResult: SendEmailResult;
  try {
    sendResult = await dependencies.send({
      to: recipient,
      subject: email.subject,
      html: email.html,
      idempotencyKey: `inquiry-notification/${claim.notificationId}`,
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
  recordInquiryEvent("inquiry_notification_sent", {
    inquiryId: claim.inquiryId,
    kind: inquiry.kind,
    language: inquiry.language,
    attempt: claim.attemptNumber,
    durationMs,
  });
  return "sent";
}

export async function tryImmediateInquiryNotification(
  notificationId: string,
): Promise<"sent" | "queued"> {
  const claim = await claimInquiryNotification(notificationId);
  if (claim) {
    const result = await processInquiryNotification(claim);
    return result === "sent" ? "sent" : "queued";
  }

  const status = await getNotificationStatus(notificationId);
  return status === "sent" ? "sent" : "queued";
}

export type NotificationBatchResult = {
  claimed: number;
  sent: number;
  queued: number;
  dead: number;
  failed: number;
};

export async function processDueInquiryNotifications(
  limit = 10,
): Promise<NotificationBatchResult> {
  const claims = await claimDueInquiryNotifications(limit);
  const summary: NotificationBatchResult = {
    claimed: claims.length,
    sent: 0,
    queued: 0,
    dead: 0,
    failed: 0,
  };

  for (const claim of claims) {
    try {
      const result = await processInquiryNotification(claim);
      summary[result] += 1;
    } catch {
      // A completion failure leaves the row under a bounded DB lease. A later
      // cron invocation can reclaim it without two workers sending at once.
      summary.failed += 1;
    }
  }
  return summary;
}
