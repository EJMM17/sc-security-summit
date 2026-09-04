import { beforeEach, describe, expect, it, vi } from "vitest";
import { RateLimitError } from "@/lib/rate-limit";
import type { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { CouponDefinition } from "@/lib/payments/coupons";
import type {
  countCouponRedemptions,
  findCouponByCode,
} from "@/server/repositories/coupon-repository";
import { resolveDiscountCode } from "@/server/services/discount-codes";
import { validateDiscountCodeUseCase } from "@/server/use-cases/validate-discount-code";

/**
 * The convenios seeded by the migrations, and what each one is worth.
 *
 * The rate belongs to the coupon, not to "being a convenio": 20260827120000
 * seeded four codes at 20% and 20260904185529 added AAARAC at 25%.
 */
const SEEDED_CODES = {
  UVB2026: 2_000,
  IIIES2026: 2_000,
  PVILLAFLORIDA2026: 2_000,
  CANACAR2026: 2_000,
  AAARAC2026: 2_500,
} as const;

function couponRow(code: string): CouponDefinition {
  return {
    id: "0f2b1c3d-4e5f-4061-8a2b-3c4d5e6f7081",
    code,
    discountBasisPoints: SEEDED_CODES[code as keyof typeof SEEDED_CODES],
    discountType: "percentage",
    discountAmountCents: null,
    active: true,
    startsAt: null,
    expiresAt: null,
    maxUses: null,
    maxUsesPerCustomer: null,
    minimumPurchaseCents: null,
    maximumDiscountCents: null,
  };
}

/** A coupon store holding exactly the seeded codes, normalized lookups only. */
function couponStore() {
  return vi.fn<typeof findCouponByCode>(async (code) =>
    Object.hasOwn(SEEDED_CODES, code) ? couponRow(code) : null,
  );
}

function dependencies() {
  const findCoupon = couponStore();
  return {
    getIp: vi.fn<typeof getClientIp>(async () => "203.0.113.10"),
    rateLimit: vi.fn<typeof checkRateLimit>(async () => undefined),
    findCoupon,
    countRedemptions: vi.fn<typeof countCouponRedemptions>(async () => 0),
    resolve: (input: Parameters<typeof resolveDiscountCode>[0]) =>
      resolveDiscountCode(input, {
        findCoupon,
        countRedemptions: async () => 0,
      }),
    now: vi.fn(() => new Date("2026-08-27T12:00:00.000Z")),
  };
}

describe("resolveDiscountCode", () => {
  it("answers `none` when no code was submitted", async () => {
    const deps = dependencies();
    await expect(
      resolveDiscountCode(
        { code: undefined, listUnitPriceCents: 250_000, quantity: 1, now: new Date() },
        deps,
      ),
    ).resolves.toEqual({ outcome: "none" });
    expect(deps.findCoupon).not.toHaveBeenCalled();
  });

  it("keeps the sale when the coupon store cannot be read", async () => {
    const deps = dependencies();
    deps.findCoupon.mockRejectedValue(new Error("db down"));

    await expect(
      resolveDiscountCode(
        { code: "UVB2026", listUnitPriceCents: 250_000, quantity: 1, now: new Date() },
        deps,
      ),
    ).resolves.toEqual({ outcome: "unavailable" });
  });

  it("only counts redemptions for a coupon that actually limits them", async () => {
    const deps = dependencies();
    await resolveDiscountCode(
      { code: "UVB2026", listUnitPriceCents: 250_000, quantity: 1, now: new Date() },
      deps,
    );
    expect(deps.countRedemptions).not.toHaveBeenCalled();
  });
});

describe("validateDiscountCodeUseCase", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it.each(Object.entries(SEEDED_CODES))(
    "applies the seeded rate for %s",
    async (code, discountBasisPoints) => {
      const deps = dependencies();
      const discountCents = (250_000 * discountBasisPoints) / 10_000;

      await expect(
        validateDiscountCodeUseCase({ tier: "plus", quantity: 1, code }, deps),
      ).resolves.toEqual({
        valid: true,
        code,
        discountBasisPoints,
        listTotalCents: 250_000,
        discountCents,
        totalCents: 250_000 - discountCents,
      });
    },
  );

  it.each([" uvb2026 ", "uvb2026", "UVB2026 ", " UVB2026"])(
    "normalizes %j to the same coupon",
    async (typed) => {
      const deps = dependencies();
      const result = await validateDiscountCodeUseCase(
        { tier: "plus", quantity: 1, code: typed },
        deps,
      );
      expect(result.valid).toBe(true);
      if (!result.valid) return;
      expect(result.code).toBe("UVB2026");
      expect(deps.findCoupon).toHaveBeenCalledWith("UVB2026");
    },
  );

  it("answers an unknown code without changing the total", async () => {
    const deps = dependencies();
    await expect(
      validateDiscountCodeUseCase(
        { tier: "plus", quantity: 1, code: "ABC123" },
        deps,
      ),
    ).resolves.toEqual({
      valid: false,
      reason: "unknown",
      listTotalCents: 250_000,
      discountCents: 0,
      totalCents: 250_000,
    });
  });

  it("stacks on top of the volume discount rather than replacing it", async () => {
    const deps = dependencies();
    const result = await validateDiscountCodeUseCase(
      { tier: "plus", quantity: 5, code: "UVB2026" },
      deps,
    );

    expect(result.valid).toBe(true);
    if (!result.valid) return;
    // Five Plus accesses are 187,500 each after the 25% volume discount.
    expect(result.listTotalCents).toBe(937_500);
    expect(result.totalCents).toBe(750_000);
    expect(result.discountCents).toBe(187_500);
  });

  it("stacks the 25% convenio on top of the volume discount", async () => {
    const deps = dependencies();
    const result = await validateDiscountCodeUseCase(
      { tier: "plus", quantity: 5, code: "AAARAC2026" },
      deps,
    );

    expect(result.valid).toBe(true);
    if (!result.valid) return;
    // 187,500 per access after the volume discount, 46,875 off each by AAARAC.
    expect(result.listTotalCents).toBe(937_500);
    expect(result.totalCents).toBe(703_125);
    expect(result.discountCents).toBe(234_375);
  });

  it("prices a corporate block from the seat count it is given", async () => {
    const deps = dependencies();
    const result = await validateDiscountCodeUseCase(
      { tier: "corporativo", quantity: 5, code: "CANACAR2026" },
      deps,
    );

    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.totalCents).toBe(750_000);
  });

  it("says so when too many codes were tried, without blocking the sale", async () => {
    const deps = dependencies();
    deps.rateLimit.mockRejectedValue(new RateLimitError(60_000));

    await expect(
      validateDiscountCodeUseCase(
        { tier: "plus", quantity: 1, code: "UVB2026" },
        deps,
      ),
    ).resolves.toEqual({
      valid: false,
      reason: "rate_limited",
      listTotalCents: 250_000,
      discountCents: 0,
      totalCents: 250_000,
    });
    expect(deps.findCoupon).not.toHaveBeenCalled();
  });

  it("refuses an out-of-range quantity instead of pricing it", async () => {
    const deps = dependencies();
    await expect(
      validateDiscountCodeUseCase(
        { tier: "estudiante", quantity: 9, code: "UVB2026" },
        deps,
      ),
    ).resolves.toMatchObject({ valid: false, totalCents: 0 });
    expect(deps.findCoupon).not.toHaveBeenCalled();
  });
});
