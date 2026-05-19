"use server";

import { z } from "zod";
import { checkRateLimit, getClientIp, RateLimitError } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import {
  folioRecoveryEmailHtml,
  folioRecoveryEmailSubject,
} from "@/lib/email-templates";

const Schema = z.object({
  email: z.string().email().max(255).toLowerCase().trim(),
  nombre: z.string().min(2).max(120).trim(),
});

export type RecuperarFolioState = {
  submitted: boolean;
  errors?: { email?: string[]; nombre?: string[]; _form?: string[] };
};

export async function recuperarFolioAction(
  _prev: RecuperarFolioState,
  formData: FormData,
): Promise<RecuperarFolioState> {
  const ip = await getClientIp();

  try {
    await checkRateLimit(`recuperar-folio:${ip}`);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return {
        submitted: true,
        errors: { _form: ["Demasiadas solicitudes. Intenta en unos minutos."] },
      };
    }
    throw err;
  }

  const parsed = Schema.safeParse({
    email: formData.get("email"),
    nombre: formData.get("nombre"),
  });

  if (!parsed.success) {
    return {
      submitted: false,
      errors: parsed.error.flatten().fieldErrors as RecuperarFolioState["errors"],
    };
  }

  const { email, nombre } = parsed.data;

  const { data: registro } = await supabaseAdmin
    .from("registros")
    .select("folio, nombre, tipo_acceso, estado_pago")
    .ilike("email", email)
    .ilike("nombre", `%${nombre.split(" ")[0]}%`)
    .neq("estado_pago", "cancelado")
    .maybeSingle();

  if (registro) {
    await sendEmail({
      to: email,
      subject: folioRecoveryEmailSubject(),
      html: folioRecoveryEmailHtml({
        nombre: registro.nombre,
        folio: registro.folio,
        tipo_acceso: registro.tipo_acceso,
      }),
    });
  }

  // Always return neutral message (anti-enumeration)
  return { submitted: true };
}
