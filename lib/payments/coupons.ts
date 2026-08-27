import {
  BASIS_POINT_SCALE,
  IVA_RATE_BASIS_POINTS,
  applyRateHalfUp,
  computeInclusiveTaxBreakdown,
} from "@/lib/payments/tax";
import type { TicketQuote } from "@/lib/payments/catalog";

/**
 * Optional discount codes (partner agreements).
 *
 * The codes themselves live in `public.coupons` and never in this bundle: the
 * browser only ever sends a string and is told whether it was applied. This
 * module owns the arithmetic, which is the same integer-cents discipline the
 * rest of `lib/payments` uses — a percentage is basis points, every amount is
 * a whole cent, and nothing is ever computed from a number the browser sent.
 *
 * The discount is applied to the *unit* price, exactly like the volume
 * discount, so the gross line total stays an exact multiple of the unit. That
 * multiple is the invariant `ticket_orders_amounts_check`, the MercadoPago
 * preference and the CFDI base extraction all depend on.
 */

export const DISCOUNT_CODE_MAX_LENGTH = 40;

/**
 * A code as it is stored and looked up. Whitespace is stripped and the code is
 * upper-cased, so `" uvb2026 "` and `UVB2026` are the same coupon.
 */
export function normalizeDiscountCode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

/** Codes the site is willing to look up at all. */
const DISCOUNT_CODE_PATTERN = /^[A-Z0-9][A-Z0-9._-]{1,39}$/;

export function isLookupableDiscountCode(code: string): boolean {
  return DISCOUNT_CODE_PATTERN.test(code);
}

export const COUPON_DISCOUNT_TYPES = ["percentage", "fixed_amount"] as const;

export type CouponDiscountType = (typeof COUPON_DISCOUNT_TYPES)[number];

/**
 * One row of `public.coupons`, as the server reads it.
 *
 * Every limit is nullable and every nullable limit means "no limit". Only
 * `active`, the window and the amount are exercised today; the rest exist so
 * an administration screen can start using them without another migration.
 */
export type CouponDefinition = {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  /** Percentage coupons, in basis points (2000 = 20%). */
  discountBasisPoints: number | null;
  /** Fixed coupons: cents off one access. */
  discountAmountCents: number | null;
  active: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  maxUses: number | null;
  maxUsesPerCustomer: number | null;
  minimumPurchaseCents: number | null;
  maximumDiscountCents: number | null;
};

/** Why a code was not applied. Never says more than the buyer needs. */
export type CouponRejection =
  | "unknown"
  | "inactive"
  | "not_started"
  | "expired"
  | "exhausted"
  | "minimum_not_met";

/** What an applied coupon does to one order, in cents. */
export type CouponPricing = {
  couponId: string;
  code: string;
  discountType: CouponDiscountType;
  /**
   * The effective rate, for display and for the stored order. A fixed coupon
   * reports the rate it worked out to, so one column answers "how much was
   * discounted, proportionally" for every coupon type.
   */
  discountBasisPoints: number;
  /** Gross unit price before the coupon (after any volume discount). */
  listUnitPriceCents: number;
  /** Gross unit price the buyer is actually charged. */
  unitPriceCents: number;
  listTotalCents: number;
  discountCents: number;
  totalCents: number;
  quantity: number;
};

export type CouponEvaluation =
  | { ok: true; pricing: CouponPricing }
  | { ok: false; reason: CouponRejection };

function parseTimestamp(value: string | null): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Cents taken off one access.
 *
 * `maximumDiscountCents` caps the whole line, so it is divided across the
 * accesses and floored: capping the line directly would break the
 * "line total is a multiple of the unit" invariant, and flooring keeps the
 * result under the cap rather than a cent over it. The unit is never taken
 * below one cent — a free order is not a checkout.
 */
export function couponUnitDiscountCents(
  coupon: CouponDefinition,
  listUnitPriceCents: number,
  quantity: number,
): number {
  if (!Number.isSafeInteger(listUnitPriceCents) || listUnitPriceCents < 1) {
    return 0;
  }
  if (!Number.isSafeInteger(quantity) || quantity < 1) return 0;

  let unitDiscount =
    coupon.discountType === "percentage"
      ? applyRateHalfUp(listUnitPriceCents, coupon.discountBasisPoints ?? 0)
      : Math.max(coupon.discountAmountCents ?? 0, 0);

  if (coupon.maximumDiscountCents !== null) {
    unitDiscount = Math.min(
      unitDiscount,
      Math.floor(Math.max(coupon.maximumDiscountCents, 0) / quantity),
    );
  }

  return Math.max(Math.min(unitDiscount, listUnitPriceCents - 1), 0);
}

