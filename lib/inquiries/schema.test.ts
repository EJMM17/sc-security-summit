import { describe, expect, it } from "vitest";
import { INQUIRY_CONSENT_VERSION } from "@/lib/inquiries/constants";
import {
  attributionSchema,
  corporateInquirySchema,
  parseInquiryFormData,
  sponsorInquirySchema,
} from "@/lib/inquiries/schema";

const COMMON = {
  submissionId: "f5fb8f1c-18ba-4f7d-9d9a-12378a2ac4c5",
  email: " CONTACT@EXAMPLE.COM ",
  company: "  Example   Logistics ",
  phone: " +52 899 123 4567 ",
  language: "es" as const,
  consentVersion: INQUIRY_CONSENT_VERSION,
  attribution: {},
};

/** A roster with one named participant per requested access. */
const roster = (seats: number) =>
  Array.from({ length: seats }, (_, index) => `Participante ${index + 1}`);

describe("inquiry schemas", () => {
  it("pins the approved privacy notice version", () => {
    expect(INQUIRY_CONSENT_VERSION).toBe("2026-08-26");
  });

  it.each([2, 10, 45])(
    "accepts a corporate inquiry with %i seats",
    (requestedSeats) => {
    const result = corporateInquirySchema.safeParse({
      ...COMMON,
      kind: "corporate",
      firstName: " Ada ",
      lastName: " Lovelace ",
      role: " Security   Director ",
      requestedSeats,
      attendees: roster(requestedSeats),
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("contact@example.com");
      expect(result.data.company).toBe("Example Logistics");
      expect(result.data.requestedSeats).toBe(requestedSeats);
      expect(result.data.attendees).toHaveLength(requestedSeats);
    }
    },
  );

  it("requires exactly one named participant per access", () => {
    const base = {
      ...COMMON,
      kind: "corporate" as const,
      firstName: "Ada",
      lastName: "Lovelace",
      role: "Director",
      requestedSeats: 4,
    };
    expect(
      corporateInquirySchema.safeParse({ ...base, attendees: roster(3) }).success,
    ).toBe(false);
    expect(
      corporateInquirySchema.safeParse({ ...base, attendees: roster(5) }).success,
    ).toBe(false);
    expect(
      corporateInquirySchema.safeParse({
        ...base,
        attendees: ["Ada Lovelace", "  ", "Alan Turing", "Grace Hopper"],
      }).success,
    ).toBe(false);
  });

  it.each([1, 201, 2.5])(
    "rejects an invalid corporate seat count: %s",
    (requestedSeats) => {
      expect(
        corporateInquirySchema.safeParse({
          ...COMMON,
          kind: "corporate",
          firstName: "Ada",
          lastName: "Lovelace",
          role: "Director",
          requestedSeats,
          attendees: roster(Math.max(2, Math.trunc(requestedSeats))),
        }).success,
      ).toBe(false);
    },
  );

  it("enforces the database's combined contact-name limit", () => {
    const base = {
      ...COMMON,
      kind: "corporate" as const,
      role: "Director",
      requestedSeats: 4,
      attendees: roster(4),
    };
    expect(
      corporateInquirySchema.safeParse({
        ...base,
        firstName: "a".repeat(80),
        lastName: "b".repeat(79),
      }).success,
    ).toBe(true);
    expect(
      corporateInquirySchema.safeParse({
        ...base,
        firstName: "a".repeat(80),
        lastName: "b".repeat(80),
      }).success,
    ).toBe(false);
  });

  it("accepts a sponsor inquiry at its text boundaries", () => {
    expect(
      sponsorInquirySchema.safeParse({
        ...COMMON,
        kind: "sponsor",
        name: "Grace Hopper",
        interest: "x".repeat(10),
      }).success,
    ).toBe(true);
    expect(
      sponsorInquirySchema.safeParse({
        ...COMMON,
        kind: "sponsor",
        name: "Grace Hopper",
        interest: "x".repeat(1200),
      }).success,
    ).toBe(true);
  });

  it("rejects cross-kind fields", () => {
    expect(
      corporateInquirySchema.safeParse({
        ...COMMON,
        kind: "corporate",
        firstName: "Ada",
        lastName: "Lovelace",
        role: "Director",
        requestedSeats: 4,
        attendees: roster(4),
        interest: "I should not be here",
      }).success,
    ).toBe(false);
    expect(
      sponsorInquirySchema.safeParse({
        ...COMMON,
        kind: "sponsor",
        name: "Grace Hopper",
        interest: "Sponsor package information",
        requestedSeats: 4,
      }).success,
    ).toBe(false);
  });

  it("rejects stale or forged consent versions", () => {
    expect(
      sponsorInquirySchema.safeParse({
        ...COMMON,
        consentVersion: "old-version",
        kind: "sponsor",
        name: "Grace Hopper",
        interest: "Sponsor package information",
      }).success,
    ).toBe(false);
  });
});

describe("attributionSchema", () => {
  it("accepts bounded attribution and blank optional values", () => {
    const result = attributionSchema.safeParse({
      utm_source: "linkedin",
      utm_medium: "",
      landing_page: "/?utm_source=linkedin",
      referrer: "https://partner.example/path?email=ada@example.com",
      first_touch_timestamp: "2026-07-01T10:00:00.000Z",
      last_touch_timestamp: "2026-07-02T10:00:00.000Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.utm_medium).toBeUndefined();
      expect(result.data.landing_page).toBe("/");
      expect(result.data.referrer).toBe("https://partner.example");
    }
  });

  it("rejects reversed touch timestamps and oversized fields", () => {
    expect(
      attributionSchema.safeParse({
        first_touch_timestamp: "2026-07-02T10:00:00.000Z",
        last_touch_timestamp: "2026-07-01T10:00:00.000Z",
      }).success,
    ).toBe(false);
    expect(attributionSchema.safeParse({ utm_source: "x".repeat(513) }).success).toBe(false);
  });

  it("discards unsafe landing and referrer values", () => {
    const result = attributionSchema.parse({
      landing_page: "https://attacker.example/path?email=ada@example.com",
      referrer: "javascript:alert(1)",
    });
    expect(result.landing_page).toBeUndefined();
    expect(result.referrer).toBeUndefined();
  });
});

describe("parseInquiryFormData", () => {
  it("converts form strings, requested seats, and consented attribution", () => {
    const formData = new FormData();
    Object.entries({
      kind: "corporate",
      submissionId: COMMON.submissionId,
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ADA@EXAMPLE.COM",
      company: "Analytical Engines",
      role: "Director",
      phone: "+52 899 123 4567",
      requestedSeats: "7",
      language: "en",
      consentVersion: INQUIRY_CONSENT_VERSION,
      marketingConsent: "all",
      utm_source: "linkedin",
      first_touch_timestamp: "2026-07-01T10:00:00.000Z",
      last_touch_timestamp: "2026-07-01T10:00:00.000Z",
      gclid: "discarded-by-data-minimization",
    }).forEach(([key, value]) => formData.set(key, value));
    roster(7).forEach((name) => formData.append("attendees", ` ${name} `));

    const result = parseInquiryFormData(formData);
    expect(result.success).toBe(true);
    if (result.success && result.data.kind === "corporate") {
      expect(result.data.requestedSeats).toBe(7);
      expect(result.data.attendees).toEqual(roster(7));
      expect(result.data.attribution.utm_source).toBe("linkedin");
      expect("gclid" in result.data.attribution).toBe(false);
    }
  });

  it.each([undefined, "essential", "forged-value"])(
    "discards attribution when marketing consent is %s",
    (marketingConsent) => {
      const formData = new FormData();
      Object.entries({
        kind: "sponsor",
        submissionId: COMMON.submissionId,
        name: "Grace Hopper",
        email: "grace@example.com",
        company: "Example Logistics",
        phone: "+52 899 123 4567",
        interest: "Sponsor package information",
        language: "es",
        consentVersion: INQUIRY_CONSENT_VERSION,
        utm_source: "hostile-hidden-field",
        referrer: "https://attacker.example/private",
      }).forEach(([key, value]) => formData.set(key, value));
      if (marketingConsent) {
        formData.set("marketingConsent", marketingConsent);
      }

      const result = parseInquiryFormData(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.attribution).toEqual({});
      }
    },
  );

  it("rejects an unknown inquiry kind", () => {
    const formData = new FormData();
    formData.set("kind", "unknown");
    expect(parseInquiryFormData(formData).success).toBe(false);
  });
});
