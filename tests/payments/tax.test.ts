import { describe, expect, it } from "vitest";
import {
  applyRateHalfUp,
  centsToAmount,
  computeTaxBreakdown,
  extractTaxFromGross,
  formatTaxRate,
  IVA_RATE_BASIS_POINTS,
} from "@/lib/payments/tax";

describe("applyRateHalfUp", () => {
  it("applies 16% exactly on the published prices", () => {
    expect(applyRateHalfUp(250_000, IVA_RATE_BASIS_POINTS)).toBe(40_000);
    expect(applyRateHalfUp(90_000, IVA_RATE_BASIS_POINTS)).toBe(14_400);
    expect(applyRateHalfUp(65_000, IVA_RATE_BASIS_POINTS)).toBe(10_400);
  });

  it("rounds a half cent away from zero", () => {
    // 3125 cents * 16% = 500.00 cents exactly; 3126 * 16% = 500.16 -> 500.
    expect(applyRateHalfUp(3_125, IVA_RATE_BASIS_POINTS)).toBe(500);
    // 53 cents * 16% = 8.48 -> 8. 54 cents * 16% = 8.64 -> 9.
    expect(applyRateHalfUp(53, IVA_RATE_BASIS_POINTS)).toBe(8);
    expect(applyRateHalfUp(54, IVA_RATE_BASIS_POINTS)).toBe(9);
    // Exact .5 must round up, not to even.
    expect(applyRateHalfUp(50, 1_000)).toBe(5);
    expect(applyRateHalfUp(25, 200)).toBe(1);
  });

  it("rejects non-integer and negative input", () => {
    expect(() => applyRateHalfUp(1.5, IVA_RATE_BASIS_POINTS)).toThrow(RangeError);
    expect(() => applyRateHalfUp(-1, IVA_RATE_BASIS_POINTS)).toThrow(RangeError);
    expect(() => applyRateHalfUp(100, -1)).toThrow(RangeError);
  });
});

describe("computeTaxBreakdown", () => {
  it("taxes the whole line once rather than per unit", () => {
    const breakdown = computeTaxBreakdown(250_000, 3);
    expect(breakdown.subtotalCents).toBe(750_000);
    expect(breakdown.taxCents).toBe(120_000);
    expect(breakdown.totalCents).toBe(870_000);
  });

  it("keeps subtotal + tax equal to total for every quantity and tier", () => {
    for (const unit of [250_000, 90_000, 65_000, 1, 7, 333]) {
      for (let quantity = 1; quantity <= 10; quantity += 1) {
        const breakdown = computeTaxBreakdown(unit, quantity);
        expect(breakdown.subtotalCents).toBe(unit * quantity);
        expect(breakdown.subtotalCents + breakdown.taxCents).toBe(
          breakdown.totalCents,
        );
      }
    }
  });

  it("supports a zero rate and the border rate", () => {
    expect(computeTaxBreakdown(100_000, 1, 0).totalCents).toBe(100_000);
    expect(computeTaxBreakdown(100_000, 1, 800).taxCents).toBe(8_000);
  });

  it("rejects a quantity below one", () => {
    expect(() => computeTaxBreakdown(1_000, 0)).toThrow(RangeError);
  });
});

describe("extractTaxFromGross", () => {
  it("reverses an IVA-inclusive total", () => {
    const breakdown = extractTaxFromGross(290_000);
    expect(breakdown.subtotalCents).toBe(250_000);
    expect(breakdown.taxCents).toBe(40_000);
    expect(breakdown.totalCents).toBe(290_000);
  });

  it("never loses a cent in the round trip", () => {
    for (let gross = 1; gross <= 5_000; gross += 7) {
      const breakdown = extractTaxFromGross(gross);
      expect(breakdown.subtotalCents + breakdown.taxCents).toBe(gross);
    }
  });
});

describe("centsToAmount and formatTaxRate", () => {
  it("converts cents to a two-decimal amount", () => {
    expect(centsToAmount(250_000)).toBe(2_500);
    expect(centsToAmount(10_401)).toBe(104.01);
    expect(centsToAmount(0)).toBe(0);
  });

  it("renders a basis point rate as a percentage", () => {
    expect(formatTaxRate(1_600)).toBe("16%");
    expect(formatTaxRate(800)).toBe("8%");
    expect(formatTaxRate(1_625)).toBe("16.25%");
  });
});
