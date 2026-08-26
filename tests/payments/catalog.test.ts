import { describe, expect, it } from "vitest";
import { PRICING } from "@/lib/content";
import {
  CORPORATE_DISCOUNT_MIN_SEATS,
  VOLUME_DISCOUNT_MIN_QUANTITY,
  CORPORATE_MAX_SEATS,
  CORPORATE_MIN_SEATS,
  CORPORATE_SEAT_OPTIONS,
  isOrderTierId,
  isTicketTierId,
  quoteCorporateOrder,
  quoteCorporatePass,
  quoteOrder,
  quoteTicketOrder,
  quoteVolumePricing,
  tierEarnsVolumeDiscount,
  tierUnitPriceCents,
  TICKET_TIERS,
  TICKET_TIER_IDS,
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
        expect(quote.totalCents).toBeLessThanOrEqual(
          tier.unitPriceCents * quantity,
        );
        // The line stays an exact multiple of the unit that was charged, which
        // is what the preference and the CFDI depend on.
        expect(quote.totalCents).toBe(quote.unitPriceCents * quantity);
      }
    }
  });

  it("charges the list price below the volume threshold", () => {
    for (const id of TICKET_TIER_IDS) {
      const tier = TICKET_TIERS[id];
      // Estudiante is capped below the threshold, so its ceiling is the
      // highest quantity that can still be quoted for it.
      const quantity = Math.min(
        VOLUME_DISCOUNT_MIN_QUANTITY - 1,
        tier.maxQuantity,
      );
      expect(quoteTicketOrder(id, quantity).unitPriceCents).toBe(
        tier.unitPriceCents,
      );
    }
  });

  it("gives an individual buyer the same 25% a block gets, from five up", () => {
    expect(tierEarnsVolumeDiscount("plus")).toBe(true);

    const quote = quoteTicketOrder("plus", VOLUME_DISCOUNT_MIN_QUANTITY);
    expect(quote.unitPriceCents).toBe(187_500);
    expect(quote.totalCents).toBe(937_500);
    expect(quote.subtotalCents + quote.taxCents).toBe(quote.totalCents);
    // Five Plus accesses cost the same bought individually or as a block.
    expect(quote.totalCents).toBe(
      quoteCorporateOrder(VOLUME_DISCOUNT_MIN_QUANTITY).totalCents,
    );

    const ten = quoteTicketOrder("plus", 10);
    expect(ten.unitPriceCents).toBe(187_500);
    expect(ten.totalCents).toBe(1_875_000);
  });

  it("keeps the entry tiers out of the volume discount", () => {
    expect(tierEarnsVolumeDiscount("general")).toBe(false);
    expect(tierEarnsVolumeDiscount("estudiante")).toBe(false);
    expect(quoteTicketOrder("general", 10).unitPriceCents).toBe(90_000);
    expect(tierUnitPriceCents("general", 10)).toBe(90_000);
  });

  it("shows the buyer the list price, the discount and the total", () => {
    const quote = quoteVolumePricing("plus", VOLUME_DISCOUNT_MIN_QUANTITY);
    expect(quote).toMatchObject({
      tier: "plus",
      quantity: VOLUME_DISCOUNT_MIN_QUANTITY,
      listUnitPriceCents: 250_000,
      unitPriceCents: 187_500,
      listTotalCents: 1_250_000,
      discountBasisPoints: 2_500,
      discountCents: 312_500,
      totalCents: 937_500,
    });
    expect(quoteVolumePricing("plus", 2).discountCents).toBe(0);
    expect(() => quoteVolumePricing("estudiante", 3)).toThrow(RangeError);
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

  it("recognizes the corporate tier as an order tier but not a published one", () => {
    expect(isOrderTierId("corporativo")).toBe(true);
    expect(isTicketTierId("corporativo")).toBe(false);
  });
});

describe("corporate blocks", () => {
  it("charges the list price below the discount threshold", () => {
    const quote = quoteCorporatePass(CORPORATE_DISCOUNT_MIN_SEATS - 1);
    expect(quote.discountCents).toBe(0);
    expect(quote.unitPriceCents).toBe(quote.listUnitPriceCents);
    expect(quote.totalCents).toBe(quote.listUnitPriceCents * quote.seats);
  });

  it("applies 25% from the fifth access up", () => {
    const quote = quoteCorporatePass(CORPORATE_DISCOUNT_MIN_SEATS);
    expect(quote.discountBasisPoints).toBe(2_500);
    expect(quote.unitPriceCents).toBe(187_500);
    expect(quote.listTotalCents).toBe(1_250_000);
    expect(quote.discountCents).toBe(312_500);
    expect(quote.totalCents).toBe(937_500);
  });

  it("keeps the block an exact multiple of its unit price", () => {
    for (const seats of CORPORATE_SEAT_OPTIONS) {
      const order = quoteCorporateOrder(seats);
      expect(order.totalCents).toBe(order.unitPriceCents * seats);
      expect(order.subtotalCents + order.taxCents).toBe(order.totalCents);
      expect(order.totalCents).toBe(quoteCorporatePass(seats).totalCents);
    }
  });

  it("offers a dropdown that starts at the minimum block", () => {
    expect(CORPORATE_SEAT_OPTIONS[0]).toBe(CORPORATE_MIN_SEATS);
    expect(new Set(CORPORATE_SEAT_OPTIONS).size).toBe(
      CORPORATE_SEAT_OPTIONS.length,
    );
  });

  it("refuses a block outside the seat range", () => {
    expect(() => quoteCorporateOrder(1)).toThrow(RangeError);
    expect(() => quoteCorporateOrder(CORPORATE_MAX_SEATS + 1)).toThrow(RangeError);
    expect(() => quoteCorporateOrder(2.5)).toThrow(RangeError);
  });

  it("routes every tier through one pricing entry point", () => {
    expect(quoteOrder("plus", 2)).toEqual(quoteTicketOrder("plus", 2));
    expect(quoteOrder("corporativo", 6)).toEqual(quoteCorporateOrder(6));
  });
});
