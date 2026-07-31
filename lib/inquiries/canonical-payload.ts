import "server-only";

import { createHash } from "node:crypto";
import type { Inquiry } from "@/lib/inquiries/schema";

const CANONICAL_PAYLOAD_VERSION = "inquiry-payload-v1";

/**
 * The insertion order below is part of the versioned idempotency contract.
 * Attribution and timestamps are deliberately excluded: they must not turn a
 * retry of the same contact request into a collision.
 */
export function canonicalInquiryPayload(inquiry: Inquiry): string {
  const common = {
    version: CANONICAL_PAYLOAD_VERSION,
    kind: inquiry.kind,
    contactName:
      inquiry.kind === "corporate"
        ? `${inquiry.firstName} ${inquiry.lastName}`
        : inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone,
    company: inquiry.company,
    language: inquiry.language,
    consentVersion: inquiry.consentVersion,
  };

  return JSON.stringify(
    inquiry.kind === "corporate"
      ? {
          ...common,
          jobTitle: inquiry.role,
          requestedSeats: inquiry.requestedSeats,
          interest: null,
        }
      : {
          ...common,
          jobTitle: null,
          requestedSeats: null,
          interest: inquiry.interest,
        },
  );
}

export function hashInquiryPayload(inquiry: Inquiry): string {
  return createHash("sha256").update(canonicalInquiryPayload(inquiry), "utf8").digest("hex");
}

