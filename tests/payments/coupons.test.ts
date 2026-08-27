import { describe, expect, it } from "vitest";
import {
  applyCouponToQuote,
  couponUnitDiscountCents,
  evaluateCoupon,
  formatDiscountPercentage,
  isLookupableDiscountCode,
  normalizeDiscountCode,
  percentageDiscountPreview,
  type CouponDefinition,
} from "@/lib/payments/coupons";
import { quoteOrder } from "@/lib/payments/catalog";

const NOW = new Date("2026-08-27T12:00:00.000Z");

function coupon(overrides: Partial<CouponDefinition> = {}): CouponDefinition {
  return {
    id: "0f2b1c3d-4e5f-4061-8a2b-3c4d5e6f7081",
    code: "UVB2026",
    discountType: "percentage",
    discountBasisPoints: 2_000,
    discountAmountCents: null,
    active: true,
    startsAt: null,
    expiresAt: null,
    maxUses: null,
    maxUsesPerCustomer: null,
    minimumPurchaseCents: null,
    maximumDiscountCents: null,
    ...overrides,
  };
}

describe("discount code normalization", () => {
  it("treats spacing and case as noise", () => {
    for (const raw of ["UVB2026", "uvb2026", " Uvb2026", "UVB2026 ", " uvb 2026 "]) {
      expect(normalizeDiscountCode(raw)).toBe("UVB2026");
    }
  });

  it("refuses to look up anything that could not be a code", () => {
    expect(isLookupableDiscountCode("UVB2026")).toBe(true);
    expect(isLookupableDiscountCode("ABC123")).toBe(true);
    expect(isLookupableDiscountCode("")).toBe(false);
    expect(isLookupableDiscountCode("A")).toBe(false);
    expect(isLookupableDiscountCode("' OR 1=1--")).toBe(false);
    expect(isLookupableDiscountCode("A".repeat(41))).toBe(false);
  });
});

describe("evaluateCoupon", () => {
  it("takes 20% off the unit price of a $1,000 access", () => {
    const evaluation = evaluateCoupon({
      coupon: coupon(),
      listUnitPriceCents: 100_000,
      quantity: 1,
      now: NOW,
    });

    expect(evaluation.ok).toBe(true);
    if (!evaluation.ok) return;
    expect(evaluation.pricing).toMatchObject({
      code: "UVB2026",
      discountBasisPoints: 2_000,
      listUnitPriceCents: 100_000,
      unitPriceCents: 80_000,
      listTotalCents: 100_000,
      discountCents: 20_000,
      totalCents: 80_000,
    });
  });

  it("keeps the line an exact multiple of the discounted unit", () => {
    const evaluation = evaluateCoupon({
      coupon: coupon(),
      listUnitPriceCents: 250_000,
      quantity: 3,
      now: NOW,
    });

    expect(evaluation.ok).toBe(true);
    if (!evaluation.ok) return;
    expect(evaluation.pricing.unitPriceCents * 3).toBe(
      evaluation.pricing.totalCents,
    );
    expect(evaluation.pricing.discountCents).toBe(150_000);
  });

  it("rounds a fractional discount half up, in whole cents", () => {
    // 12.5 cents off a 25-cent unit at 50%: half up, and never a float.
    expect(
      couponUnitDiscountCents(coupon({ discountBasisPoints: 5_000 }), 25, 1),
    ).toBe(13);
  });

  it("rejects an unknown, inactive, unstarted or expired coupon", () => {
    const base = { listUnitPriceCents: 100_000, quantity: 1, now: NOW };

    expect(evaluateCoupon({ ...base, coupon: null })).toEqual({
      ok: false,
      reason: "unknown",
    });
    expect(
      evaluateCoupon({ ...base, coupon: coupon({ active: false }) }),
    ).toEqual({ ok: false, reason: "inactive" });
    expect(
      evaluateCoupon({
        ...base,
        coupon: coupon({ startsAt: "2026-09-01T00:00:00.000Z" }),
      }),
    ).toEqual({ ok: false, reason: "not_started" });
    expect(
      evaluateCoupon({
        ...base,
        coupon: coupon({ expiresAt: "2026-08-01T00:00:00.000Z" }),
      }),
    ).toEqual({ ok: false, reason: "expired" });
  });

  it("stops applying once the use limit is reached", () => {
    const limited = coupon({ maxUses: 2 });
    const base = { listUnitPriceCents: 100_000, quantity: 1, now: NOW };

    expect(evaluateCoupon({ ...base, coupon: limited, redemptions: 1 }).ok).toBe(
      true,
    );
    expect(evaluateCoupon({ ...base, coupon: limited, redemptions: 2 })).toEqual({
      ok: false,
      reason: "exhausted",
    });
  });

  it("honours a minimum purchase against the whole line", () => {
    const withMinimum = coupon({ minimumPurchaseCents: 200_000 });

    expect(
      evaluateCoupon({
        coupon: withMinimum,
        listUnitPriceCents: 100_000,
        quantity: 1,
        now: NOW,
      }),
    ).toEqual({ ok: false, reason: "minimum_not_met" });
    expect(
      evaluateCoupon({
        coupon: withMinimum,
        listUnitPriceCents: 100_000,
        quantity: 2,
        now: NOW,
      }).ok,
    ).toBe(true);
  });

  it("caps the discount per access so the line stays under the ceiling", () => {
    const capped = coupon({ maximumDiscountCents: 30_000 });
    const evaluation = evaluateCoupon({
      coupon: capped,
      listUnitPriceCents: 100_000,
      quantity: 2,
      now: NOW,
    });

    expect(evaluation.ok).toBe(true);
    if (!evaluation.ok) return;
    // 20% would be 40,000 across the line; the cap holds it to 30,000 and the
    // unit stays whole.
    expect(evaluation.pricing.discountCents).toBe(30_000);
    expect(evaluation.pricing.unitPriceCents * 2).toBe(
      evaluation.pricing.totalCents,
    );
  });

  it("supports a fixed amount off one access", () => {
    const evaluation = evaluateCoupon({
      coupon: coupon({
        discountType: "fixed_amount",
        discountBasisPoints: null,
        discountAmountCents: 25_000,
      }),
      listUnitPriceCents: 100_000,
      quantity: 2,
      now: NOW,
    });

    expect(evaluation.ok).toBe(true);
    if (!evaluation.ok) return;
    expect(evaluation.pricing.unitPriceCents).toBe(75_000);
    expect(evaluation.pricing.discountCents).toBe(50_000);
    expect(evaluation.pricing.discountBasisPoints).toBe(2_500);
  });

  it("never gives an access away for free", () => {
    expect(
      couponUnitDiscountCents(
        coupon({ discountType: "fixed_amount", discountBasisPoints: null, discountAmountCents: 999_999 }),
        100_000,
        1,
      ),
    ).toBe(99_999);
    expect(
      couponUnitDiscountCents(coupon({ discountBasisPoints: 10_000 }), 100_000, 1),
    ).toBe(99_999);
  });
});

