import { describe, expect, it } from "vitest";
import {
  deserializeRegistroFlashState,
  serializeRegistroFlashState,
} from "./registro-form-state";

describe("registro form flash state", () => {
  it("round-trips success state with folio", () => {
    const encoded = serializeRegistroFlashState({
      success: true,
      message: "Registro completado.",
      folio: "SCSS2026-ABCDE-1234",
    });

    expect(deserializeRegistroFlashState(encoded)).toEqual({
      success: true,
      message: "Registro completado.",
      folio: "SCSS2026-ABCDE-1234",
    });
  });

  it("round-trips field errors and persisted values", () => {
    const encoded = serializeRegistroFlashState({
      success: false,
      message: "Corrige el formulario.",
      errors: {
        email: ["Correo inválido."],
        rfc: ["RFC inválido."],
      },
      values: {
        nombre: "María",
        email: "correo-invalido",
        requiere_cfdi: true,
        rfc: "X",
      },
    });

    expect(deserializeRegistroFlashState(encoded)).toEqual({
      success: false,
      message: "Corrige el formulario.",
      errors: {
        email: ["Correo inválido."],
        rfc: ["RFC inválido."],
      },
      values: {
        nombre: "María",
        email: "correo-invalido",
        requiere_cfdi: true,
        rfc: "X",
      },
    });
  });

  it("returns null for malformed payloads", () => {
    expect(deserializeRegistroFlashState("not-json")).toBeNull();
  });
});
