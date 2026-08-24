"use server";

import { isVisualOnlyVercelDeployment } from "@/lib/deployment-environment";
import type { CheckoutResult } from "@/lib/payments/result";
import { parseTicketCheckoutFormData } from "@/lib/payments/schema";
import { createTicketCheckoutUseCase } from "@/server/use-cases/create-ticket-checkout";

const HONEYPOT_ORDER_ID = "00000000-0000-4000-8000-000000000001";

export async function createTicketCheckout(
  formData: FormData,
): Promise<CheckoutResult> {
  if (isVisualOnlyVercelDeployment()) {
    return { ok: false, reason: "storage_unavailable" };
  }

  const website = formData.get("website");
  if (typeof website === "string" && website.length > 0) {
    // A bot gets a plausible-looking success with no order and no redirect.
    return {
      ok: true,
      orderId: HONEYPOT_ORDER_ID,
      checkoutUrl: "",
      subtotalCents: 0,
      taxCents: 0,
      totalCents: 0,
    };
  }

  const parsed = parseTicketCheckoutFormData(formData);
  if (!parsed.success) {
    // A rejected invoice block gets its own reason so the form can point the
    // buyer at the fiscal fields instead of at the whole form.
    const touchesInvoice = parsed.error.issues.some(
      (issue) => issue.path[0] === "invoice",
    );
    return { ok: false, reason: touchesInvoice ? "invalid_invoice" : "invalid" };
  }

  try {
    return await createTicketCheckoutUseCase(parsed.data);
  } catch {
    return { ok: false, reason: "unexpected" };
  }
}
