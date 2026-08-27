"use server";

import { z } from "zod";
import { isVisualOnlyVercelDeployment } from "@/lib/deployment-environment";
import {
  CORPORATE_MAX_SEATS,
  ORDER_TIER_IDS,
  type OrderTierId,
} from "@/lib/payments/catalog";
import { DISCOUNT_CODE_MAX_LENGTH } from "@/lib/payments/coupons";
import type { CheckoutResult, DiscountCodeResult } from "@/lib/payments/result";
import { parseTicketCheckoutFormData } from "@/lib/payments/schema";
import { createTicketCheckoutUseCase } from "@/server/use-cases/create-ticket-checkout";
import { validateDiscountCodeUseCase } from "@/server/use-cases/validate-discount-code";

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

const discountCodeRequestSchema = z
  .object({
    tier: z.enum(ORDER_TIER_IDS as unknown as [OrderTierId, ...OrderTierId[]]),
    quantity: z.coerce.number().int().min(1).max(CORPORATE_MAX_SEATS),
    code: z.string().max(DISCOUNT_CODE_MAX_LENGTH),
  })
  .strict();

export type DiscountCodeRequest = z.infer<typeof discountCodeRequestSchema>;

/**
 * Checks an optional discount code for the checkout form.
 *
 * The browser sends the code and the line it is looking at — the same tier and
 * quantity it would send to create the order — and never an amount. The server
 * prices the line from the catalog, reads the coupon from Supabase and answers
 * with what it computed. Nothing here decides what is charged: the pay action
 * repeats the whole calculation before it creates the preference.
 */
export async function validateDiscountCode(
  request: DiscountCodeRequest,
): Promise<DiscountCodeResult> {
  const rejected = (
    reason: Exclude<DiscountCodeResult, { valid: true }>["reason"],
  ): DiscountCodeResult => ({
    valid: false,
    reason,
    listTotalCents: 0,
    discountCents: 0,
    totalCents: 0,
  });

  if (isVisualOnlyVercelDeployment()) return rejected("unavailable");

  const parsed = discountCodeRequestSchema.safeParse(request);
  if (!parsed.success) return rejected("unknown");

  try {
    return await validateDiscountCodeUseCase(parsed.data);
  } catch {
    return rejected("unavailable");
  }
}
