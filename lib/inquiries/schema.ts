import { z } from "zod";
import { MARKETING_CONSENT_FORM_FIELD } from "@/lib/consent";
import { INQUIRY_CONSENT_VERSION } from "@/lib/inquiries/constants";

const normalizedText = (minimum: number, maximum: number) =>
  z
    .string()
    .trim()
    .min(minimum)
    .max(maximum)
    .transform((value) => value.replace(/\s+/g, " "));

const optionalText = (maximum: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(maximum).optional(),
  );

const optionalTimestamp = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().datetime({ offset: true }).optional(),
);

const optionalLandingPath = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return undefined;
  try {
    return new URL(trimmed, "https://local.invalid").pathname.slice(0, 2048);
  } catch {
    return undefined;
  }
}, z.string().regex(/^\/[^?#\s]*$/).max(2048).optional());

const optionalReferrerOrigin = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  try {
    const url = new URL(value.trim());
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.origin === "null"
    ) {
      return undefined;
    }
    return url.origin.slice(0, 2048);
  } catch {
    return undefined;
  }
}, z.string().url().max(2048).optional());

export const attributionSchema = z
  .object({
    utm_source: optionalText(512),
    utm_medium: optionalText(512),
    utm_campaign: optionalText(512),
    utm_term: optionalText(512),
    utm_content: optionalText(512),
    landing_page: optionalLandingPath,
    referrer: optionalReferrerOrigin,
    first_touch_timestamp: optionalTimestamp,
    last_touch_timestamp: optionalTimestamp,
  })
  .superRefine((value, context) => {
    if (
      value.first_touch_timestamp &&
      value.last_touch_timestamp &&
      Date.parse(value.first_touch_timestamp) > Date.parse(value.last_touch_timestamp)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["last_touch_timestamp"],
        message: "Last touch cannot precede first touch",
      });
    }
  });

const commonShape = {
  submissionId: z.string().uuid(),
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  company: normalizedText(2, 160),
  phone: normalizedText(7, 30),
  language: z.enum(["es", "en"]),
  consentVersion: z.literal(INQUIRY_CONSENT_VERSION),
  attribution: attributionSchema,
};

function validateCombinedContactName(
  value: { firstName: string; lastName: string },
  context: z.RefinementCtx,
): void {
  if (`${value.firstName} ${value.lastName}`.length > 160) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["lastName"],
      message: "Combined contact name cannot exceed 160 characters",
    });
  }
}

const corporateInquiryObject = z
  .object({
    ...commonShape,
    kind: z.literal("corporate"),
    firstName: normalizedText(2, 80),
    lastName: normalizedText(2, 80),
    role: normalizedText(2, 120),
    requestedSeats: z.coerce.number().int().min(2).max(10),
  })
  .strict();

export const corporateInquirySchema =
  corporateInquiryObject.superRefine(validateCombinedContactName);

export const sponsorInquirySchema = z
  .object({
    ...commonShape,
    kind: z.literal("sponsor"),
    name: normalizedText(2, 120),
    interest: z.string().trim().min(10).max(1200),
  })
  .strict();

export const inquirySchema = z
  .discriminatedUnion("kind", [corporateInquiryObject, sponsorInquirySchema])
  .superRefine((value, context) => {
    if (value.kind === "corporate") validateCombinedContactName(value, context);
  });

export type Attribution = z.infer<typeof attributionSchema>;
export type CorporateInquiry = z.infer<typeof corporateInquirySchema>;
export type SponsorInquiry = z.infer<typeof sponsorInquirySchema>;
export type Inquiry = z.infer<typeof inquirySchema>;

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
  // Every FormData field is untrusted. Attribution fails closed unless the
  // browser submits its explicit marketing-consent decision alongside it.
  // The decision is transport evidence only; it is not persisted as inquiry
  // consent and does not replace the versioned privacy-notice acceptance.
  if (formString(formData, MARKETING_CONSENT_FORM_FIELD) !== "all") {
    return Object.fromEntries(ATTRIBUTION_KEYS.map((key) => [key, ""]));
  }

  return Object.fromEntries(
    ATTRIBUTION_KEYS.map((key) => [key, formString(formData, key)]),
  );
}

/**
 * Converts the public form contract to the normalized domain schema.
 * Unknown tracking identifiers are intentionally discarded because the
 * database follows a data-minimization policy.
 */
export function parseInquiryFormData(formData: FormData): z.SafeParseReturnType<unknown, Inquiry> {
  const kind = formString(formData, "kind");
  const common = {
    kind,
    submissionId: formString(formData, "submissionId"),
    email: formString(formData, "email"),
    company: formString(formData, "company"),
    phone: formString(formData, "phone"),
    language: formString(formData, "language"),
    consentVersion: formString(formData, "consentVersion"),
    attribution: formAttribution(formData),
  };

  const value =
    kind === "corporate"
      ? {
          ...common,
          firstName: formString(formData, "firstName"),
          lastName: formString(formData, "lastName"),
          role: formString(formData, "role"),
          requestedSeats: formString(formData, "requestedSeats"),
        }
      : kind === "sponsor"
        ? {
            ...common,
            name: formString(formData, "name"),
            interest: formString(formData, "interest"),
          }
        : common;

  return inquirySchema.safeParse(value);
}
