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
  /**
   * Whether buying this tier in volume earns the block discount. It is the
   * same 25% a corporate block gets, because a corporate block is exactly this
   * tier bought in volume: a buyer who takes five Plus accesses on the
   * individual form must not pay more than the same five inside a block.
   */
  volumeDiscount: boolean;
  label: { es: string; en: string };
};

export const TICKET_TIERS: Readonly<Record<TicketTierId, TicketTier>> = {
  plus: {
    id: "plus",
    unitPriceCents: 250_000,
    maxQuantity: 10,
    requiresProofAtCheckIn: false,
    volumeDiscount: true,
    label: { es: "Acceso Plus", en: "Plus Pass" },
  },
  general: {
    id: "general",
    unitPriceCents: 90_000,
    maxQuantity: 10,
    requiresProofAtCheckIn: false,
    volumeDiscount: false,
    label: { es: "Acceso General", en: "General Pass" },
  },
  estudiante: {
    id: "estudiante",
    unitPriceCents: 65_000,
    maxQuantity: 2,
    requiresProofAtCheckIn: true,
    volumeDiscount: false,
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

/**
 * Corporate blocks are sold on site too, but they are not a published tier:
 * they have their own id, their own volume discount and no fixed unit price,
 * so they travel next to the three published accesses rather than inside
 * `TICKET_TIER_IDS`, which must keep mirroring `PRICING` exactly.
 */
export const CORPORATE_TIER_ID = "corporativo" as const;

export type CorporateTierId = typeof CORPORATE_TIER_ID;

/** Every tier an order row can carry: the published three plus the block. */
export type OrderTierId = TicketTierId | CorporateTierId;

export const ORDER_TIER_IDS: readonly OrderTierId[] = [
  ...TICKET_TIER_IDS,
  CORPORATE_TIER_ID,
];

export function isOrderTierId(value: unknown): value is OrderTierId {
  return (
    typeof value === "string" &&
    (ORDER_TIER_IDS as readonly string[]).includes(value)
  );
}

export const CORPORATE_TIER_LABEL: { es: string; en: string } = {
  es: "Pase Corporativo",
  en: "Corporate Pass",
};

export function orderTierLabel(tier: OrderTierId): { es: string; en: string } {
  return tier === CORPORATE_TIER_ID
    ? CORPORATE_TIER_LABEL
    : TICKET_TIERS[tier].label;
}

export type TicketQuote = TaxBreakdown & {
  tier: OrderTierId;
  currency: typeof TICKET_CURRENCY;
};

/**
 * Volume discount.
 *
 * One rule serves both ways of buying: the same 25% applies from the fifth
 * access up, whether those accesses are bought as a corporate block or as five
 * individual Plus accesses on the checkout form. Only tiers flagged
 * `volumeDiscount` earn it — General and Estudiante are already entry prices,
 * and Estudiante is capped below the threshold anyway.
 *
 * The discount is always applied to the unit price rather than to the line
 * total, so the line stays an exact multiple of the unit — the invariant the
 * database, the MercadoPago preference and the CFDI all depend on.
 */
export const VOLUME_DISCOUNT_MIN_QUANTITY = 5;

export const VOLUME_DISCOUNT_BASIS_POINTS = 2_500;

/** Tiers that earn the volume discount, for the copy that announces it. */
export const VOLUME_DISCOUNT_TIER_IDS: readonly TicketTierId[] =
  TICKET_TIER_IDS.filter((id) => TICKET_TIERS[id].volumeDiscount);

export function tierEarnsVolumeDiscount(tier: TicketTierId): boolean {
  return TICKET_TIERS[tier].volumeDiscount;
}

export function tierVolumeDiscountBasisPoints(
  tier: TicketTierId,
  quantity: number,
): number {
  return tierEarnsVolumeDiscount(tier) && quantity >= VOLUME_DISCOUNT_MIN_QUANTITY
    ? VOLUME_DISCOUNT_BASIS_POINTS
    : 0;
}

/** What one access of `tier` actually costs at `quantity`, IVA included. */
export function tierUnitPriceCents(tier: TicketTierId, quantity: number): number {
  const listUnitPriceCents = TICKET_TIERS[tier].unitPriceCents;
  return (
    listUnitPriceCents -
    applyRateHalfUp(
      listUnitPriceCents,
      tierVolumeDiscountBasisPoints(tier, quantity),
    )
  );
}

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
      tierUnitPriceCents(tier, quantity),
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
 * A block is a paid order like any other: it is priced here, charged through
 * MercadoPago and stored in `ticket_orders` under the corporate tier. It is
 * the Plus access bought in volume, so it shares the discount rule above
 * rather than carrying one of its own.
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

/**
 * What the seat picker offers. The buyer picks from a bounded list instead of
 * typing a number, so the roster below it can never be resized by a stray
 * keystroke. A block larger than this is still valid server side and is
 * arranged with the team.
 */
export const CORPORATE_SEAT_CHOICE_MAX = 25;

export const CORPORATE_SEAT_OPTIONS: readonly number[] = Array.from(
  { length: CORPORATE_SEAT_CHOICE_MAX - CORPORATE_MIN_SEATS + 1 },
  (_, index) => CORPORATE_MIN_SEATS + index,
);

/**
 * Shortcuts offered next to the seat picker: the smallest block, the first
 * discounted block, and two common team sizes above it.
 */
export const CORPORATE_SEAT_PRESETS: readonly number[] = [
  CORPORATE_MIN_SEATS,
  VOLUME_DISCOUNT_MIN_QUANTITY,
  10,
  CORPORATE_SEAT_CHOICE_MAX,
];

/** Volume discount kicks in at the fifth access and never expires above it. */
export const CORPORATE_DISCOUNT_MIN_SEATS = VOLUME_DISCOUNT_MIN_QUANTITY;

export const CORPORATE_DISCOUNT_BASIS_POINTS = VOLUME_DISCOUNT_BASIS_POINTS;

/**
 * A quote as a buyer reads it: list price, discount and total, next to the
 * amounts the order actually charges. Every amount is derived from the
 * discounted unit, so what the form shows is exactly what the preference
 * charges.
 */
export type VolumeQuote = {
  tier: OrderTierId;
  quantity: number;
  /** List price of one access before the volume discount. */
  listUnitPriceCents: number;
  /** What one access actually costs at this quantity, IVA included. */
  unitPriceCents: number;
  listTotalCents: number;
  discountBasisPoints: number;
  discountCents: number;
  totalCents: number;
  currency: typeof TICKET_CURRENCY;
};

/** The block quote keeps its seat vocabulary for the corporate form. */
export type CorporateQuote = VolumeQuote & { seats: number };

function assertCorporateSeats(seats: number): void {
  if (
    !Number.isSafeInteger(seats) ||
    seats < CORPORATE_MIN_SEATS ||
    seats > CORPORATE_MAX_SEATS
  ) {
    throw new RangeError("seats out of range for a corporate quote");
  }
}

export function corporateDiscountBasisPoints(seats: number): number {
  return tierVolumeDiscountBasisPoints(CORPORATE_PASS_TIER, seats);
}

/**
 * Discounted price of one access in a block of `seats`, IVA included.
 */
export function corporateUnitPriceCents(seats: number): number {
  assertCorporateSeats(seats);
  return tierUnitPriceCents(CORPORATE_PASS_TIER, seats);
}

/**
 * Prices any order tier as the buyer reads it, individual or corporate. The
 * corporate block is quoted against the Plus list price; an individual tier is
 * quoted against its own.
 */
export function quoteVolumePricing(
  tier: OrderTierId,
  quantity: number,
): VolumeQuote {
  const pricedTier = tier === CORPORATE_TIER_ID ? CORPORATE_PASS_TIER : tier;

  if (tier === CORPORATE_TIER_ID) {
    assertCorporateSeats(quantity);
  } else {
    const definition = getTicketTier(pricedTier);
    if (
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > definition.maxQuantity
    ) {
      throw new RangeError(`quantity out of range for tier ${tier}`);
    }
  }

  const listUnitPriceCents = TICKET_TIERS[pricedTier].unitPriceCents;
  const unitPriceCents = tierUnitPriceCents(pricedTier, quantity);
  const listTotalCents = listUnitPriceCents * quantity;
  const totalCents = unitPriceCents * quantity;

  return {
    tier,
    quantity,
    listUnitPriceCents,
    unitPriceCents,
    listTotalCents,
    discountBasisPoints: tierVolumeDiscountBasisPoints(pricedTier, quantity),
    discountCents: listTotalCents - totalCents,
    totalCents,
    currency: TICKET_CURRENCY,
  };
}

/**
 * The block as the corporate form shows it.
 */
export function quoteCorporatePass(seats: number): CorporateQuote {
  const quote = quoteVolumePricing(CORPORATE_TIER_ID, seats);
  return { ...quote, seats };
}

/**
 * The same block priced as an order: the shape the checkout, the database and
 * MercadoPago all consume.
 */
export function quoteCorporateOrder(seats: number): TicketQuote {
  assertCorporateSeats(seats);

  return {
    ...computeInclusiveTaxBreakdown(
      corporateUnitPriceCents(seats),
      seats,
      IVA_RATE_BASIS_POINTS,
    ),
    tier: CORPORATE_TIER_ID,
    currency: TICKET_CURRENCY,
  };
}

/**
 * Prices any order tier, individual or corporate, from the numbers the browser
 * is allowed to send: a tier id and a quantity.
 */
export function quoteOrder(tier: OrderTierId, quantity: number): TicketQuote {
  return tier === CORPORATE_TIER_ID
    ? quoteCorporateOrder(quantity)
    : quoteTicketOrder(tier, quantity);
}
