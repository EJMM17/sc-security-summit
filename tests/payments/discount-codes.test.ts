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

/** The four convenios seeded by 20260827120000_discount_codes.sql. */
const SEEDED_CODES = [
  "UVB2026",
  "IIIES2026",
  "PVILLAFLORIDA2026",
  "CANACAR2026",
] as const;

function couponRow(code: string): CouponDefinition {
  return {
    id: "0f2b1c3d-4e5f-4061-8a2b-3c4d5e6f7081",
    code,
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
  };
}

/** A coupon store holding exactly the seeded codes, normalized lookups only. */
function couponStore() {
  return vi.fn<typeof findCouponByCode>(async (code) =>
    (SEEDED_CODES as readonly string[]).includes(code) ? couponRow(code) : null,
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

  it.each(SEEDED_CODES)("applies 20%% for %s", async (code) => {
    const deps = dependencies();
    await expect(
      validateDiscountCodeUseCase({ tier: "plus", quantity: 1, code }, deps),
    ).resolves.toEqual({
      valid: true,
      code,
      discountBasisPoints: 2_000,
      listTotalCents: 250_000,
      discountCents: 50_000,
      totalCents: 200_000,
    });
  });

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
