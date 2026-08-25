import {
  IVA_RATE_BASIS_POINTS,
  applyRateHalfUp,
  computeInclusiveTaxBreakdown,
  type TaxBreakdown,
} from "@/lib/payments/tax";

/**
 * Server-authoritative price list.
 *
 * `lib/content.ts` stays the single source of truth for marketing copy; this
 * module is the single source of truth for money. The browser never sends an
 * amount — it sends a tier id and a quantity, and the server prices them here.
 * `tests/payments/catalog.test.ts` asserts the two lists cannot drift apart.
 *
 * Amounts are the IVA-inclusive published price, in cents of MXN: what the
 * site shows is what the buyer pays, and the 16% is carved out of it for the
 * CFDI rather than added on top.
 */

export const TICKET_CURRENCY = "MXN" as const;

export const TICKET_TIER_IDS = ["plus", "general", "estudiante"] as const;

export type TicketTierId = (typeof TICKET_TIER_IDS)[number];

export type TicketTier = {
  id: TicketTierId;
  /** IVA-inclusive published price of one access, in cents. */
  unitPriceCents: number;
  maxQuantity: number;
  /** Tier requires a valid student ID at check-in, so it is not sold in bulk. */
  requiresProofAtCheckIn: boolean;
  label: { es: string; en: string };
};

export const TICKET_TIERS: Readonly<Record<TicketTierId, TicketTier>> = {
  plus: {
    id: "plus",
    unitPriceCents: 250_000,
    maxQuantity: 10,
    requiresProofAtCheckIn: false,
    label: { es: "Acceso Plus", en: "Plus Pass" },
  },
  general: {
    id: "general",
    unitPriceCents: 90_000,
    maxQuantity: 10,
    requiresProofAtCheckIn: false,
    label: { es: "Acceso General", en: "General Pass" },
  },
  estudiante: {
    id: "estudiante",
    unitPriceCents: 65_000,
    maxQuantity: 2,
    requiresProofAtCheckIn: true,
    label: { es: "Acceso Estudiante", en: "Student Pass" },
  },
} as const;

export function isTicketTierId(value: unknown): value is TicketTierId {
  return (
    typeof value === "string" &&
    (TICKET_TIER_IDS as readonly string[]).includes(value)
  );
}

export function getTicketTier(id: TicketTierId): TicketTier {
  return TICKET_TIERS[id];
}

export type TicketQuote = TaxBreakdown & {
  tier: TicketTierId;
  currency: typeof TICKET_CURRENCY;
};

/**
 * Prices a tier and quantity. Throws on an out-of-range quantity so a tampered
 * form can never produce a quote the catalog does not authorize.
 */
export function quoteTicketOrder(
  tier: TicketTierId,
  quantity: number,
): TicketQuote {
  const definition = getTicketTier(tier);

  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > definition.maxQuantity
  ) {
    throw new RangeError(`quantity out of range for tier ${tier}`);
  }

  return {
    ...computeInclusiveTaxBreakdown(
      definition.unitPriceCents,
      quantity,
      IVA_RATE_BASIS_POINTS,
    ),
    tier,
    currency: TICKET_CURRENCY,
  };
}

/**
 * Corporate passes.
 *
 * A corporate request is a lead, not a charge: the block is quoted here so the
 * form can show the buyer the same arithmetic the team will put in the formal
 * quote, and so the discount rule lives next to the prices it applies to
 * instead of being retyped in a component. Nothing here is ever persisted as
 * an amount owed.
 */
export const CORPORATE_PASS_TIER: TicketTierId = "plus";

/** A block is corporate from two people up. */
export const CORPORATE_MIN_SEATS = 2;

/**
 * There is no commercial ceiling on a corporate block, so this is only the
 * technical guard that keeps a tampered form from asking for a quote of a
 * million seats. Raise it if a real block ever gets close.
 */
export const CORPORATE_MAX_SEATS = 200;

/** Volume discount kicks in at the fifth access and never expires above it. */
export const CORPORATE_DISCOUNT_MIN_SEATS = 5;

export const CORPORATE_DISCOUNT_BASIS_POINTS = 2_500;

export type CorporateQuote = {
  seats: number;
  unitPriceCents: number;
  listTotalCents: number;
  discountBasisPoints: number;
  discountCents: number;
  totalCents: number;
  currency: typeof TICKET_CURRENCY;
};

/**
 * Estimated price of a corporate block, IVA included like every published
 * price. The discount is applied once over the whole block, not per access, so
 * the estimate never drifts a cent from `seats × unit − discount`.
 */
export function quoteCorporatePass(seats: number): CorporateQuote {
  if (
    !Number.isSafeInteger(seats) ||
    seats < CORPORATE_MIN_SEATS ||
    seats > CORPORATE_MAX_SEATS
  ) {
    throw new RangeError("seats out of range for a corporate quote");
  }

  const unitPriceCents = TICKET_TIERS[CORPORATE_PASS_TIER].unitPriceCents;
  const listTotalCents = unitPriceCents * seats;
  const discountBasisPoints =
    seats >= CORPORATE_DISCOUNT_MIN_SEATS ? CORPORATE_DISCOUNT_BASIS_POINTS : 0;
  const discountCents = applyRateHalfUp(listTotalCents, discountBasisPoints);

  return {
    seats,
    unitPriceCents,
    listTotalCents,
    discountBasisPoints,
    discountCents,
    totalCents: listTotalCents - discountCents,
    currency: TICKET_CURRENCY,
  };
}
