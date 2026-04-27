"use server";

import { headers } from "next/headers";
import { verifyTurnstile } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rate-limit";
import { RegistroSchema, type RegistroInput } from "@/lib/schemas";
import { createLead } from "@/server/use-cases/create-lead";
import type { EmailLanguage } from "@/lib/email-templates";

function auditLog(event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), event, ...data }));
}

function pickLanguage(formData: FormData, acceptLanguage: string | null): EmailLanguage {
  const explicit = String(formData.get("language") ?? "").toLowerCase();
  if (explicit === "en" || explicit === "es") return explicit;
  if (acceptLanguage && /^en\b/i.test(acceptLanguage)) return "en";
  return "es";
}

export type RegistroState = {
  success: boolean;
  message: string;
  errors?: Partial<Record<keyof RegistroInput | "_form", string[]>>;
  folio?: string;
};

export async function registrarAsistente(
  prevState: RegistroState,
  formData: FormData
): Promise<RegistroState> {
  void prevState;

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? "unknown";
  const userAgent = h.get("user-agent") ?? "unknown";
  const referer = h.get("referer") ?? null;
  const acceptLanguage = h.get("accept-language");
  const language = pickLanguage(formData, acceptLanguage);

  const honeypot = formData.get("website");
  if (honeypot && String(honeypot).length > 0) {
    auditLog("honeypot_triggered", { ip });
    return {
      success: true,
      message: "Registro completado. Recibirás instrucciones en tu correo.",
      folio: `SCSS2026-BOT-${Date.now().toString(36).toUpperCase()}`,
    };
  }

  // Rate-limit must run BEFORE Turnstile so abusive IPs can't burn through
  // our Cloudflare quota by spamming bot-verifications.
  const rl = await checkRateLimit(ip);
  if (!rl.ok) {
    auditLog("registro_rate_limited", { ip });
    return {
      success: false,
      message: "Demasiados intentos. Por favor espera 15 minutos e inténtalo de nuevo.",
      errors: { _form: ["Demasiados intentos."] },
    };
  }

  const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");
  const turnstileOk = await verifyTurnstile(turnstileToken, ip);

  if (!turnstileOk) {
    return {
      success: false,
      message: "No pudimos verificar que no eres un bot. Por favor recarga e intenta de nuevo.",
      errors: { _form: ["Verificación de seguridad fallida."] },
    };
  }

  const requiresCFDI = formData.get("requiere_cfdi") === "true";
  const rawData = {
    nombre: formData.get("nombre"),
    apellido: formData.get("apellido"),
    email: formData.get("email"),
    telefono: formData.get("telefono"),
    empresa: formData.get("empresa"),
    cargo: formData.get("cargo"),
    tipo_acceso: formData.get("tipo_acceso"),
    credencial_estudiantil: formData.get("credencial_estudiantil") === "on",
    acepta_terminos: formData.get("acepta_terminos") === "on",
    requiere_cfdi: requiresCFDI,
    rfc: requiresCFDI ? (formData.get("rfc") ?? "") : "",
    razon_social: requiresCFDI ? (formData.get("razon_social") ?? "") : "",
    codigo_postal_fiscal: requiresCFDI ? (formData.get("codigo_postal_fiscal") ?? "") : "",
  };

  const parsed = RegistroSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const formErrors = parsed.error.flatten().formErrors;

    return {
      success: false,
      message: "Por favor corrige los errores en el formulario.",
      errors: {
        ...(fieldErrors as RegistroState["errors"]),
        ...(formErrors.length > 0 ? { _form: formErrors } : {}),
      },
    };
  }

  const result = await createLead({
    ...parsed.data,
    language,
    ip,
    userAgent,
    referer,
    utm_source: (formData.get("utm_source") as string | null) || null,
    utm_medium: (formData.get("utm_medium") as string | null) || null,
    utm_campaign: (formData.get("utm_campaign") as string | null) || null,
  });

  if (!result.ok) {
    return {
      success: false,
      message: result.message,
      errors: {
        ...(result.fieldErrors as RegistroState["errors"]),
        ...(result.status === 500 ? { _form: [result.message] } : {}),
      },
    };
  }

  return {
    success: true,
    message: result.message,
    folio: result.folio,
  };
}
