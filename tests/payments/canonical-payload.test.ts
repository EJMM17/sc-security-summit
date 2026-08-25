import { describe, expect, it } from "vitest";
import {
  canonicalTicketOrderPayload,
  hashTicketOrderPayload,
} from "@/lib/payments/canonical-payload";
import {
  checkoutFixture,
  corporateCheckoutFixture,
  invoicedCheckoutFixture,
} from "@/tests/payments/checkout-fixtures";

describe("canonicalTicketOrderPayload", () => {
  it("is stable across repeated calls", () => {
    expect(canonicalTicketOrderPayload(checkoutFixture)).toBe(
      canonicalTicketOrderPayload(checkoutFixture),
    );
  });

  it("ignores attribution so a retry from another campaign link replays", () => {
    const fromCampaign = {
      ...checkoutFixture,
      attribution: {
        ...checkoutFixture.attribution,
        utm_source: "linkedin",
        landing_page: "/checkout",
      },
    };
    expect(hashTicketOrderPayload(fromCampaign)).toBe(
      hashTicketOrderPayload(checkoutFixture),
    );
  });

  it("changes when the amount-bearing fields change", () => {
    const base = hashTicketOrderPayload(checkoutFixture);
    expect(hashTicketOrderPayload({ ...checkoutFixture, quantity: 3 })).not.toBe(base);
    expect(hashTicketOrderPayload({ ...checkoutFixture, tier: "general" })).not.toBe(base);
  });

  it("treats requesting a CFDI as a different order", () => {
    expect(hashTicketOrderPayload(invoicedCheckoutFixture)).not.toBe(
      hashTicketOrderPayload(checkoutFixture),
    );
  });

  it("changes when the RFC changes", () => {
    const other = {
      ...invoicedCheckoutFixture,
      invoice: { ...invoicedCheckoutFixture.invoice!, rfc: "XYZ800101AB2" },
    };
    expect(hashTicketOrderPayload(other)).not.toBe(
      hashTicketOrderPayload(invoicedCheckoutFixture),
    );
  });

  it("produces a 64-character lowercase hex digest", () => {
    expect(hashTicketOrderPayload(checkoutFixture)).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("corporate blocks and referrals", () => {
  it("treats a changed roster as a different order", () => {
    const renamed = {
      ...corporateCheckoutFixture,
      attendees: [
        "María González López",
        "Juan Pérez Ruiz",
        "Ana Ramírez Solís",
        "Luis Torres Vega",
        "Sofía Herrera Silva",
      ],
    };
    expect(hashTicketOrderPayload(renamed)).not.toBe(
      hashTicketOrderPayload(corporateCheckoutFixture),
    );
  });

  it("treats a changed referrer as a different order", () => {
    expect(
      hashTicketOrderPayload({ ...checkoutFixture, referral: "Ana" }),
    ).not.toBe(hashTicketOrderPayload(checkoutFixture));
  });
});
