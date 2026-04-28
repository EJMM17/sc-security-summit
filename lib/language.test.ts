import { describe, expect, it } from "vitest";
import { resolveRequestLanguage } from "./language";

describe("resolveRequestLanguage", () => {
  it("prefers an explicit search param over cookie and header", () => {
    expect(resolveRequestLanguage("en", "es", "es-MX,es;q=0.9")).toBe("en");
  });

  it("falls back to the cookie when there is no search param", () => {
    expect(resolveRequestLanguage(null, "en", "es-MX,es;q=0.9")).toBe("en");
  });

  it("falls back to the accept-language header when cookie is missing", () => {
    expect(resolveRequestLanguage(null, undefined, "en-US,en;q=0.8")).toBe("en");
    expect(resolveRequestLanguage(null, undefined, "es-MX,es;q=0.9")).toBe("es");
  });

  it("defaults to Spanish when nothing matches", () => {
    expect(resolveRequestLanguage(null, undefined, null)).toBe("es");
  });
});
