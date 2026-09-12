import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PRESENTERS,
  PRESENTING_BRANDS,
  SPONSORS,
  type Presenter,
} from "@/lib/content";

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

/** The lineup wraps into two, three or four columns depending on the
 * viewport, so two brands are visual neighbours — side by side, stacked or
 * diagonal — whenever their positions differ by at most the widest column
 * count. Keeping the two clinical laboratories further apart than that is a
 * layout requirement, not a preference: they must never read as one block. */
const WIDEST_COLUMN_COUNT = 4;

describe("presenting lineup order", () => {
  it("never places the two laboratories in the same neighbourhood", () => {
    const positions = ["Laboratorios Eloisa", "InnovaLab Laboratorio"].map(
      (name) => {
        const index = PRESENTING_BRANDS.findIndex(
          (brand) => brand.name === name,
        );
        expect(index, `${name} is missing from the lineup`).toBeGreaterThan(-1);
        return index;
      },
    );

    expect(Math.abs(positions[0] - positions[1])).toBeGreaterThan(
      WIDEST_COLUMN_COUNT,
    );
  });

  it("renders every brand exactly once, in one lineup", () => {
    expect(PRESENTING_BRANDS).toHaveLength(
      new Set(PRESENTING_BRANDS.map((brand) => brand.name)).size,
    );
    for (const brand of [...PRESENTERS, ...SPONSORS]) {
      expect(PRESENTING_BRANDS).toContain(brand);
    }
  });
});
