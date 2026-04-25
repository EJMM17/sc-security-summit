import { randomBytes } from "node:crypto";

// =============================================================
// Folio number generation
// =============================================================
// Format: SCSS2026-{base36 ms timestamp uppercased}-{6 hex chars}
//
// Why this shape:
//   • SCSS2026 prefix lets organizers eyeball that a string is a folio
//     (vs an order ID or invoice number)
//   • base36 timestamp is monotonically increasing and short (~9 chars)
//   • 6 hex chars from CSPRNG = 24 bits of entropy. Combined with the
//     timestamp, collisions need both same ms AND same 24-bit suffix —
//     well below the DB's UNIQUE(folio) safety net.
// =============================================================

export const FOLIO_PATTERN = /^SCSS2026-[0-9A-Z]+-[0-9A-F]{6}$/;

export function generateFolio(now: number = Date.now()): string {
  const timestampPart = now.toString(36).toUpperCase();
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `SCSS2026-${timestampPart}-${suffix}`;
}

export function isValidFolio(folio: string): boolean {
  return FOLIO_PATTERN.test(folio);
}
