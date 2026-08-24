/**
 * Mexican VAT (IVA) arithmetic for the ticket checkout.
 *
 * Published prices are IVA-exclusive: the catalog stores the taxable base and
 * the tax is added on top. Every amount is an integer number of cents so the
 * value charged by MercadoPago, the value stored in Postgres and the value
 * printed on the CFDI are the same number, with no floating point drift.
 */

/** IVA general rate expressed in basis points (16.00%). */
export const IVA_RATE_BASIS_POINTS = 1_600;

/** Northern border stimulus rate, kept for documentation only. */
export const IVA_BORDER_RATE_BASIS_POINTS = 800;

export const BASIS_POINT_SCALE = 10_000;

export type TaxBreakdown = {
  /** Taxable base: unit price times quantity. */
  subtotalCents: number;
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
 * The tax is computed once over the whole taxable base rather than per unit,
 * which is what the SAT expects on a single CFDI concept line and avoids the
 * per-unit rounding drift that would otherwise make the CFDI total differ from
 * the amount actually captured by MercadoPago.
 */
export function computeTaxBreakdown(
  unitPriceCents: number,
  quantity: number,
  taxRateBasisPoints: number = IVA_RATE_BASIS_POINTS,
): TaxBreakdown {
  assertNonNegativeInteger(unitPriceCents, "unitPriceCents");
  assertNonNegativeInteger(quantity, "quantity");
  assertNonNegativeInteger(taxRateBasisPoints, "taxRateBasisPoints");

  if (quantity < 1) {
    throw new RangeError("quantity must be at least 1");
  }

  const subtotalCents = unitPriceCents * quantity;
  if (!Number.isSafeInteger(subtotalCents)) {
    throw new RangeError("Subtotal exceeds safe integer precision");
  }

  const taxCents = applyRateHalfUp(subtotalCents, taxRateBasisPoints);

  return {
    subtotalCents,
    unitPriceCents,
    quantity,
    taxRateBasisPoints,
    taxCents,
    totalCents: subtotalCents + taxCents,
  };
}

/**
 * Splits an IVA-inclusive gross amount back into base and tax.
 *
 * The catalog is IVA-exclusive, so this is not used by the checkout. It exists
 * for reconciliation: MercadoPago settlement reports and manual adjustments
 * arrive as gross totals and finance needs the same rounding rule applied.
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
    unitPriceCents: subtotalCents,
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
