import { describe, expect, it } from "vitest";
import {
  aplicarDescuento,
  calcularDescuento,
  normalizarCodigo,
} from "./descuentos";

describe("normalizarCodigo", () => {
  it("acepta códigos válidos y los normaliza a mayúsculas", () => {
    expect(normalizarCodigo("verano-2026")).toBe("VERANO-2026");
    expect(normalizarCodigo("  vip_50  ")).toBe("VIP_50");
    expect(normalizarCodigo("ABCD")).toBe("ABCD");
  });

  it("rechaza formatos inválidos", () => {
    expect(normalizarCodigo("")).toBeNull();
    expect(normalizarCodigo("abc")).toBeNull(); // < 4 chars
    expect(normalizarCodigo("A".repeat(33))).toBeNull(); // > 32 chars
    expect(normalizarCodigo("CON ESPACIO")).toBeNull();
    expect(normalizarCodigo("acentó-si")).toBeNull();
    expect(normalizarCodigo("robert'); DROP")).toBeNull();
  });

  it("rechaza entradas que no son string", () => {
    expect(normalizarCodigo(null)).toBeNull();
    expect(normalizarCodigo(undefined)).toBeNull();
    expect(normalizarCodigo(1234)).toBeNull();
    expect(normalizarCodigo({})).toBeNull();
  });
});

describe("calcularDescuento", () => {
  it("porcentaje sobre el precio de lista", () => {
    expect(calcularDescuento("porcentaje", 20, 2500)).toBe(500);
    expect(calcularDescuento("porcentaje", 10, 850)).toBe(85);
    expect(calcularDescuento("porcentaje", 100, 4800)).toBe(4800);
  });

  it("redondea half-up los porcentajes no exactos", () => {
    // 15% de 850 = 127.5 → 128
    expect(calcularDescuento("porcentaje", 15, 850)).toBe(128);
    // 33% de 2500 = 825
    expect(calcularDescuento("porcentaje", 33, 2500)).toBe(825);
  });

  it("porcentaje mayor a 100 se topa al 100%", () => {
    expect(calcularDescuento("porcentaje", 150, 2500)).toBe(2500);
  });

  it("monto fijo directo y topado al precio", () => {
    expect(calcularDescuento("monto_fijo", 300, 2500)).toBe(300);
    expect(calcularDescuento("monto_fijo", 5000, 2500)).toBe(2500);
  });

  it("redondea montos fijos con decimales", () => {
    expect(calcularDescuento("monto_fijo", 299.5, 2500)).toBe(300);
  });

  it("valores no positivos o no finitos ⇒ 0", () => {
    expect(calcularDescuento("porcentaje", 0, 2500)).toBe(0);
    expect(calcularDescuento("monto_fijo", -100, 2500)).toBe(0);
    expect(calcularDescuento("porcentaje", NaN, 2500)).toBe(0);
    expect(calcularDescuento("porcentaje", Infinity, 2500)).toBe(0);
  });

  it("precio de lista inválido ⇒ 0", () => {
    expect(calcularDescuento("porcentaje", 20, 0)).toBe(0);
    expect(calcularDescuento("monto_fijo", 100, -1)).toBe(0);
    expect(calcularDescuento("porcentaje", 20, NaN)).toBe(0);
  });
});

describe("aplicarDescuento", () => {
  it("devuelve descuento y monto final consistentes", () => {
    expect(aplicarDescuento(2500, "porcentaje", 20)).toEqual({
      descuento: 500,
      montoFinal: 2000,
    });
    expect(aplicarDescuento(4800, "monto_fijo", 800)).toEqual({
      descuento: 800,
      montoFinal: 4000,
    });
  });

  it("descuento del 100% deja monto final en 0 (cortesía)", () => {
    expect(aplicarDescuento(850, "porcentaje", 100)).toEqual({
      descuento: 850,
      montoFinal: 0,
    });
  });

  it("nunca produce montos negativos", () => {
    const { descuento, montoFinal } = aplicarDescuento(850, "monto_fijo", 99999);
    expect(descuento).toBe(850);
    expect(montoFinal).toBe(0);
  });

  it("suma descuento + montoFinal = precio de lista (invariante del CHECK en BD)", () => {
    for (const precio of [850, 2500, 4800]) {
      for (const valor of [1, 15, 33, 50, 99, 100]) {
        const { descuento, montoFinal } = aplicarDescuento(precio, "porcentaje", valor);
        expect(descuento + montoFinal).toBe(precio);
      }
    }
  });
});
