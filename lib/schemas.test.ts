import { describe, it, expect } from "vitest";
import { RegistroSchema, PRECIOS } from "./schemas";

describe("RegistroSchema", () => {
  const baseValid = {
    nombre: "María",
    apellido: "González",
    email: "maria@empresa.com",
    empresa: "ACME Maquila",
    cargo: "Director",
    tipo_acceso: "general" as const,
    acepta_terminos: true,
  };

  it("acepta datos válidos sin CFDI", () => {
    expect(RegistroSchema.safeParse(baseValid).success).toBe(true);
  });

  it("rechaza email inválido", () => {
    const r = RegistroSchema.safeParse({ ...baseValid, email: "not-an-email" });
    expect(r.success).toBe(false);
  });

  it("rechaza nombre con números", () => {
    const r = RegistroSchema.safeParse({ ...baseValid, nombre: "María123" });
    expect(r.success).toBe(false);
  });

  it("requiere CFDI completo si requiere_cfdi=true", () => {
    const r = RegistroSchema.safeParse({ ...baseValid, requiere_cfdi: true });
    expect(r.success).toBe(false);
  });

  it("acepta CFDI válido", () => {
    const r = RegistroSchema.safeParse({
      ...baseValid,
      requiere_cfdi: true,
      rfc: "XAXX010101000",
      razon_social: "ACME SA de CV",
      codigo_postal_fiscal: "88500",
    });
    expect(r.success).toBe(true);
  });

  it("rechaza RFC inválido", () => {
    const r = RegistroSchema.safeParse({
      ...baseValid,
      requiere_cfdi: true,
      rfc: "INVALIDO",
      razon_social: "ACME SA de CV",
      codigo_postal_fiscal: "88500",
    });
    expect(r.success).toBe(false);
  });

  it("rechaza código postal con letras", () => {
    const r = RegistroSchema.safeParse({
      ...baseValid,
      requiere_cfdi: true,
      rfc: "XAXX010101000",
      razon_social: "ACME SA de CV",
      codigo_postal_fiscal: "8850A",
    });
    expect(r.success).toBe(false);
  });

  it("requiere aceptar términos", () => {
    const r = RegistroSchema.safeParse({ ...baseValid, acepta_terminos: false });
    expect(r.success).toBe(false);
  });

  it("rechaza tipo_acceso inválido", () => {
    const r = RegistroSchema.safeParse({ ...baseValid, tipo_acceso: "premium" });
    expect(r.success).toBe(false);
  });
});

describe("PRECIOS", () => {
  it("corresponde a los tipos y montos correctos", () => {
    expect(PRECIOS.estudiante).toBe(1200);
    expect(PRECIOS.general).toBe(5800);
    expect(PRECIOS.vip).toBe(7200);
  });

  it("son números positivos", () => {
    for (const precio of Object.values(PRECIOS)) {
      expect(precio).toBeGreaterThan(0);
    }
  });
});
