import { describe, expect, it } from "vitest";
import { PRECIOS, RegistroSchema } from "./schemas";

const validBase = {
  nombre: "María",
  apellido: "González López",
  email: "maria@empresa.com",
  empresa: "Empresa SA",
  cargo: "Director",
  tipo_acceso: "general" as const,
  acepta_terminos: true,
  // Zod's optional + or-literal-empty convention
  telefono: "",
  rfc: "",
  razon_social: "",
  codigo_postal_fiscal: "",
};

describe("PRECIOS", () => {
  it("matches the DB CHECK constraint exactly", () => {
    // Migration 006_capacity_and_price_update.sql enforces these prices at the
    // DB level. If these change here, the DB CHECK must be updated in the same PR.
    expect(PRECIOS).toStrictEqual({
      estudiante: 850,
      general: 2500,
      vip: 4800,
    });
  });
});

describe("RegistroSchema — happy paths", () => {
  it.each(["estudiante", "general", "vip"] as const)(
    "accepts a complete %s registration without CFDI",
    (tier) => {
      const result = RegistroSchema.safeParse({ ...validBase, tipo_acceso: tier });
      expect(result.success).toBe(true);
    },
  );

  it("accepts a registration with full CFDI block", () => {
    const result = RegistroSchema.safeParse({
      ...validBase,
      requiere_cfdi: true,
      rfc: "GOML850315ABC",
      razon_social: "Grupo Logística Móvil S.A. de C.V.",
      codigo_postal_fiscal: "88500",
    });
    expect(result.success).toBe(true);
  });
});

describe("RegistroSchema — base field validation", () => {
  it("rejects an invalid email", () => {
    const result = RegistroSchema.safeParse({ ...validBase, email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toBeDefined();
    }
  });

  it("rejects too-short nombre", () => {
    const result = RegistroSchema.safeParse({ ...validBase, nombre: "M" });
    expect(result.success).toBe(false);
  });

  it("rejects nombre with digits", () => {
    const result = RegistroSchema.safeParse({ ...validBase, nombre: "Maria3" });
    expect(result.success).toBe(false);
  });

  it("requires acepta_terminos to be true", () => {
    const result = RegistroSchema.safeParse({ ...validBase, acepta_terminos: false });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid phone number", () => {
    const result = RegistroSchema.safeParse({ ...validBase, telefono: "abc" });
    expect(result.success).toBe(false);
  });

  it("accepts an empty telefono (optional)", () => {
    const result = RegistroSchema.safeParse({ ...validBase, telefono: "" });
    expect(result.success).toBe(true);
  });
});

describe("RegistroSchema — CFDI conditional validation", () => {
  it("requires RFC when requiere_cfdi is true", () => {
    const result = RegistroSchema.safeParse({
      ...validBase,
      requiere_cfdi: true,
      rfc: "",
      razon_social: "Empresa SA",
      codigo_postal_fiscal: "88500",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.rfc).toBeDefined();
    }
  });

  it("requires razon_social when requiere_cfdi is true", () => {
    const result = RegistroSchema.safeParse({
      ...validBase,
      requiere_cfdi: true,
      rfc: "GOML850315ABC",
      razon_social: "",
      codigo_postal_fiscal: "88500",
    });
    expect(result.success).toBe(false);
  });

  it("rejects CP shorter than 5 digits", () => {
    const result = RegistroSchema.safeParse({
      ...validBase,
      requiere_cfdi: true,
      rfc: "GOML850315ABC",
      razon_social: "Empresa SA",
      codigo_postal_fiscal: "8850",
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed RFC", () => {
    const result = RegistroSchema.safeParse({
      ...validBase,
      requiere_cfdi: true,
      rfc: "ABC123",
      razon_social: "Empresa SA",
      codigo_postal_fiscal: "88500",
    });
    expect(result.success).toBe(false);
  });

  it("uppercases and trims RFC via transform", () => {
    const result = RegistroSchema.safeParse({
      ...validBase,
      requiere_cfdi: true,
      rfc: "  goml850315abc  ",
      razon_social: "Empresa SA",
      codigo_postal_fiscal: "88500",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rfc).toBe("GOML850315ABC");
    }
  });

  it("does not require CFDI fields when requiere_cfdi is false", () => {
    const result = RegistroSchema.safeParse({
      ...validBase,
      requiere_cfdi: false,
      rfc: "",
      razon_social: "",
      codigo_postal_fiscal: "",
    });
    expect(result.success).toBe(true);
  });
});
