// =============================================================
// PII scrubber for Sentry events
// =============================================================
// Strips email, RFC, telephone numbers, and obvious passwords from any
// stringifiable payload before Sentry sends it. Used by both the client
// and server SDK init via beforeSend / beforeBreadcrumb.
//
// We err on the side of over-redaction: it's better to lose a debug
// signal than to ship an LFPDPPP-protected attendee email to a third
// party. The redactions are visible in Sentry as [REDACTED:reason] so
// engineers know data was here without exposing it.
// =============================================================

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// Mexican RFC: 3-4 alpha (org or natural person), 6 digits (DOB), 3 alphanum (homoclave).
const RFC_RE = /\b[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}\b/g;
// Phone numbers — international, with optional + and 7-15 digits with separators.
const PHONE_RE = /(?:\+?\d[\s\-().]?){7,15}/g;
// Common credit-card patterns (PAN). Not perfect Luhn but enough as a heuristic.
const CARD_RE = /\b(?:\d[ -]?){13,19}\b/g;

const PII_FIELDS = new Set([
  "email",
  "rfc",
  "telefono",
  "phone",
  "razon_social",
  "codigo_postal_fiscal",
  "ip",
  "ip_registro",
  "user_agent",
  "password",
  "authorization",
  "cookie",
  "set-cookie",
  "x-forwarded-for",
]);

export function scrubString(value: string): string {
  return value
    .replace(EMAIL_RE, "[REDACTED:email]")
    .replace(RFC_RE, "[REDACTED:rfc]")
    .replace(CARD_RE, "[REDACTED:card]")
    .replace(PHONE_RE, "[REDACTED:phone]");
}

export function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[TRUNCATED:depth]";
  if (typeof value === "string") return scrubString(value);
  if (Array.isArray(value)) return value.map((v) => scrubValue(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (PII_FIELDS.has(k.toLowerCase())) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = scrubValue(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}
