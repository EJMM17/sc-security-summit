import "server-only";

import { checkRateLimit, getClientIp, RateLimitError } from "@/lib/rate-limit";
import { quoteVolumePricing, type OrderTierId } from "@/lib/payments/catalog";
import type { DiscountCodeResult } from "@/lib/payments/result";
import { resolveDiscountCode } from "@/server/services/discount-codes";
import { recordPaymentEvent } from "@/server/services/payment-observability";

/**
 * "Does this code work?", answered for the checkout form.
 *
 * The answer is informational: it exists so the buyer sees the price before
 * committing, not so the browser can decide it. The pay action repeats every
 * step of this — re-price the tier, re-read the coupon, re-check the window —
 * and charges what it computes there, so tampering with anything returned here
 * changes what the screen says and nothing else.
 */

export type ValidateDiscountCodeInput = {
  tier: OrderTierId;
  quantity: number;
  code: string;
};

type ValidateDependencies = {
  getIp: typeof getClientIp;
  rateLimit: typeof checkRateLimit;
  resolve: typeof resolveDiscountCode;
  now: () => Date;
};

const DEFAULT_DEPENDENCIES: ValidateDependencies = {
  getIp: getClientIp,
  rateLimit: checkRateLimit,
  resolve: resolveDiscountCode,
  now: () => new Date(),
};

export async function validateDiscountCodeUseCase(
  input: ValidateDiscountCodeInput,
  dependencyOverrides: Partial<ValidateDependencies> = {},
): Promise<DiscountCodeResult> {
  const dependencies = { ...DEFAULT_DEPENDENCIES, ...dependencyOverrides };

  // The price is the server's, derived from the tier and quantity the form
  // already sends to create the order. The browser sends no amount here either.
  let volumeQuote;
  try {
    volumeQuote = quoteVolumePricing(input.tier, input.quantity);
  } catch {
    return {
      valid: false,
      reason: "unknown",
      listTotalCents: 0,
      discountCents: 0,
      totalCents: 0,
    };
  }

  const listTotalCents = volumeQuote.totalCents;
  const rejected = (
    reason: Exclude<DiscountCodeResult, { valid: true }>["reason"],
  ): DiscountCodeResult => ({
    valid: false,
    reason,
    listTotalCents,
    discountCents: 0,
    totalCents: listTotalCents,
  });

  // Codes are guessable strings worth money, so checking them is rate limited
  // on the same sliding window the rest of the forms use.
  try {
    const ip = await dependencies.getIp();
    await dependencies.rateLimit(`discount:${ip}`);
  } catch (error) {
    return rejected(error instanceof RateLimitError ? "rate_limited" : "unavailable");
  }

  const resolved = await dependencies.resolve({
    code: input.code,
    listUnitPriceCents: volumeQuote.unitPriceCents,
    quantity: input.quantity,
    now: dependencies.now(),
  });

  if (resolved.outcome === "unavailable") return rejected("unavailable");
  if (resolved.outcome === "none") return rejected("unknown");
  if (resolved.outcome === "rejected") {
    // A code that exists but does not apply here and a code that does not
    // exist are answered the same way on purpose.
    return rejected(resolved.reason === "unknown" ? "unknown" : "not_applicable");
  }

  recordPaymentEvent("ticket_discount_code_applied", {
    tier: input.tier,
    quantity: input.quantity,
    couponCode: resolved.pricing.code,
  });

  return {
    valid: true,
    code: resolved.pricing.code,
    discountBasisPoints: resolved.pricing.discountBasisPoints,
    listTotalCents: resolved.pricing.listTotalCents,
    discountCents: resolved.pricing.discountCents,
    totalCents: resolved.pricing.totalCents,
  };
}
