"use client";

import type { InquiryFailureReason, InquiryResult } from "@/lib/inquiries/result";

type RunInquirySubmissionOptions = {
  submit: () => Promise<InquiryResult>;
  setSending: (sending: boolean) => void;
};

export function inquiryErrorMessage(
  reason: InquiryFailureReason,
  messages: {
    invalid: string;
    rateLimited: string;
    unavailable: string;
  },
): string {
  if (reason === "invalid") return messages.invalid;
  if (reason === "rate_limited") return messages.rateLimited;
  return messages.unavailable;
}

export function createSubmissionId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  if (typeof globalThis.crypto?.getRandomValues !== "function") {
    throw new Error("Secure random number generation is unavailable");
  }

  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}

/**
 * Shared UI boundary for both inquiry forms. Server or network exceptions are
 * converted to a typed result and `sending` is always released.
 */
export async function runInquirySubmission({
  submit,
  setSending,
}: RunInquirySubmissionOptions): Promise<InquiryResult> {
  setSending(true);
  try {
    return await submit();
  } catch {
    return { ok: false, reason: "unexpected" };
  } finally {
    setSending(false);
  }
}
