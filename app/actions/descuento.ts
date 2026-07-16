"use server";

import * as Sentry from "@sentry/nextjs";
import { PRECIOS } from "@/lib/content";
import { normalizarCodigo, aplicarDescuento, type TipoDescuento } from "@/lib/descuentos";

type TipoAcceso = "estudiante" | "general" | "vip";

export type DescuentoPreview =
  | {
      ok: true;
      codigo: string;
      /** Precio final por tier. Un tier ausente = el código no aplica a ese tier. */
      precios: Partial<Record<TipoAcceso, { descuento: number; montoFinal: number }>>;
    }
  | { ok: false; message: "invalid" | "rate_limited" };

/**
 * Preview de un código de descuento para mostrar el precio con descuento en
 * el formulario. Solo lectura — NO consume usos; la redención real (atómica)
 * ocurre en create-lead al enviar el registro.
 *
 * Anti-enumeración: una sola respuesta neutra ("invalid") sin distinguir
 * inexistente / vencido / agotado / no aplica, mismo patrón que
 * /recuperar-folio. Rate limit por IP separado del presupuesto de registro.
 */
export async function previewCodigoDescuento(raw: string): Promise<DescuentoPreview> {
  const codigo = normalizarCodigo(raw);
  if (!codigo) return { ok: false, message: "invalid" };

  const { checkRateLimit, getClientIp, RateLimitError } = await import("@/lib/rate-limit");
  try {
    await checkRateLimit(`descuento:${await getClientIp()}`);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { ok: false, message: "rate_limited" };
    }
    throw error;
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase");
    const { data, error } = await supabaseAdmin
      .from("codigos_descuento")
      .select("codigo,tipo_descuento,valor,aplica_a,max_usos,usos,valido_desde,valido_hasta")
      .eq("codigo", codigo)
      .eq("activo", true)
      .maybeSingle();

    if (error) throw new Error(`preview_codigo_failed:${error.code}:${error.message}`);
    if (!data) return { ok: false, message: "invalid" };

    const now = Date.now();
    if (new Date(data.valido_desde).getTime() > now) return { ok: false, message: "invalid" };
    if (data.valido_hasta && new Date(data.valido_hasta).getTime() < now) {
      return { ok: false, message: "invalid" };
    }
    if (data.max_usos !== null && data.usos >= data.max_usos) {
      return { ok: false, message: "invalid" };
    }

    const tiers = (data.aplica_a ?? Object.keys(PRECIOS)) as TipoAcceso[];
    const precios: Partial<Record<TipoAcceso, { descuento: number; montoFinal: number }>> = {};
    for (const tier of tiers) {
      precios[tier] = aplicarDescuento(
        PRECIOS[tier],
        data.tipo_descuento as TipoDescuento,
        Number(data.valor),
      );
    }

    return { ok: true, codigo, precios };
  } catch (error) {
    Sentry.captureException(error, { tags: { action: "preview_codigo_descuento" } });
    // Fail-safe: ante un error interno respondemos neutro; la redención real
    // en el submit volverá a validar.
    return { ok: false, message: "invalid" };
  }
}
