import "server-only";

import { checkRateLimit, getClientIp, RateLimitError } from "@/lib/rate-limit";
import { hashInquiryPayload } from "@/lib/inquiries/canonical-payload";
import type { Inquiry } from "@/lib/inquiries/schema";
import type { InquiryResult } from "@/lib/inquiries/result";
import {
  persistInquiry,
  type PersistInquiryResult,
} from "@/server/repositories/inquiry-repository";
import { tryImmediateInquiryNotification } from "@/server/services/inquiry-notifier";
import { recordInquiryEvent } from "@/server/services/inquiry-observability";

type SubmitInquiryDependencies = {
  getIp: typeof getClientIp;
  rateLimit: typeof checkRateLimit;
  hashPayload: typeof hashInquiryPayload;
  persist: (
    inquiry: Inquiry,
    payloadHash: string,
    consentedAt: Date,
  ) => Promise<PersistInquiryResult>;
  notify: (notificationId: string) => Promise<"sent" | "queued">;
  now: () => Date;
};

const DEFAULT_DEPENDENCIES: SubmitInquiryDependencies = {
  getIp: getClientIp,
  rateLimit: checkRateLimit,
  hashPayload: hashInquiryPayload,
  persist: persistInquiry,
  notify: tryImmediateInquiryNotification,
  now: () => new Date(),
};

function technicalCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String(error.code);
    if (/^[a-zA-Z0-9_.-]{1,64}$/.test(code)) return code;
  }
  return "storage_error";
}

export async function submitInquiryUseCase(
  inquiry: Inquiry,
  dependencyOverrides: Partial<SubmitInquiryDependencies> = {},
): Promise<InquiryResult> {
  const dependencies = { ...DEFAULT_DEPENDENCIES, ...dependencyOverrides };

  try {
    const ip = await dependencies.getIp();
    await dependencies.rateLimit(`inquiry:${ip}`);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { ok: false, reason: "rate_limited" };
    }
    return { ok: false, reason: "unexpected" };
  }

  let persisted: PersistInquiryResult;
  try {
    const payloadHash = dependencies.hashPayload(inquiry);
    persisted = await dependencies.persist(inquiry, payloadHash, dependencies.now());
  } catch (error) {
    recordInquiryEvent("inquiry_persistence_failed", {
      kind: inquiry.kind,
      language: inquiry.language,
      code: technicalCode(error),
    });
    return { ok: false, reason: "storage_unavailable" };
  }

  if (persisted.outcome === "conflict") {
    recordInquiryEvent("inquiry_persistence_failed", {
      inquiryId: persisted.inquiryId,
      kind: inquiry.kind,
      language: inquiry.language,
      code: "idempotency_conflict",
    });
    return { ok: false, reason: "idempotency_conflict" };
  }

  recordInquiryEvent(
    persisted.outcome === "created" ? "inquiry_persisted" : "inquiry_duplicate_replayed",
    {
      inquiryId: persisted.inquiryId,
      kind: inquiry.kind,
      language: inquiry.language,
    },
  );

  let notification: "sent" | "queued" = "queued";
  try {
    notification = await dependencies.notify(persisted.notificationId);
  } catch {
    // Persistence is the success boundary. The outbox lease allows cron to
    // recover a notification even if the immediate processing path fails.
    recordInquiryEvent("inquiry_notification_retry", {
      inquiryId: persisted.inquiryId,
      kind: inquiry.kind,
      language: inquiry.language,
      code: "immediate_dispatch_failed",
      attempt: 0,
    });
  }

  return {
    ok: true,
    inquiryId: persisted.inquiryId,
    notification,
  };
}
