import { describe, expect, it } from "vitest";
import { INQUIRY_CONSENT_VERSION } from "@/lib/inquiries/constants";
import {
  parseTicketCheckoutFormData,
  ticketCheckoutSchema,
} from "@/lib/payments/schema";
import {
  checkoutFixture,
  checkoutFormData,
  corporateCheckoutFixture,
  corporateCheckoutFormData,
} from "@/tests/payments/checkout-fixtures";

describe("ticketCheckoutSchema", () => {
  it("accepts a valid order without an invoice", () => {
    expect(ticketCheckoutSchema.safeParse(checkoutFixture).success).toBe(true);
  });

  it("requires the invoice block when a CFDI is requested", () => {
    const result = ticketCheckoutSchema.safeParse({
      ...checkoutFixture,
      requiresInvoice: true,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.message === "invoice_details_required")).toBe(true);
  });

  it("refuses fiscal data on an order that did not request a CFDI", () => {
    const result = ticketCheckoutSchema.safeParse({
      ...checkoutFixture,
      requiresInvoice: false,
      invoice: {
        rfc: "ABC800101XY2",
        legalName: "Logística del Norte SA de CV",
        taxRegime: "601",
        cfdiUse: "G03",
        postalCode: "88680",
      },
    });
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((i) => i.message === "invoice_details_not_requested"),
    ).toBe(true);
  });

  it("rejects a corporate regime declared with a persona física RFC", () => {
    const result = ticketCheckoutSchema.safeParse({
      ...checkoutFixture,
      requiresInvoice: true,
      invoice: {
        rfc: "GOME800101AB1",
        legalName: "María González",
        taxRegime: "601",
        cfdiUse: "G03",
        postalCode: "88680",
      },
    });
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some(
        (i) => i.message === "tax_regime_person_type_mismatch",
      ),
    ).toBe(true);
  });

  it("rejects a CFDI use that does not apply to a persona moral", () => {
    const result = ticketCheckoutSchema.safeParse({
      ...checkoutFixture,
      requiresInvoice: true,
      invoice: {
        rfc: "ABC800101XY2",
        legalName: "Logística del Norte SA de CV",
        taxRegime: "601",
        cfdiUse: "D10",
        postalCode: "88680",
      },
    });
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((i) => i.message === "cfdi_use_person_type_mismatch"),
    ).toBe(true);
  });

  it("rejects a quantity above the student tier limit", () => {
    const result = ticketCheckoutSchema.safeParse({
      ...checkoutFixture,
      tier: "estudiante",
      quantity: 3,
    });
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((i) => i.message === "quantity_exceeds_tier_limit"),
    ).toBe(true);
  });

  it("rejects a stale consent version", () => {
    expect(
      ticketCheckoutSchema.safeParse({
        ...checkoutFixture,
        consentVersion: "2020-01-01",
      }).success,
    ).toBe(false);
  });

  it("rejects unknown fields", () => {
    expect(
      ticketCheckoutSchema.safeParse({
        ...checkoutFixture,
        amountCents: 1,
      }).success,
    ).toBe(false);
  });
});

describe("parseTicketCheckoutFormData", () => {
  it("normalizes the buyer contact fields", () => {
    const result = parseTicketCheckoutFormData(checkoutFormData());
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe("maria@empresa.com");
    expect(result.data?.quantity).toBe(2);
    expect(result.data?.requiresInvoice).toBe(false);
    expect(result.data?.invoice).toBeUndefined();
  });

  it("treats a missing company as absent rather than empty", () => {
    const result = parseTicketCheckoutFormData(checkoutFormData({ company: "" }));
    expect(result.success).toBe(true);
    expect(result.data?.company).toBeUndefined();
  });

  it("collects the fiscal fields only when the checkbox is on", () => {
    const withInvoice = parseTicketCheckoutFormData(
      checkoutFormData({
        requiresInvoice: "on",
        rfc: "abc800101xy2",
        legalName: "Logística del Norte SA de CV",
        taxRegime: "601",
        cfdiUse: "G03",
        postalCode: "88680",
      }),
    );
    expect(withInvoice.success).toBe(true);
    expect(withInvoice.data?.invoice?.rfc).toBe("ABC800101XY2");

    const withoutCheckbox = parseTicketCheckoutFormData(
      checkoutFormData({
        rfc: "ABC800101XY2",
        legalName: "Logística del Norte SA de CV",
        taxRegime: "601",
        cfdiUse: "G03",
        postalCode: "88680",
      }),
    );
    expect(withoutCheckbox.success).toBe(true);
    expect(withoutCheckbox.data?.invoice).toBeUndefined();
  });

  it("drops attribution unless the browser reports full marketing consent", () => {
    const denied = parseTicketCheckoutFormData(
      checkoutFormData({
        marketingConsent: "essential",
        utm_source: "linkedin",
        landing_page: "/checkout",
      }),
    );
    expect(denied.data?.attribution.utm_source).toBeUndefined();
    expect(denied.data?.attribution.landing_page).toBeUndefined();

    const granted = parseTicketCheckoutFormData(
      checkoutFormData({
        marketingConsent: "all",
        utm_source: "linkedin",
        landing_page: "/checkout",
      }),
    );
    expect(granted.data?.attribution.utm_source).toBe("linkedin");
    expect(granted.data?.attribution.landing_page).toBe("/checkout");
  });

  it("rejects a form without a submission id", () => {
    const result = parseTicketCheckoutFormData(
      checkoutFormData({ submissionId: "not-a-uuid" }),
    );
    expect(result.success).toBe(false);
  });

  it("pins the consent version to the canonical constant", () => {
    expect(
      parseTicketCheckoutFormData(
        checkoutFormData({ consentVersion: INQUIRY_CONSENT_VERSION }),
      ).success,
    ).toBe(true);
  });
});

