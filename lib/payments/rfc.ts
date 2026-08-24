import type { TaxPersonType } from "@/lib/payments/sat-catalogs";

/**
 * RFC (Registro Federal de Contribuyentes) normalization and validation.
 *
 * The site does not stamp the CFDI, but it does capture the fiscal data, so a
 * malformed RFC has to be rejected at the boundary. Catching it here is the
 * difference between the buyer fixing a typo while they still remember the
 * order and the invoicing team chasing them 72 hours later.
 *
 * Structure:
 *   persona moral  — 3 letters + YYMMDD + 3 homoclave characters (12)
 *   persona física — 4 letters + YYMMDD + 3 homoclave characters (13)
 */

const MORAL_PATTERN = /^[A-ZÑ&]{3}[0-9]{6}[A-Z0-9]{3}$/;
const FISICA_PATTERN = /^[A-ZÑ&]{4}[0-9]{6}[A-Z0-9]{3}$/;

/** RFC for "público en general"; a buyer asking for a CFDI cannot use it. */
export const RFC_PUBLICO_EN_GENERAL = "XAXX010101000";

/** RFC for foreign residents; legitimate on a CFDI, so it stays allowed. */
export const RFC_RESIDENTE_EXTRANJERO = "XEXX010101000";

export type RfcValidation =
  | { valid: true; rfc: string; personType: TaxPersonType }
  | { valid: false; reason: RfcRejectionReason };

export type RfcRejectionReason =
  | "empty"
  | "length"
  | "format"
  | "date"
  | "generic";

/**
 * Uppercases and strips the separators people habitually type (spaces, hyphens
 * and the dashes copied out of SAT documents) without touching Ñ or &.
 */
export function normalizeRfc(value: string): string {
  return value
    .normalize("NFC")
    .toUpperCase()
    .replace(/[\s\-.‐-―]/g, "");
}

function hasValidDateSegment(rfc: string, offset: number): boolean {
  const month = Number(rfc.slice(offset + 2, offset + 4));
  const day = Number(rfc.slice(offset + 4, offset + 6));

  if (month < 1 || month > 12 || day < 1) return false;

  // The century encoded in an RFC is ambiguous (a '04' year could be 1904 or
  // 2004), so February is always allowed 29 days. Rejecting a real
  // 29-February RFC would be worse than accepting an impossible one.
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1];
}

export function validateRfc(value: string): RfcValidation {
  const rfc = normalizeRfc(value ?? "");

  if (rfc.length === 0) return { valid: false, reason: "empty" };
  if (rfc.length !== 12 && rfc.length !== 13) {
    return { valid: false, reason: "length" };
  }

  const personType: TaxPersonType = rfc.length === 12 ? "moral" : "fisica";
  const pattern = personType === "moral" ? MORAL_PATTERN : FISICA_PATTERN;

  if (!pattern.test(rfc)) return { valid: false, reason: "format" };

  const dateOffset = personType === "moral" ? 3 : 4;
  if (!hasValidDateSegment(rfc, dateOffset)) {
    return { valid: false, reason: "date" };
  }

  if (rfc === RFC_PUBLICO_EN_GENERAL) {
    return { valid: false, reason: "generic" };
  }

  return { valid: true, rfc, personType };
}

export function isValidRfc(value: string): boolean {
  return validateRfc(value).valid;
}

/** Mexican postal codes are exactly five digits and 00000 is not assigned. */
export function isValidPostalCode(value: string): boolean {
  const trimmed = value.trim();
  return /^[0-9]{5}$/.test(trimmed) && trimmed !== "00000";
}

/**
 * Masks an RFC for logs and operational events. The homoclave and the birth or
 * incorporation date are the identifying parts, so only the alphabetic prefix
 * and the length survive.
 */
export function maskRfc(value: string): string {
  const rfc = normalizeRfc(value ?? "");
  if (rfc.length !== 12 && rfc.length !== 13) return "invalid";
  const prefixLength = rfc.length === 12 ? 3 : 4;
  return `${rfc.slice(0, prefixLength)}${"*".repeat(rfc.length - prefixLength)}`;
}
