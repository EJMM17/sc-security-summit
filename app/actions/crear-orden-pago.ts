"use server";

import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";

import { env } from "@/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { getConekta, warnConektaDisabled } from "@/lib/conekta";
import { supabaseAdmin } from "@/lib/supabase";

export type MetodoPago = "spei" | "tarjeta" | "oxxo" | "transferencia_manual";

export type CrearOrdenResult =
  | { ok: true; redirectUrl?: string }
  | { ok: false; message: string };

const ALLOWED_METODOS: ReadonlySet<MetodoPago> = new Set([
  "spei",
  "tarjeta",
  "oxxo",
  "transferencia_manual",
]);

function siteUrl(): string {
  return env.NEXT_PUBLIC_SITE_URL ?? "https://www.scsecuritysummit.com";
}

function pagoRedirect(folio: string, error?: string): never {
  const params = new URLSearchParams({ folio });
  if (error) params.set("error", error);
  redirect(`/pago?${params.toString()}`);
}

export async function crearOrdenPago(formData: FormData): Promise<CrearOrdenResult> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? "unknown";

  const rl = await checkRateLimit(`crear-orden:${ip}`);
  if (!rl.ok) {
    return { ok: false, message: "Demasiados intentos. Espera 15 minutos." };
  }

  const folio = String(formData.get("folio") ?? "").trim();
  const metodoPagoRaw = String(formData.get("metodo_pago") ?? "spei");
  const metodoPago = (
    ALLOWED_METODOS.has(metodoPagoRaw as MetodoPago) ? metodoPagoRaw : "spei"
  ) as MetodoPago;

  if (!folio) {
    return { ok: false, message: "Folio requerido." };
  }

  // Cupos: bloqueo previo a crear orden externa.
  const { data: cuposData } = await supabaseAdmin.rpc("get_cupos_disponibles");
  const cupos = typeof cuposData === "number" ? cuposData : 0;
  if (cupos <= 0) {
    return { ok: false, message: "Los cupos se han agotado." };
  }

  const { data: registro, error: regErr } = await supabaseAdmin
    .from("registros")
    .select("*")
    .eq("folio", folio)
    .single();

  if (regErr || !registro) {
    return { ok: false, message: "Registro no encontrado." };
  }

  if (registro.estado_pago === "pagado") {
    redirect(`/registro-exitoso?folio=${encodeURIComponent(folio)}`);
  }

  if (metodoPago === "transferencia_manual") {
    await supabaseAdmin
      .from("registros")
      .update({ metodo_pago: "transferencia_manual" })
      .eq("folio", folio);
    pagoRedirect(folio);
  }

  const conekta = getConekta();
  if (!conekta) {
    warnConektaDisabled();
    await supabaseAdmin
      .from("registros")
      .update({ metodo_pago: "transferencia_manual" })
      .eq("folio", folio);
    pagoRedirect(folio);
  }

  try {
    const montoCents = Math.round(Number(registro.monto_mxn) * 100);

    type OrderPayload = Parameters<NonNullable<typeof conekta>["createOrder"]>[0];

    const orderPayload: OrderPayload = {
      currency: "MXN",
      customer_info: {
        name: `${registro.nombre} ${registro.apellido}`.trim(),
        email: registro.email,
        phone: registro.telefono?.toString().trim() || "+5210000000000",
      },
      line_items: [
        {
          name: `Acceso ${String(registro.tipo_acceso).toUpperCase()} — SC Security Summit 2026`,
          unit_price: montoCents,
          quantity: 1,
        },
      ],
      metadata: {
        folio: registro.folio,
        tipo_acceso: registro.tipo_acceso,
        registro_id: registro.id,
      },
    };

    if (metodoPago === "spei") {
      orderPayload.charges = [{ payment_method: { type: "spei" } }];
    } else if (metodoPago === "oxxo") {
      orderPayload.charges = [{ payment_method: { type: "cash" } }];
    } else if (metodoPago === "tarjeta") {
      orderPayload.checkout = {
        type: "HostedPayment",
        allowed_payment_methods: ["card"],
        success_url: `${siteUrl()}/registro-exitoso?folio=${encodeURIComponent(folio)}`,
        failure_url: `${siteUrl()}/pago?folio=${encodeURIComponent(folio)}&error=1`,
      };
    }

    // Idempotency by (folio, method) so retries don't create duplicate orders.
    const idemKey = `order:${folio}:${metodoPago}`;
    const order = await conekta!.createOrder(orderPayload, idemKey);

    const updateData: Record<string, unknown> = {
      metodo_pago: metodoPago,
      conekta_order_id: order.id,
      conekta_payment_status: "pending",
    };

    const charge = order.charges?.data?.[0];
    if (metodoPago === "spei" && charge?.payment_method) {
      updateData.spei_clabe = charge.payment_method.clabe ?? null;
      updateData.spei_reference = charge.payment_method.reference ?? null;
      updateData.conekta_charge_id = charge.id;
    } else if (metodoPago === "oxxo" && charge?.payment_method) {
      updateData.oxxo_barcode_url = charge.payment_method.barcode_url ?? null;
      updateData.oxxo_expires_at = charge.payment_method.expires_at
        ? new Date(charge.payment_method.expires_at * 1000).toISOString()
        : null;
      updateData.conekta_charge_id = charge.id;
    } else if (metodoPago === "tarjeta") {
      updateData.conekta_checkout_url = order.checkout?.url ?? null;
    }

    await supabaseAdmin.from("registros").update(updateData).eq("folio", folio);

    await supabaseAdmin.from("audit_log").insert({
      evento: "orden_pago_creada",
      folio,
      ip,
      detalles: { order_id: order.id, metodo_pago: metodoPago },
    });

    if (metodoPago === "tarjeta" && typeof updateData.conekta_checkout_url === "string") {
      // External redirect to Conekta-hosted checkout.
      redirect(updateData.conekta_checkout_url);
    }

    pagoRedirect(folio);
  } catch (err) {
    // Re-throw Next.js redirect signals — never swallow them.
    if (err && typeof err === "object" && "digest" in err) throw err;
    Sentry.captureException(err, {
      tags: { action: "crear_orden_pago" },
      extra: { folio, metodoPago },
    });
    return { ok: false, message: "Error al crear la orden de pago." };
  }
}
