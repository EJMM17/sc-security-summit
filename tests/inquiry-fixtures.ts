import { INQUIRY_CONSENT_VERSION } from "@/lib/inquiries/constants";
import type { CorporateInquiry, SponsorInquiry } from "@/lib/inquiries/schema";

export const corporateInquiryFixture: CorporateInquiry = {
  kind: "corporate",
  submissionId: "f5fb8f1c-18ba-4f7d-9d9a-12378a2ac4c5",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  company: "Analytical Engines",
  role: "Security Director",
  phone: "+52 899 123 4567",
  requestedSeats: 6,
  attendees: [
    "Ada Lovelace",
    "Grace Hopper",
    "Alan Turing",
    "Katherine Johnson",
    "Edsger Dijkstra",
    "Barbara Liskov",
  ],
  language: "es",
  consentVersion: INQUIRY_CONSENT_VERSION,
  attribution: {
    utm_source: "linkedin",
    landing_page: "/",
    first_touch_timestamp: "2026-07-01T10:00:00.000Z",
    last_touch_timestamp: "2026-07-01T10:00:00.000Z",
  },
};

export const sponsorInquiryFixture: SponsorInquiry = {
  kind: "sponsor",
  submissionId: "ea1358d1-b0cd-4f99-ae48-b3df545f40c8",
  name: "Grace Hopper",
  email: "grace@example.com",
  company: "Compilers Inc.",
  phone: "+52 899 765 4321",
  interest: "We would like information about the premium sponsorship package.",
  language: "en",
  consentVersion: INQUIRY_CONSENT_VERSION,
  attribution: {},
};

