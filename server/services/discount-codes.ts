import "server-only";

import {
  evaluateCoupon,
  normalizeDiscountCode,
  type CouponPricing,
  type CouponRejection,
} from "@/lib/payments/coupons";
import {
  countCouponRedemptions,
  findCouponByCode,
} from "@/server/repositories/coupon-repository";

/**
 * Resolving a discount code against a line the server already priced.
 *
 * One resolver serves both callers — the form asking "does this code work?"
 * and the pay action pricing the order it is about to charge — so the two can
 * never disagree about what a code is worth. The caller supplies the list unit
 * price it computed from the catalog; nothing here ever reads a price from the
 * browser.
 */

export type ResolvedDiscount =
  /** No code was submitted. */
  | { outcome: "none" }
  | { outcome: "applied"; pricing: CouponPricing }
  | { outcome: "rejected"; reason: CouponRejection }
  /** The coupon store could not be read. The order is priced without it. */
  | { outcome: "unavailable" };

export type DiscountDependencies = {
  findCoupon: typeof findCouponByCode;
  countRedemptions: typeof countCouponRedemptions;
};

const DEFAULT_DEPENDENCIES: DiscountDependencies = {
  findCoupon: findCouponByCode,
  countRedemptions: countCouponRedemptions,
};

export async function resolveDiscountCode(
  input: {
    code: string | undefined;
    listUnitPriceCents: number;
    quantity: number;
    now: Date;
  },
  dependencyOverrides: Partial<DiscountDependencies> = {},
): Promise<ResolvedDiscount> {
  const dependencies = { ...DEFAULT_DEPENDENCIES, ...dependencyOverrides };

  // Normalized here as well as in the repository: whitespace and case are
  // noise, and the layer that decides whether a code applies must not depend
  // on the layer below it to have said so.
  const code = normalizeDiscountCode(input.code ?? "");
  if (!code) return { outcome: "none" };

  let coupon;
  try {
    coupon = await dependencies.findCoupon(code);
  } catch {
    // A discount code is a courtesy. Losing the coupon store must never lose
    // the sale, so the caller decides what to do with an unreadable coupon;
    // the checkout keeps the list price and says so.
    return { outcome: "unavailable" };
  }

  // The redemption count is only read when a coupon is actually limited, so
  // the ordinary unlimited partner code costs exactly one query.
  let redemptions: number | null = null;
  if (coupon && coupon.maxUses !== null) {
    try {
      redemptions = await dependencies.countRedemptions(coupon.id);
    } catch {
      return { outcome: "unavailable" };
    }
  }

  const evaluation = evaluateCoupon({
    coupon,
    listUnitPriceCents: input.listUnitPriceCents,
    quantity: input.quantity,
    now: input.now,
    redemptions,
  });

  return evaluation.ok
    ? { outcome: "applied", pricing: evaluation.pricing }
    : { outcome: "rejected", reason: evaluation.reason };
}
