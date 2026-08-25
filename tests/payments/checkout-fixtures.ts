import type { TicketCheckout } from "@/lib/payments/schema";
import { INQUIRY_CONSENT_VERSION } from "@/lib/inquiries/constants";

const emptyAttribution = {
  utm_source: undefined,
  utm_medium: undefined,
  utm_campaign: undefined,
  utm_term: undefined,
  utm_content: undefined,
  landing_page: undefined,
  referrer: undefined,
  first_touch_timestamp: undefined,
  last_touch_timestamp: undefined,
};

export const checkoutFixture: TicketCheckout = {
  submissionId: "1f1c9a2c-4e29-4f0a-9d0f-2a1f0f7b8c31",
  tier: "plus",
  quantity: 2,
  firstName: "María",
  lastName: "González López",
  email: "maria@empresa.com",
  phone: "+52 899 123 4567",
  company: "Logística del Norte",
  language: "es",
  consentVersion: INQUIRY_CONSENT_VERSION,
  requiresInvoice: false,
  invoice: undefined,
  attribution: emptyAttribution,
};

export const invoicedCheckoutFixture: TicketCheckout = {
  ...checkoutFixture,
  requiresInvoice: true,
  invoice: {
    rfc: "ABC800101XY2",
    legalName: "Logística del Norte SA de CV",
    taxRegime: "601",
    cfdiUse: "G03",
    postalCode: "88680",
    billingEmail: "facturacion@empresa.com",
  },
};

export const corporateCheckoutFixture: TicketCheckout = {
  ...checkoutFixture,
  submissionId: "6f7e5d4c-3b2a-4190-8f7e-5d4c3b2a1908",
  tier: "corporativo",
  quantity: 5,
  attendees: [
    "María González López",
    "Juan Pérez Ruiz",
    "Ana Ramírez Solís",
    "Luis Torres Vega",
    "Sofía Herrera Lima",
  ],
  referral: "Cámara de Comercio de Reynosa",
};

export function corporateCheckoutFormData(
  overrides: Record<string, string> = {},
  attendees: string[] = corporateCheckoutFixture.attendees ?? [],
): FormData {
  const formData = checkoutFormData({
    submissionId: corporateCheckoutFixture.submissionId,
    tier: "corporativo",
    quantity: String(attendees.length),
    referral: corporateCheckoutFixture.referral ?? "",
    ...overrides,
  });
  for (const name of attendees) formData.append("attendees", name);
  return formData;
}

export function checkoutFormData(
  overrides: Record<string, string> = {},
): FormData {
  const formData = new FormData();
  const base: Record<string, string> = {
    submissionId: checkoutFixture.submissionId,
    tier: "plus",
    quantity: "2",
    firstName: "María",
    lastName: "González López",
    email: "Maria@Empresa.com",
    phone: "+52 899 123 4567",
    company: "Logística del Norte",
    language: "es",
    consentVersion: INQUIRY_CONSENT_VERSION,
  };

  for (const [key, value] of Object.entries({ ...base, ...overrides })) {
    if (value === "") continue;
    formData.set(key, value);
  }
  return formData;
}