/**
 * Decides whether a coupon applies to a line, and prices it if it does.
 *
 * `redemptions` is how many uses are already reserved or confirmed; pass
 * `null` when the count was not read (no `max_uses` to enforce).
 */
export function evaluateCoupon(input: {
  coupon: CouponDefinition | null;
  listUnitPriceCents: number;
  quantity: number;
  now: Date;
  redemptions?: number | null;
}): CouponEvaluation {
  const { coupon, listUnitPriceCents, quantity } = input;

  if (!coupon) return { ok: false, reason: "unknown" };
  if (!coupon.active) return { ok: false, reason: "inactive" };

  const now = input.now.getTime();
  const startsAt = parseTimestamp(coupon.startsAt);
  if (startsAt !== null && now < startsAt) {
    return { ok: false, reason: "not_started" };
  }
  const expiresAt = parseTimestamp(coupon.expiresAt);
  if (expiresAt !== null && now >= expiresAt) {
    return { ok: false, reason: "expired" };
  }

  if (
    coupon.maxUses !== null &&
    input.redemptions != null &&
    input.redemptions >= coupon.maxUses
  ) {
    return { ok: false, reason: "exhausted" };
  }

  const listTotalCents = listUnitPriceCents * quantity;
  if (
    coupon.minimumPurchaseCents !== null &&
    listTotalCents < coupon.minimumPurchaseCents
  ) {
    return { ok: false, reason: "minimum_not_met" };
  }

  const unitDiscountCents = couponUnitDiscountCents(
    coupon,
    listUnitPriceCents,
    quantity,
  );
  if (unitDiscountCents <= 0) return { ok: false, reason: "minimum_not_met" };

  const unitPriceCents = listUnitPriceCents - unitDiscountCents;
  const discountCents = unitDiscountCents * quantity;

  return {
    ok: true,
    pricing: {
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountBasisPoints:
        coupon.discountType === "percentage"
          ? (coupon.discountBasisPoints ?? 0)
          : Math.round(
              (unitDiscountCents * BASIS_POINT_SCALE) / listUnitPriceCents,
            ),
      listUnitPriceCents,
      unitPriceCents,
      listTotalCents,
      discountCents,
      totalCents: unitPriceCents * quantity,
      quantity,
    },
  };
}

/**
 * Re-prices an already-quoted line with an applied coupon.
 *
 * The base quote comes from the catalog, so the coupon can only ever reduce a
 * price the server itself computed. The IVA is re-extracted from the new gross
 * line: the published price includes the tax, so a discount reduces base and
 * tax together and `base + tax` still equals exactly what is charged.
 */
export function applyCouponToQuote(
  quote: TicketQuote,
  pricing: CouponPricing,
): TicketQuote {
  return {
    ...computeInclusiveTaxBreakdown(
      pricing.unitPriceCents,
      quote.quantity,
      quote.taxRateBasisPoints || IVA_RATE_BASIS_POINTS,
    ),
    tier: quote.tier,
    currency: quote.currency,
  };
}

/**
 * What a percentage code does to a line, for the checkout form to display.
 *
 * It is the same half-up arithmetic on the same integer cents the server runs,
 * so the number on screen is the number that will be charged — but it is still
 * only a preview: the server re-reads the coupon and re-prices the order
 * before it creates the preference, and that calculation is the one that wins.
 */
export function percentageDiscountPreview(
  listUnitPriceCents: number,
  quantity: number,
  discountBasisPoints: number,
): { unitPriceCents: number; discountCents: number; totalCents: number } {
  const unitDiscountCents = Math.max(
    Math.min(
      applyRateHalfUp(listUnitPriceCents, Math.max(discountBasisPoints, 0)),
      listUnitPriceCents - 1,
    ),
    0,
  );
  const unitPriceCents = listUnitPriceCents - unitDiscountCents;

  return {
    unitPriceCents,
    discountCents: unitDiscountCents * quantity,
    totalCents: unitPriceCents * quantity,
  };
}

/** Renders a basis-point discount as the percentage the buyer is shown. */
export function formatDiscountPercentage(basisPoints: number): string {
  const percent = basisPoints / 100;
  return `${Number.isInteger(percent) ? percent : percent.toFixed(2)}%`;
}