describe("corporate blocks", () => {
  it("accepts a block whose roster matches the requested accesses", () => {
    const result = ticketCheckoutSchema.safeParse(corporateCheckoutFixture);
    expect(result.success).toBe(true);
    expect(result.data?.attendees).toHaveLength(5);
    expect(result.data?.referral).toBe("Cámara de Comercio de Reynosa");
  });

  it("refuses a roster that does not name every access", () => {
    const result = ticketCheckoutSchema.safeParse({
      ...corporateCheckoutFixture,
      quantity: 6,
    });
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((i) => i.message === "attendees_must_match_quantity"),
    ).toBe(true);
  });

  it("refuses a block smaller than two accesses", () => {
    const result = ticketCheckoutSchema.safeParse({
      ...corporateCheckoutFixture,
      quantity: 1,
      attendees: ["María González López"],
    });
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((i) => i.message === "corporate_block_too_small"),
    ).toBe(true);
  });

  it("refuses a roster on an individual access", () => {
    const result = ticketCheckoutSchema.safeParse({
      ...checkoutFixture,
      attendees: ["María González López", "Juan Pérez Ruiz"],
    });
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((i) => i.message === "attendees_not_expected"),
    ).toBe(true);
  });

  it("reads the roster and the referrer out of the submitted form", () => {
    const parsed = parseTicketCheckoutFormData(corporateCheckoutFormData());
    expect(parsed.success).toBe(true);
    expect(parsed.data?.tier).toBe("corporativo");
    expect(parsed.data?.quantity).toBe(5);
    expect(parsed.data?.attendees?.[0]).toBe("María González López");
    expect(parsed.data?.referral).toBe("Cámara de Comercio de Reynosa");
  });

  it("keeps the referrer optional on an individual access", () => {
    const parsed = parseTicketCheckoutFormData(checkoutFormData());
    expect(parsed.success).toBe(true);
    expect(parsed.data?.referral).toBeUndefined();
    expect(parsed.data?.attendees).toBeUndefined();
  });

  it("ignores a roster smuggled into an individual submission", () => {
    const formData = checkoutFormData();
    formData.append("attendees", "María González López");
    const parsed = parseTicketCheckoutFormData(formData);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.attendees).toBeUndefined();
  });

  it("normalizes the discount code and keeps it optional", () => {
    expect(
      parseTicketCheckoutFormData(checkoutFormData()).data?.discountCode,
    ).toBeUndefined();

    for (const typed of ["UVB2026", "uvb2026", " Uvb2026", "UVB2026 "]) {
      const parsed = parseTicketCheckoutFormData(
        checkoutFormData({ discountCode: typed }),
      );
      expect(parsed.success).toBe(true);
      expect(parsed.data?.discountCode).toBe("UVB2026");
    }
  });

  it("accepts a code nobody issued: an invalid code is not a form error", () => {
    const parsed = parseTicketCheckoutFormData(
      checkoutFormData({ discountCode: "ABC123" }),
    );
    expect(parsed.success).toBe(true);
    expect(parsed.data?.discountCode).toBe("ABC123");
  });

  it("refuses a code longer than the column can hold", () => {
    expect(
      parseTicketCheckoutFormData(
        checkoutFormData({ discountCode: "A".repeat(64) }),
      ).success,
    ).toBe(false);
  });
});
