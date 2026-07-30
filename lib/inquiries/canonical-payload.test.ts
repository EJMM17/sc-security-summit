import { describe, expect, it } from "vitest";
import { hashInquiryPayload } from "@/lib/inquiries/canonical-payload";
import { INQUIRY_CONSENT_VERSION } from "@/lib/inquiries/constants";
import type { CorporateInquiry } from "@/lib/inquiries/schema";
import { sponsorInquiryFixture } from "@/tests/inquiry-fixtures";

const INQUIRY: CorporateInquiry = {
  kind: "corporate",
  submissionId: "f5fb8f1c-18ba-4f7d-9d9a-12378a2ac4c5",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  company: "Analytical Engines",
  role: "Director",
  phone: "+52 899 123 4567",
  requestedSeats: 4,
  language: "es",
  consentVersion: INQUIRY_CONSENT_VERSION,
  attribution: {
    utm_source: "linkedin",
    first_touch_timestamp: "2026-07-01T10:00:00.000Z",
  },
};

describe("hashInquiryPayload", () => {
  it("is deterministic and produces a 32-byte hexadecimal digest", () => {
    const hash = hashInquiryPayload(INQUIRY);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashInquiryPayload({ ...INQUIRY })).toBe(hash);
  });

  it("does not collide a changed business payload", () => {
    expect(hashInquiryPayload({ ...INQUIRY, requestedSeats: 5 })).not.toBe(
      hashInquiryPayload(INQUIRY),
    );
  });

  it("treats attribution timestamp changes as the same retry", () => {
    expect(
      hashInquiryPayload({
        ...INQUIRY,
        attribution: {
          utm_source: "google",
          first_touch_timestamp: "2026-07-02T10:00:00.000Z",
        },
      }),
    ).toBe(hashInquiryPayload(INQUIRY));
  });

  it("hashes the sponsor-specific payload", () => {
    const hash = hashInquiryPayload(sponsorInquiryFixture);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(
      hashInquiryPayload({
        ...sponsorInquiryFixture,
        interest: `${sponsorInquiryFixture.interest} Updated`,
      }),
    ).not.toBe(hash);
  });
});
