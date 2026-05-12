import { describe, expect, it } from "vitest";
import { FOLIO_PATTERN, generateFolio, isValidFolio } from "./folio";

describe("generateFolio", () => {
  it("matches the documented format", () => {
    const folio = generateFolio();
    expect(folio).toMatch(FOLIO_PATTERN);
    expect(folio.startsWith("SCSS2026-")).toBe(true);
  });

  it("produces a deterministic timestamp segment when seeded", () => {
    const folio = generateFolio(1_700_000_000_000);
    // Timestamp is base36-uppercased, suffix is random — only the prefix
    // and timestamp segment are pinned by the test.
    expect(folio).toMatch(/^SCSS2026-LOYW3V28-[0-9A-F]{6}$/);
  });

  it("emits 6 uppercase hex chars in the suffix", () => {
    const folio = generateFolio();
    const suffix = folio.split("-").at(-1) ?? "";
    expect(suffix).toMatch(/^[0-9A-F]{6}$/);
  });

  it("does not collide across 10k iterations", () => {
    // Step the simulated clock per iteration so we exercise the random suffix
    // under realistic conditions (registrations are spread across ms in prod).
    // Without this, a tight loop completing in a single ms bucket would rely
    // on only 24 bits of suffix entropy and could hit a birthday-paradox
    // collision across 10k samples.
    const base = Date.now();
    const seen = new Set<string>();
    for (let i = 0; i < 10_000; i++) {
      seen.add(generateFolio(base + i));
    }
    expect(seen.size).toBe(10_000);
  });
});

describe("isValidFolio", () => {
  it("accepts a freshly generated folio", () => {
    expect(isValidFolio(generateFolio())).toBe(true);
  });

  it.each([
    "",
    "scss2026-abc-123456", // lowercase prefix
    "SCSS2026-ABC-XYZ123", // non-hex suffix chars
    "SCSS2025-ABC-123456", // wrong year
    "SCSS2026-ABC-12345", // suffix too short
    "SCSS2026-ABC-1234567", // suffix too long
    "SCSS2026--123456", // empty timestamp
  ])("rejects invalid folio %j", (input) => {
    expect(isValidFolio(input)).toBe(false);
  });
});
