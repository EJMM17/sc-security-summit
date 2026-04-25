"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendRegistrationConfirmation } from "@/lib/email";
import type { EmailLanguage } from "@/lib/email-templates";
import type { RegistroInput } from "@/lib/schemas";

function auditLog(event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), event, ...data }));
}

const EmailSchema = z.string().email().max(255);

export type RecuperarFolioState = {
  success: boolean;
  message: string;
  errors?: { email?: string[]; _form?: string[] };
};

// Privacy-by-design: we always return the same neutral message regardless of
// whether the email is in the database. An attacker probing valid registrant
// emails learns nothing from response timing or wording.
const NEUTRAL_MESSAGE_ES =
  "Si tu correo está registrado, en los próximos minutos recibirás un email con tu folio.";
const NEUTRAL_MESSAGE_EN =
  "If your email is registered, you'll receive a message with your folio in the next few minutes.";

export async function recuperarFolio(
  prevState: RecuperarFolioState,
  formData: FormData
): Promise<RecuperarFolioState> {
  // 1. Honeypot
  const honeypot = formData.get("website");
  if (honeypot && String(honeypot).length > 0) {
    auditLog("recuperar_folio_honeypot", {});
    return { success: true, message: NEUTRAL_MESSAGE_ES };
  }

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? "unknown";
  const acceptLanguage = h.get("accept-language");
  const explicit = String(formData.get("language") ?? "").toLowerCase();
  const language: EmailLanguage =
    explicit === "en" || explicit === "es"
      ? explicit
      : acceptLanguage && /^en\b/i.test(acceptLanguage)
        ? "en"
        : "es";
  const neutralMessage = language === "en" ? NEUTRAL_MESSAGE_EN : NEUTRAL_MESSAGE_ES;

  // 2. Rate limit (shares the same Upstash window as registrations to make
  //    it expensive for a bot to enumerate emails)
  const rl = await checkRateLimit(`recuperar:${ip}`);
  if (!rl.ok) {
    auditLog("recuperar_folio_rate_limited", { ip });
    return {
      success: false,
      message:
        language === "en"
          ? "Too many attempts. Please wait 15 minutes and try again."
          : "Demasiados intentos. Espera 15 minutos e intenta de nuevo.",
    };
  }

  // 3. Turnstile
  const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");
  const turnstileOk = await verifyTurnstile(turnstileToken, ip);
  if (!turnstileOk) {
    auditLog("recuperar_folio_turnstile_failed", { ip });
    return {
      success: false,
      message:
        language === "en"
          ? "Bot verification failed. Reload the page and try again."
          : "Verificación de seguridad fallida. Recarga la página e intenta de nuevo.",
    };
  }

  // 4. Validate email
  const parsed = EmailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return {
      success: false,
      message:
        language === "en"
          ? "Enter a valid email address."
          : "Ingresa un correo electrónico válido.",
      errors: { email: [language === "en" ? "Invalid email" : "Correo inválido"] },
    };
  }
  const email = parsed.data.toLowerCase().trim();

  // 5. Look up — but ALWAYS return the neutral message
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("registros")
      .select("folio, nombre, tipo_acceso, monto_mxn")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      auditLog("recuperar_folio_db_error", { code: error.code, ip });
      return { success: true, message: neutralMessage };
    }

    if (data) {
      const sendResult = await sendRegistrationConfirmation({
        to: email,
        folio: data.folio,
        nombre: data.nombre,
        tipoAcceso: data.tipo_acceso as RegistroInput["tipo_acceso"],
        montoMxn: data.monto_mxn,
        language,
      });
      if (!sendResult.ok) {
        auditLog("recuperar_folio_email_failed", { folio: data.folio, reason: sendResult.error });
      } else {
        auditLog("recuperar_folio_sent", { folio: data.folio });
      }
    } else {
      auditLog("recuperar_folio_not_found", { email_hash: hashEmail(email), ip });
    }

    return { success: true, message: neutralMessage };
  } catch (err) {
    auditLog("recuperar_folio_unexpected_error", {
      ip,
      error: err instanceof Error ? err.message : "unknown",
    });
    // Still return neutral so we don't leak existence on errors either
    return { success: true, message: neutralMessage };
  }
}

// Hash so we can correlate audit log entries without storing raw emails of
// people who tried to look up a folio that doesn't exist (anti-enumeration).
function hashEmail(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash << 5) - hash + email.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16);
}
