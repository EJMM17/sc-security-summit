import { describe, expect, it } from "vitest";
import {
  confirmationEmailHtml,
  confirmationEmailSubject,
  escapeHtml,
} from "@/lib/email-templates";

const BASE = {
  nombre: "Ana López",
  folio: "SCSS2026-ABC-123",
  tipo_acceso: "vip" as const,
  monto_mxn: 12000,
};

describe("escapeHtml", () => {
  it("escapes HTML-significant characters", () => {
    expect(escapeHtml(`<script>"&'`)).toBe("&lt;script&gt;&quot;&amp;&#39;");
  });
});

describe("confirmationEmailHtml", () => {
  for (const language of ["es", "en"] as const) {
    it(`includes folio, amount, tier and name (${language})`, () => {
      const html = confirmationEmailHtml({ ...BASE, language });
      expect(html).toContain(BASE.folio);
      expect(html).toContain("12,000");
      expect(html).toContain("VIP");
      expect(html).toContain("Ana López");
    });
  }

  it("escapes a malicious name to prevent HTML injection", () => {
    const html = confirmationEmailHtml({
      ...BASE,
      nombre: '<img src=x onerror="alert(1)">',
      language: "es",
    });
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x");
  });

  it("subject contains the folio in both languages", () => {
    expect(confirmationEmailSubject("es", BASE.folio)).toContain(BASE.folio);
    expect(confirmationEmailSubject("en", BASE.folio)).toContain(BASE.folio);
  });
});