describe("applyCouponToQuote", () => {
  it("re-extracts the IVA from the discounted gross line", () => {
    const quote = quoteOrder("plus", 2);
    const evaluation = evaluateCoupon({
      coupon: coupon(),
      listUnitPriceCents: quote.unitPriceCents,
      quantity: quote.quantity,
      now: NOW,
    });
    expect(evaluation.ok).toBe(true);
    if (!evaluation.ok) return;

    const discounted = applyCouponToQuote(quote, evaluation.pricing);

    expect(discounted.unitPriceCents).toBe(200_000);
    expect(discounted.totalCents).toBe(400_000);
    // The invariant every downstream consumer depends on.
    expect(discounted.subtotalCents + discounted.taxCents).toBe(
      discounted.totalCents,
    );
    expect(discounted.unitPriceCents * discounted.quantity).toBe(
      discounted.totalCents,
    );
    expect(discounted.tier).toBe("plus");
    expect(discounted.currency).toBe("MXN");
  });
});

describe("percentageDiscountPreview", () => {
  it("matches what the server computes for the same line", () => {
    const quote = quoteOrder("plus", 5);
    const preview = percentageDiscountPreview(
      quote.unitPriceCents,
      quote.quantity,
      2_000,
    );
    const evaluation = evaluateCoupon({
      coupon: coupon(),
      listUnitPriceCents: quote.unitPriceCents,
      quantity: quote.quantity,
      now: NOW,
    });

    expect(evaluation.ok).toBe(true);
    if (!evaluation.ok) return;
    expect(preview.unitPriceCents).toBe(evaluation.pricing.unitPriceCents);
    expect(preview.discountCents).toBe(evaluation.pricing.discountCents);
    expect(preview.totalCents).toBe(evaluation.pricing.totalCents);
  });
});

describe("formatDiscountPercentage", () => {
  it("renders basis points as a percentage", () => {
    expect(formatDiscountPercentage(2_000)).toBe("20%");
    expect(formatDiscountPercentage(1_250)).toBe("12.50%");
  });
});
