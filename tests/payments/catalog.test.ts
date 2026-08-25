import { describe, expect, it } from "vitest";
import { PRICING } from "@/lib/content";
import {
  CORPORATE_DISCOUNT_MIN_SEATS,
  CORPORATE_MAX_SEATS,
  CORPORATE_MIN_SEATS,
  CORPORATE_SEAT_OPTIONS,
  isOrderTierId,
  isTicketTierId,
  quoteCorporateOrder,
  quoteCorporatePass,
  quoteOrder,
  quoteTicketOrder,
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
