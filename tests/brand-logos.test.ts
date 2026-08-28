import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PRESENTERS, SPONSORS, type Presenter } from "@/lib/content";

/** The lineup renders a wordmark when a brand has no logo yet, so the only
 * broken-image risk left is a path that points at a file nobody shipped. */
const lineups: ReadonlyArray<readonly [string, readonly Presenter[]]> = [
  ["PRESENTERS", PRESENTERS],
  ["SPONSORS", SPONSORS],
];

describe("brand lineups", () => {
  it.each(lineups)("%s point at logos that exist in public/", (_name, brands) => {
    for (const brand of brands) {
      if (!brand.logo) continue;
      expect(brand.logo.startsWith("/images/")).toBe(true);
      expect(
        existsSync(path.join(process.cwd(), "public", brand.logo)),
        `${brand.name}: ${brand.logo}`,
      ).toBe(true);
    }
  });

  it("keeps every brand name unique across both lineups", () => {
    const names = [...PRESENTERS, ...SPONSORS].map((brand) => brand.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
