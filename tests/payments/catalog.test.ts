import { describe, expect, it } from "vitest";
import { PRICING } from "@/lib/content";
import {
  quoteTicketOrder,
  TICKET_TIERS,
  TICKET_TIER_IDS,
  isTicketTierId,
} from "@/lib/payments/catalog";

describe("ticket catalog", () => {
  it("cannot drift from the published marketing prices", () => {
    for (const language of ["es", "en"] as const) {
      for (const plan of PRICING[language]) {
        const tier = TICKET_TIERS[plan.id];
        expect(tier, `missing catalog entry for ${plan.id}`).toBeDefined();
        // content.ts publishes whole pesos; the catalog stores cents.
        expect(tier.unitPriceCents).toBe(plan.priceValue * 100);
      }
    }
  });

  it("covers every published tier and nothing else", () => {
    expect([...TICKET_TIER_IDS].sort()).toEqual(
      PRICING.es.map((plan) => plan.id).sort(),
    );
  });

  it("prices a quote with the IVA already inside the published price", () => {
    expect(quoteTicketOrder("plus", 2)).toMatchObject({
      tier: "plus",
      currency: "MXN",
      quantity: 2,
      unitPriceCents: 250_000,
      subtotalCents: 431_034,
      taxCents: 68_966,
      totalCents: 500_000,
    });
  });

  it("never charges more than the price the visitor saw", () => {
    for (const id of TICKET_TIER_IDS) {
      const tier = TICKET_TIERS[id];
      for (let quantity = 1; quantity <= tier.maxQuantity; quantity += 1) {
        const quote = quoteTicketOrder(id, quantity);
        expect(quote.totalCents).toBe(tier.unitPriceCents * quantity);
      }
    }
  });

  it("refuses a quantity above the tier limit", () => {
    expect(() => quoteTicketOrder("estudiante", 3)).toThrow(RangeError);
    expect(() => quoteTicketOrder("plus", 11)).toThrow(RangeError);
    expect(() => quoteTicketOrder("plus", 0)).toThrow(RangeError);
    expect(() => quoteTicketOrder("plus", 1.5)).toThrow(RangeError);
  });

  it("caps the student tier lower because it needs proof at check-in", () => {
    expect(TICKET_TIERS.estudiante.requiresProofAtCheckIn).toBe(true);
    expect(TICKET_TIERS.estudiante.maxQuantity).toBe(2);
  });

  it("recognizes only known tier ids", () => {
    expect(isTicketTierId("plus")).toBe(true);
    expect(isTicketTierId("vip")).toBe(false);
    expect(isTicketTierId(3)).toBe(false);
  });
});
