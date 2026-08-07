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
      role: "Directora del SC Security Summit, 100 Mujeres del Transporte y Logística 2026",
      topic: "Cultura de Seguridad",
      image: "/images/speaker-sandra-4k.webp",
    });
    expect(CONTENT.es.speakers.every((speaker) => speaker.headline && speaker.description)).toBe(
      true,
    );
  });

  it("publishes the three requested access tiers and agenda blocks", () => {
    expect(CONTENT.es.pricing.map(({ id, priceValue }) => ({ id, priceValue }))).toStrictEqual([
      { id: "plus", priceValue: 2500 },
      { id: "general", priceValue: 900 },
      { id: "estudiante", priceValue: 650 },
    ]);
    expect(CONTENT.es.agenda).toHaveLength(4);
  });

  it("keeps the complete inquiry UI contract in both languages", () => {
    for (const language of ["es", "en"] as const) {
      expect(CONTENT[language].forms.corporate.requestedSeats).toBeTruthy();
      expect(CONTENT[language].ui.inquiryInvalid).toBeTruthy();
      expect(CONTENT[language].ui.inquiryRateLimited).toBeTruthy();
      expect(CONTENT[language].ui.inquiryError).toBeTruthy();
      expect(CONTENT[language].ui.inquiryPrivacy).toBeTruthy();
      expect(CONTENT[language].ui.inquiryPrivacyLink).toBeTruthy();
      expect(CONTENT[language].ui.inquiryPreviewDisabled).toBeTruthy();
      expect(CONTENT[language].ui.inquiryPreviewDisabledButton).toBeTruthy();
    }
  });

  it("keeps the FAQ free of the retired registration flow", () => {
    // Ticketing lives in Eventbrite: no on-site form, no folio, no bank transfer.
    const retired = /folio|formulario de registro|transferencia bancaria|confirmation code|bank transfer/i;
    for (const language of ["es", "en"] as const) {
      for (const { question, answer } of CONTENT[language].faq) {
        expect(`${question} ${answer}`).not.toMatch(retired);
      }
    }
  });

  it("describes all three access tiers in the FAQ", () => {
    const accessAnswer = CONTENT.es.faq.find((item) =>
      item.question.includes("¿Qué incluye cada tipo de acceso?"),
    )?.answer;
    expect(accessAnswer).toBeDefined();
    for (const tier of ["Estudiante", "General", "Plus"]) {
      expect(accessAnswer).toContain(tier);
    }
    // The VIP tier was retired: the FAQ must not advertise a pass that no
    // longer exists in PRICING.
    expect(accessAnswer).not.toContain("VIP");
  });
});
