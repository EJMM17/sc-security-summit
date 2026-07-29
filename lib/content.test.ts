import { describe, expect, it } from "vitest";
import { BASE_URL, CONTENT } from "./content";

describe("content SSOT", () => {
  it("exports the canonical base URL", () => {
    expect(BASE_URL).toBe("https://scsecuritysummit.com");
  });

  it("preserves the live speaker copy from app/page.tsx", () => {
    expect(CONTENT.es.speakers.find(s => s.name === "Isidoro Juárez")).toMatchObject({
      name: "Isidoro Juárez",
      role: "Mandatario Aduanal Certificado",
      topic: "Aduanas & Compliance",
      image: "/images/speaker-isidoro-4k.webp",
    });
  });

  it("includes Sandra Romero and the complete speaker carousel copy", () => {
    expect(CONTENT.es.speakers).toHaveLength(5);
    expect(CONTENT.es.speakers[0]).toMatchObject({
      name: "Sandra Romero",
      role: "Directora Lanz Logistics",
      topic: "Cultura de Seguridad",
      image: "/images/speaker-sandra-4k.webp",
    });
    expect(CONTENT.es.speakers.every((speaker) => speaker.headline && speaker.description)).toBe(
      true,
    );
  });

  it("publishes the four requested access tiers and agenda blocks", () => {
    expect(CONTENT.es.pricing.map(({ id, priceValue }) => ({ id, priceValue }))).toStrictEqual([
      { id: "vip", priceValue: 4800 },
      { id: "plus", priceValue: 2500 },
      { id: "general", priceValue: 900 },
      { id: "estudiante", priceValue: 650 },
    ]);
    expect(CONTENT.es.agenda).toHaveLength(4);
  });
});
