export type InquiryFailureReason =
  | "invalid"
  | "rate_limited"
  | "storage_unavailable"
  | "idempotency_conflict"
  | "unexpected";

export type InquiryResult =
  | {
      ok: true;
      inquiryId: string;
      notification: "sent" | "queued";
    }
  | {
      ok: false;
      reason: InquiryFailureReason;
    };

