import "server-only";

type InquiryEvent =
  | "inquiry_persisted"
  | "inquiry_duplicate_replayed"
  | "inquiry_persistence_failed"
  | "inquiry_notification_sent"
  | "inquiry_notification_retry"
  | "inquiry_notification_dead";

type InquiryEventContext = {
  inquiryId?: string;
  kind?: "corporate" | "sponsor";
  language?: "es" | "en";
  code?: string;
  attempt?: number;
  durationMs?: number;
};

/**
 * Deliberately accepts only the identifiers and technical fields approved by
 * the PII policy. Do not widen this type to accept arbitrary metadata.
 */
export function recordInquiryEvent(
  event: InquiryEvent,
  context: InquiryEventContext = {},
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    ...context,
  };

  if (event === "inquiry_persistence_failed" || event === "inquiry_notification_dead") {
    console.error(JSON.stringify(entry));
  } else {
    console.info(JSON.stringify(entry));
  }
}

