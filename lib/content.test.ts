import { describe, expect, it } from "vitest";
import { BASE_URL, CONTENT, PRECIOS } from "./content";

describe("content SSOT", () => {
  it("exports the canonical base URL and pricing", () => {
    expect(BASE_URL).toBe("https://www.scsecuritysummit.com");
    expect(PRECIOS).toStrictEqual({
      estudiante: 1200,
      general: 5800,
      vip: 7200,
    });
  });

  it("preserves the live speaker copy from app/page.tsx", () => {
    expect(CONTENT.es.speakers[0]).toMatchObject({
      name: "Fidel Guerrero",
      role: "Subdirector, Comité Nacional de Aduanas y Comercio Exterior",
      topic: "Aduanas & Comercio Exterior",
      image: "/images/speaker-fidel.webp",
    });
  });
});
