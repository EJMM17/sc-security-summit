"use server";

import "server-only";

import * as Sentry from "@sentry/nextjs";

import { requireAdmin } from "@/lib/admin-auth";
import { sendRegistrationConfirmation } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase";

export type ReenviarResult = { ok: boolean; message: string };

export async function reenviarInstrucciones(folio: string): Promise<ReenviarResult> {
  const adminEmail = await requireAdmin();

  if (!folio || typeof folio !== "string") {
    return { ok: false, message: "Folio inválido." };
  }

  const { data: r, error } = await supabaseAdmin
    .from("registros")
    .select("folio,nombre,email,tipo_acceso,monto_mxn")
    .eq("folio", folio)
    .single();

  if (error || !r) {
    return { ok: false, message: "Registro no encontrado." };
  }

  const result = await sendRegistrationConfirmation({
    to: r.email,
    folio: r.folio,
    nombre: r.nombre,
    tipoAcceso: r.tipo_acceso,
    montoMxn: r.monto_mxn,
    language: "es",
  });

  await supabaseAdmin.from("audit_log").insert({
    evento: "instrucciones_reenviadas",
    folio: r.folio,
    usuario_email: adminEmail,
    detalles: { email_to: r.email, send_ok: result.ok },
  });

  if (!result.ok) {
    Sentry.captureMessage("admin.reenviar_instrucciones_failed", {
      level: "warning",
      extra: { folio: r.folio, error: result.error },
    });
    return { ok: false, message: "No se pudo reenviar. Intenta de nuevo." };
  }

  return { ok: true, message: "Instrucciones reenviadas." };
}
