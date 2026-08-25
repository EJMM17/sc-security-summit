import { describe, expect, it } from "vitest";
import {
  applyRateHalfUp,
  centsToAmount,
  computeInclusiveTaxBreakdown,
  extractTaxFromGross,
  formatTaxRate,
  IVA_RATE_BASIS_POINTS,
} from "@/lib/payments/tax";

describe("applyRateHalfUp", () => {
  it("applies a rate to a whole amount", () => {
    expect(applyRateHalfUp(250_000, IVA_RATE_BASIS_POINTS)).toBe(40_000);
    expect(applyRateHalfUp(90_000, IVA_RATE_BASIS_POINTS)).toBe(14_400);
    // The 25% corporate discount rides on the same primitive.
    expect(applyRateHalfUp(1_250_000, 2_500)).toBe(312_500);
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

describe("computeInclusiveTaxBreakdown", () => {
  it("carves the tax out of the published price instead of adding it", () => {
    const breakdown = computeInclusiveTaxBreakdown(250_000, 3);
    expect(breakdown.totalCents).toBe(750_000);
    expect(breakdown.subtotalCents).toBe(646_552);
    expect(breakdown.taxCents).toBe(103_448);
  });

  it("keeps the total an exact multiple of the published price", () => {
    for (const unit of [250_000, 90_000, 65_000, 1, 7, 333]) {
      for (let quantity = 1; quantity <= 10; quantity += 1) {
        const breakdown = computeInclusiveTaxBreakdown(unit, quantity);
        expect(breakdown.totalCents).toBe(unit * quantity);
        expect(breakdown.subtotalCents + breakdown.taxCents).toBe(
          breakdown.totalCents,
        );
        expect(breakdown.unitPriceCents).toBe(unit);
        expect(breakdown.quantity).toBe(quantity);
      }
    }
  });

  it("splits the line once rather than per unit", () => {
    // 90,000 gross splits to 77,586.20 per unit; splitting per unit and
    // multiplying would lose two cents of base across three accesses.
    const line = computeInclusiveTaxBreakdown(90_000, 3);
    const perUnit = computeInclusiveTaxBreakdown(90_000, 1);
    expect(line.subtotalCents).toBe(232_759);
    expect(perUnit.subtotalCents * 3).toBe(232_758);
  });

  it("leaves the amount untouched at a zero rate", () => {
    const breakdown = computeInclusiveTaxBreakdown(100_000, 1, 0);
    expect(breakdown.subtotalCents).toBe(100_000);
    expect(breakdown.taxCents).toBe(0);
  });

  it("rejects a quantity below one", () => {
    expect(() => computeInclusiveTaxBreakdown(1_000, 0)).toThrow(RangeError);
  });
});

describe("extractTaxFromGross", () => {
  it("reverses an IVA-inclusive total", () => {
    const breakdown = extractTaxFromGross(290_000);
    expect(breakdown.subtotalCents).toBe(250_000);
    expect(breakdown.taxCents).toBe(40_000);
    expect(breakdown.totalCents).toBe(290_000);
    expect(breakdown.unitPriceCents).toBe(290_000);
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
