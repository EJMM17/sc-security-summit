import { IVA_RATE_BASIS_POINTS, computeTaxBreakdown, type TaxBreakdown } from "@/lib/payments/tax";

/**
 * Server-authoritative price list.
 *
 * `lib/content.ts` stays the single source of truth for marketing copy; this
 * module is the single source of truth for money. The browser never sends an
 * amount — it sends a tier id and a quantity, and the server prices them here.
 * `tests/payments/catalog.test.ts` asserts the two lists cannot drift apart.
 *
 * Amounts are the IVA-exclusive taxable base, in cents of MXN.
 */

export const TICKET_CURRENCY = "MXN" as const;

export const TICKET_TIER_IDS = ["plus", "general", "estudiante"] as const;

export type TicketTierId = (typeof TICKET_TIER_IDS)[number];

export type TicketTier = {
  id: TicketTierId;
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
    ...computeTaxBreakdown(
      definition.unitPriceCents,
      quantity,
      IVA_RATE_BASIS_POINTS,
    ),
    tier,
    currency: TICKET_CURRENCY,
  };
}
