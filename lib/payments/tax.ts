/**
 * Mexican VAT (IVA) arithmetic for the ticket checkout.
 *
 * Published prices are IVA-inclusive: the price on the site is the whole
 * amount the buyer pays, and the 16% lives inside it. The catalog stores that
 * gross price and this module splits it into the taxable base the CFDI needs
 * and the tax the seller absorbs. Every amount is an integer number of cents
 * so the value charged by MercadoPago, the value stored in Postgres and the
 * value printed on the CFDI are the same number, with no floating point drift.
 */

/** IVA general rate expressed in basis points (16.00%). */
export const IVA_RATE_BASIS_POINTS = 1_600;

/** Northern border stimulus rate, kept for documentation only. */
export const IVA_BORDER_RATE_BASIS_POINTS = 800;

export const BASIS_POINT_SCALE = 10_000;

export type TaxBreakdown = {
  /** IVA-exclusive taxable base extracted from the gross line total. */
  subtotalCents: number;
  /** IVA-inclusive published price of one unit. */
  unitPriceCents: number;
  quantity: number;
  taxRateBasisPoints: number;
  taxCents: number;
  totalCents: number;
};

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer`);
  }
}

/**
 * Rounds `value * rate` to the nearest cent, half away from zero, using only
 * integer operations. `Math.round` on a float quotient is deliberately avoided
 * because it turns exact halves into representation errors.
 */
export function applyRateHalfUp(
  amountCents: number,
  rateBasisPoints: number,
): number {
  assertNonNegativeInteger(amountCents, "amountCents");
  assertNonNegativeInteger(rateBasisPoints, "rateBasisPoints");

  const numerator = amountCents * rateBasisPoints;
  if (!Number.isSafeInteger(numerator)) {
    throw new RangeError("Tax computation exceeds safe integer precision");
  }

  const whole = Math.floor(numerator / BASIS_POINT_SCALE);
  const remainder = numerator % BASIS_POINT_SCALE;
  return remainder * 2 >= BASIS_POINT_SCALE ? whole + 1 : whole;
}

/**
 * Builds the full breakdown for a line of `quantity` identical tickets.
 *
 * The published price already contains the tax, so the line total is an exact
 * multiple of the unit price and the base is extracted from it once, over the
 * whole line, rather than per unit. Splitting per unit and multiplying would
 * make the sum of the CFDI concept differ from the amount MercadoPago actually
 * captured whenever the per-unit base does not land on a whole cent.
 */
export function computeInclusiveTaxBreakdown(
  unitPriceCents: number,
  quantity: number,
  taxRateBasisPoints: number = IVA_RATE_BASIS_POINTS,
): TaxBreakdown {
  assertNonNegativeInteger(unitPriceCents, "unitPriceCents");
  assertNonNegativeInteger(quantity, "quantity");

  if (quantity < 1) {
    throw new RangeError("quantity must be at least 1");
  }

  const totalCents = unitPriceCents * quantity;
  if (!Number.isSafeInteger(totalCents)) {
    throw new RangeError("Total exceeds safe integer precision");
  }

  return {
    ...extractTaxFromGross(totalCents, taxRateBasisPoints),
    unitPriceCents,
    quantity,
  };
}

/**
 * Splits an IVA-inclusive gross amount back into base and tax.
 *
 * This is the primitive the whole catalog rests on, and the same rule
 * reconciliation needs: MercadoPago settlement reports and manual adjustments
 * arrive as gross totals. The base is rounded half up and the tax is the
 * remainder, so base + tax is always exactly the gross amount and no cent is
 * created or lost by the split.
 */
export function extractTaxFromGross(
  totalCents: number,
  taxRateBasisPoints: number = IVA_RATE_BASIS_POINTS,
): TaxBreakdown {
  assertNonNegativeInteger(totalCents, "totalCents");
  assertNonNegativeInteger(taxRateBasisPoints, "taxRateBasisPoints");

  const scaled = totalCents * BASIS_POINT_SCALE;
  if (!Number.isSafeInteger(scaled)) {
    throw new RangeError("Gross extraction exceeds safe integer precision");
  }

  const divisor = BASIS_POINT_SCALE + taxRateBasisPoints;
  const whole = Math.floor(scaled / divisor);
  const remainder = scaled % divisor;
  const subtotalCents = remainder * 2 >= divisor ? whole + 1 : whole;

  return {
    subtotalCents,
    // A bare gross amount is one IVA-inclusive unit; a multi-unit line
    // overrides these two fields with the real tier price and quantity.
    unitPriceCents: totalCents,
    quantity: 1,
    taxRateBasisPoints,
    taxCents: totalCents - subtotalCents,
    totalCents,
  };
}

/** Converts integer cents to the decimal MXN amount MercadoPago expects. */
export function centsToAmount(cents: number): number {
  assertNonNegativeInteger(cents, "cents");
  return Number((cents / 100).toFixed(2));
}

export function formatMxn(cents: number, language: "es" | "en" = "es"): string {
  assertNonNegativeInteger(cents, "cents");
  return new Intl.NumberFormat(language === "es" ? "es-MX" : "en-US", {
    style: "currency",
    currency: "MXN",
    currencyDisplay: "symbol",
  }).format(cents / 100);
}

/** Renders a basis-point rate as a human percentage, e.g. 1600 -> "16%". */
export function formatTaxRate(taxRateBasisPoints: number): string {
  const percent = taxRateBasisPoints / 100;
  return `${Number.isInteger(percent) ? percent : percent.toFixed(2)}%`;
}
