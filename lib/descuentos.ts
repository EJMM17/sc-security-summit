// ─── Códigos de descuento — lógica pura ──────────────────────────────────────
// El cálculo vive aquí (sin I/O) para poder probarlo de forma aislada.
// La redención con control de concurrencia ocurre en la función SQL
// `redimir_codigo` (migración 011); este módulo solo normaliza y calcula.

export const CODIGO_DESCUENTO_REGEX = /^[A-Z0-9_-]{4,32}$/;

export type TipoDescuento = "porcentaje" | "monto_fijo";

export type DescuentoAplicado = {
  /** Descuento en MXN enteros, ya topado al precio de lista. */
  descuento: number;
  /** Lo que se cobra: precio de lista − descuento (nunca negativo). */
  montoFinal: number;
};

/**
 * Normaliza la entrada del usuario a un código canónico (mayúsculas, sin
 * espacios). Devuelve null si tras normalizar no cumple el formato — el
 * caller debe tratarlo como "código no válido" sin consultar la BD.
 */
export function normalizarCodigo(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const codigo = raw.trim().toUpperCase();
  if (!CODIGO_DESCUENTO_REGEX.test(codigo)) return null;
  return codigo;
}

/**
 * Calcula el descuento en MXN enteros para un precio de lista.
 * - porcentaje: redondeo half-up sobre el precio (valor 1–100).
 * - monto_fijo: se topa al precio de lista (nunca cobra negativo).
 * Valores no positivos o no finitos ⇒ descuento 0 (defensivo: la BD ya
 * los rechaza con CHECKs, pero este módulo no confía en su caller).
 */
export function calcularDescuento(
  tipo: TipoDescuento,
  valor: number,
  precioLista: number,
): number {
  if (!Number.isFinite(valor) || valor <= 0) return 0;
  if (!Number.isFinite(precioLista) || precioLista <= 0) return 0;

  const bruto =
    tipo === "porcentaje"
      ? Math.round((Math.min(valor, 100) / 100) * precioLista)
      : Math.round(valor);

  return Math.min(bruto, precioLista);
}

export function aplicarDescuento(
  precioLista: number,
  tipo: TipoDescuento,
  valor: number,
): DescuentoAplicado {
  const descuento = calcularDescuento(tipo, valor, precioLista);
  return { descuento, montoFinal: precioLista - descuento };
}
