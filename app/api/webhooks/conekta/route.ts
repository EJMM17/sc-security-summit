import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";

import { env } from "@/env";
import { sendPaymentConfirmation } from "@/lib/email";
import { checkWebhookRateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ConektaWebhookPayload = {
  type?: string;
  data?: { object?: { id?: string } };
};

function ok(body: Record<string, unknown> = { ok: true }) {
  return NextResponse.json(body, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const rl = await checkWebhookRateLimit(ip);
    if (!rl.ok) {
      // Soft reject: 200 keeps Conekta from retry-storming; we capture the
      // anomaly in audit_log to investigate.
      await supabaseAdmin.from("audit_log").insert({
        evento: "webhook_rate_limited",
        ip,
        detalles: { source: "conekta" },
      });
      return ok({ ok: true, throttled: true });
    }

    // Optional shared-secret header validation. Conekta supports a custom
    // header on webhooks; if CONEKTA_WEBHOOK_SECRET is set we require it.
    if (env.CONEKTA_WEBHOOK_SECRET) {
      const provided =
        req.headers.get("x-conekta-webhook-secret") ??
        req.headers.get("conekta-signature") ??
        "";
      if (provided !== env.CONEKTA_WEBHOOK_SECRET) {
        return NextResponse.json({ ok: false }, { status: 401 });
      }
    }

    const payload = (await req.json()) as ConektaWebhookPayload;
    const eventType = payload.type;
    const orderId = payload.data?.object?.id;

    if (!eventType || !orderId) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const { data: registro } = await supabaseAdmin
      .from("registros")
      .select("*")
      .eq("conekta_order_id", orderId)
      .single();

    if (!registro) {
      console.warn(`[webhook-conekta] orden ${orderId} no encontrada`);
      return ok();
    }

    if (eventType === "order.paid" || eventType === "charge.paid") {
      await supabaseAdmin
        .from("registros")
        .update({
          estado_pago: "pagado",
          conekta_payment_status: "paid",
          pagado_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", registro.id);

      const sendResult = await sendPaymentConfirmation({
        to: registro.email,
        folio: registro.folio,
        nombre: registro.nombre,
        tipoAcceso: registro.tipo_acceso,
        montoMxn: registro.monto_mxn,
        language: "es",
      });

      await supabaseAdmin.from("audit_log").insert({
        evento: "pago_conekta_webhook",
        folio: registro.folio,
        detalles: {
          order_id: orderId,
          event: eventType,
          metodo: registro.metodo_pago,
          email_sent: sendResult.ok,
        },
      });
    } else if (eventType === "order.expired") {
      await supabaseAdmin
        .from("registros")
        .update({ conekta_payment_status: "expired" })
        .eq("id", registro.id);
    } else if (eventType === "order.canceled") {
      await supabaseAdmin
        .from("registros")
        .update({
          estado_pago: "cancelado",
          conekta_payment_status: "canceled",
        })
        .eq("id", registro.id);
    }

    return ok();
  } catch (err) {
    Sentry.captureException(err, { tags: { webhook: "conekta" } });
    // Always 200 — Conekta retries on non-2xx and we'd rather investigate
    // captured exceptions than serve a retry storm.
    return ok({ ok: false });
  }
}
