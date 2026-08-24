import { z } from "zod";
import { MARKETING_CONSENT_FORM_FIELD } from "@/lib/consent";
import { INQUIRY_CONSENT_VERSION } from "@/lib/inquiries/constants";
import { attributionSchema } from "@/lib/inquiries/schema";
import { TICKET_TIER_IDS, TICKET_TIERS, type TicketTierId } from "@/lib/payments/catalog";
import { isValidPostalCode, normalizeRfc, validateRfc } from "@/lib/payments/rfc";
import {
  isCfdiUseValidForPersonType,
  isRegimeValidForPersonType,
  CFDI_USE_CODES,
  TAX_REGIME_CODES,
} from "@/lib/payments/sat-catalogs";

const normalizedText = (minimum: number, maximum: number) =>
  z
    .string()
    .trim()
    .min(minimum)
    .max(maximum)
    .transform((value) => value.replace(/\s+/g, " "));

/**
 * Fiscal data is collected only when the buyer asks for a CFDI, and it is
 * stored in its own table so an order without an invoice request carries no
 * tax identifiers at all.
 */
export const invoiceDetailsSchema = z
  .object({
    rfc: z
      .string()
      .trim()
      .min(12)
      .max(20)
      .transform(normalizeRfc)
      .superRefine((value, context) => {
        const result = validateRfc(value);
        if (!result.valid) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `rfc_${result.reason}`,
          });
        }
      }),
    legalName: normalizedText(3, 254),
    taxRegime: z.enum(TAX_REGIME_CODES as [string, ...string[]]),
    cfdiUse: z.enum(CFDI_USE_CODES as [string, ...string[]]),
    postalCode: z
      .string()
      .trim()
      .refine(isValidPostalCode, { message: "postal_code_invalid" }),
    billingEmail: z
      .string()
      .trim()
      .email()
      .max(255)
      .transform((value) => value.toLowerCase())
      .optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const rfc = validateRfc(value.rfc);
    if (!rfc.valid) return;

    if (!isRegimeValidForPersonType(value.taxRegime, rfc.personType)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["taxRegime"],
        message: "tax_regime_person_type_mismatch",
      });
    }

    if (!isCfdiUseValidForPersonType(value.cfdiUse, rfc.personType)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cfdiUse"],
        message: "cfdi_use_person_type_mismatch",
      });
    }
  });

const ticketCheckoutObject = z
  .object({
    submissionId: z.string().uuid(),
    tier: z.enum(TICKET_TIER_IDS),
    quantity: z.coerce.number().int().min(1).max(10),
    firstName: normalizedText(2, 80),
    lastName: normalizedText(2, 80),
    email: z
      .string()
      .trim()
      .email()
      .max(255)
      .transform((value) => value.toLowerCase()),
    phone: normalizedText(7, 30),
    company: normalizedText(2, 160).optional(),
    language: z.enum(["es", "en"]),
    consentVersion: z.literal(INQUIRY_CONSENT_VERSION),
    requiresInvoice: z.boolean(),
    invoice: invoiceDetailsSchema.optional(),
    attribution: attributionSchema,
  })
  .strict();

export const ticketCheckoutSchema = ticketCheckoutObject.superRefine(
  (value, context) => {
    if (value.requiresInvoice && !value.invoice) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["invoice"],
        message: "invoice_details_required",
      });
    }

    // An order that does not request a CFDI must not smuggle fiscal data in.
    if (!value.requiresInvoice && value.invoice) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["invoice"],
        message: "invoice_details_not_requested",
      });
    }

    if (`${value.firstName} ${value.lastName}`.length > 160) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lastName"],
        message: "Combined buyer name cannot exceed 160 characters",
      });
    }

    const maxQuantity = TICKET_TIERS[value.tier as TicketTierId].maxQuantity;
    if (value.quantity > maxQuantity) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quantity"],
        message: "quantity_exceeds_tier_limit",
      });
    }
  },
);

export type InvoiceDetails = z.infer<typeof invoiceDetailsSchema>;
export type TicketCheckout = z.infer<typeof ticketCheckoutSchema>;

const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "landing_page",
  "referrer",
  "first_touch_timestamp",
  "last_touch_timestamp",
] as const;

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function formAttribution(formData: FormData): Record<string, string> {
  // Same fail-closed rule as the inquiry forms: attribution is discarded
  // unless the browser submits an explicit `all` marketing-consent decision.
  if (formString(formData, MARKETING_CONSENT_FORM_FIELD) !== "all") {
    return Object.fromEntries(ATTRIBUTION_KEYS.map((key) => [key, ""]));
  }
  return Object.fromEntries(
    ATTRIBUTION_KEYS.map((key) => [key, formString(formData, key)]),
  );
}

function optionalFormString(formData: FormData, key: string): string | undefined {
  const value = formString(formData, key).trim();
  return value === "" ? undefined : value;
}

export function parseTicketCheckoutFormData(
  formData: FormData,
): z.SafeParseReturnType<unknown, TicketCheckout> {
  const requiresInvoice = formString(formData, "requiresInvoice") === "on";

  return ticketCheckoutSchema.safeParse({
    submissionId: formString(formData, "submissionId"),
    tier: formString(formData, "tier"),
    quantity: formString(formData, "quantity"),
    firstName: formString(formData, "firstName"),
    lastName: formString(formData, "lastName"),
    email: formString(formData, "email"),
    phone: formString(formData, "phone"),
    company: optionalFormString(formData, "company"),
    language: formString(formData, "language"),
    consentVersion: formString(formData, "consentVersion"),
    requiresInvoice,
    invoice: requiresInvoice
      ? {
          rfc: formString(formData, "rfc"),
          legalName: formString(formData, "legalName"),
          taxRegime: formString(formData, "taxRegime"),
          cfdiUse: formString(formData, "cfdiUse"),
          postalCode: formString(formData, "postalCode"),
          billingEmail: optionalFormString(formData, "billingEmail"),
        }
      : undefined,
    attribution: formAttribution(formData),
  });
}
