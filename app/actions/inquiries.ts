"use server";

import { isVisualOnlyVercelDeployment } from "@/lib/deployment-environment";
import { parseInquiryFormData } from "@/lib/inquiries/schema";
import type { InquiryResult } from "@/lib/inquiries/result";
import { submitInquiryUseCase } from "@/server/use-cases/submit-inquiry";

const HONEYPOT_INQUIRY_ID = "00000000-0000-4000-8000-000000000000";

export async function submitInquiry(formData: FormData): Promise<InquiryResult> {
  if (isVisualOnlyVercelDeployment()) {
    return { ok: false, reason: "storage_unavailable" };
  }

  const website = formData.get("website");
  if (typeof website === "string" && website.length > 0) {
    return {
      ok: true,
      inquiryId: HONEYPOT_INQUIRY_ID,
      notification: "queued",
    };
  }

  const parsed = parseInquiryFormData(formData);
  if (!parsed.success) return { ok: false, reason: "invalid" };

  try {
    return await submitInquiryUseCase(parsed.data);
  } catch {
    return { ok: false, reason: "unexpected" };
  }
}
