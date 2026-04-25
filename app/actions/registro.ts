"use server";

import { headers } from "next/headers";
import { randomBytes } from "crypto";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  sendOrganizerNotification,
  sendRegistrationConfirmation,
  type SendResult,
} from "@/lib/email";
import type { EmailLanguage } from "@/lib/email-templates";
import { RegistroSchema, PRECIOS, type RegistroInput } from "@/lib/schemas";

function auditLog(event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), event, ...data }));
}

// Tells Sentry the request failed in a known, non-error way (rate limit,
// duplicate email, etc) so we can alert on real exceptions but still see
// trends in expected-failure paths via the messages tab.
function captureControlledFailure(message: string, context: Record<string, unknown>) {
  Sentry.captureMessage(message, {
    level: "warning",
    extra: context,
  });
}

// Pick "es" | "en" from form data or Accept-Language header. Defaults to "es"
// since the site primary language is Spanish.
function pickLanguage(formData: FormData, acceptLanguage: string | null): EmailLanguage {
  const explicit = String(formData.get("language") ?? "").toLowerCase();
  if (explicit === "en" || explicit === "es") return explicit;
  if (acceptLanguage && /^en\b/i.test(acceptLanguage)) return "en";
  return "es";
}

// Returns a human-readable failure reason when an email send did not succeed,
// otherwise null. Lets us narrow the SendResult discriminated union cleanly.
function emailFailureReason(result: PromiseSettledResult<SendResult>): string | null {
  if (result.status === "rejected") {
    return result.reason instanceof Error ? result.reason.message : String(result.reason);
  }
  return result.value.ok ? null : result.value.error;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type RegistroState = {
  success: boolean;
  message: string;
  errors?: Partial<Record<keyof RegistroInput | "_form", string[]>>;
  folio?: string;
};

// ─── Server Action ────────────────────────────────────────────────────────────

export async function registrarAsistente(
  prevState: RegistroState,
  formData: FormData
): Promise<RegistroState> {
  // 0. Honeypot anti-spam: si el campo "website" tiene contenido, es un bot
  const honeypot = formData.get("website");
  if (honeypot && String(honeypot).length > 0) {
    auditLog("honeypot_triggered", { ip: "unknown" });
    // Respuesta falsa exitosa para no revelar la detección al bot
    return {
      success: true,
      message: "Registro completado. Recibirás instrucciones en tu correo.",
      folio: `SCSS2026-BOT-${Date.now().toString(36).toUpperCase()}`,
    };
  }

  // 1. Obtener IP, User-Agent y Referer desde los headers del request
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0].trim() ??
    h.get("x-real-ip") ??
    "unknown";
  const userAgent = h.get("user-agent") ?? "unknown";
  const referer = h.get("referer") ?? null;
  const acceptLanguage = h.get("accept-language");
  const language = pickLanguage(formData, acceptLanguage);

  // 2. Rate limit — 5 intentos por IP cada 15 minutos (Upstash Redis, distribuido multi-región)
  const rl = await checkRateLimit(ip);
  if (!rl.ok) {
    auditLog("rate_limit_exceeded", { ip });
    return {
      success: false,
      message: "Has realizado demasiados intentos. Espera 15 minutos e intenta de nuevo.",
      errors: { _form: ["Límite de intentos excedido."] },
    };
  }

  // 3. Cloudflare Turnstile — verificar que no es bot
  const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");
  const turnstileOk = await verifyTurnstile(turnstileToken, ip);
  if (!turnstileOk) {
    auditLog("turnstile_failed", { ip, userAgent });
    return {
      success: false,
      message: "No pudimos verificar que no eres un bot. Por favor recarga e intenta de nuevo.",
      errors: { _form: ["Verificación de seguridad fallida."] },
    };
  }

  // 4. Extract form data
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
    // CFDI fields
    requiere_cfdi: requiresCFDI,
    rfc: requiresCFDI ? (formData.get("rfc") ?? "") : "",
    razon_social: requiresCFDI ? (formData.get("razon_social") ?? "") : "",
    codigo_postal_fiscal: requiresCFDI
      ? (formData.get("codigo_postal_fiscal") ?? "")
      : "",
  };

  // 5. Validate with Zod
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

  const data = parsed.data;

  // 6. Business rule: estudiante must confirm credencial
  if (data.tipo_acceso === "estudiante" && !data.credencial_estudiantil) {
    return {
      success: false,
      message: "El acceso estudiantil requiere presentar credencial vigente.",
      errors: {
        credencial_estudiantil: [
          "Confirma que presentarás credencial estudiantil vigente",
        ],
      },
    };
  }

  // 7. Generate unique folio (CSPRNG suffix — Math.random is not cryptographically secure)
  const folioSuffix = randomBytes(3).toString("hex").toUpperCase();
  const folio = `SCSS2026-${Date.now().toString(36).toUpperCase()}-${folioSuffix}`;

  // 8. Insert into Supabase via service_role (bypasses RLS, server-side only)
  try {
    const supabase = createAdminClient();

    const insertPayload: Record<string, unknown> = {
      folio,
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email,
      telefono: data.telefono || null,
      empresa: data.empresa,
      cargo: data.cargo,
      tipo_acceso: data.tipo_acceso,
      monto_mxn: PRECIOS[data.tipo_acceso],
      estado_pago: "pendiente",
      credencial_estudiantil: data.credencial_estudiantil ?? false,
      requiere_cfdi: data.requiere_cfdi ?? false,
      created_at: new Date().toISOString(),
      // Auditoría y atribución
      ip_registro: ip,
      user_agent: userAgent,
      referer,
      utm_source: (formData.get("utm_source") as string | null) || null,
      utm_medium: (formData.get("utm_medium") as string | null) || null,
      utm_campaign: (formData.get("utm_campaign") as string | null) || null,
    };

    // Attach CFDI fields only if required
    if (data.requiere_cfdi) {
      insertPayload.rfc = data.rfc?.trim().toUpperCase() ?? null;
      insertPayload.razon_social = data.razon_social?.trim() ?? null;
      insertPayload.codigo_postal_fiscal =
        data.codigo_postal_fiscal?.trim() ?? null;
    }

    const { error } = await supabase.from("registros").insert(insertPayload);

    if (error) {
      // Duplicate email (unique constraint)
      if (error.code === "23505") {
        auditLog("duplicate_email_attempt", { ip, userAgent });
        return {
          success: false,
          message: "Este correo electrónico ya tiene un registro activo.",
          errors: {
            email: ["Este correo ya está registrado para el evento."],
          },
        };
      }

      auditLog("db_error", { code: error.code, hint: error.hint, ip });
      Sentry.captureException(new Error(`registro db_error: ${error.code}`), {
        extra: { code: error.code, hint: error.hint, message: error.message },
      });
      return {
        success: false,
        message:
          "Error al procesar el registro. Intenta nuevamente o contáctanos.",
        errors: {
          _form: ["Error interno del servidor. Contáctanos si el problema persiste."],
        },
      };
    }

    auditLog("registration_success", { folio, tipo_acceso: data.tipo_acceso, ip });

    // 9. Send confirmation + organizer notification emails. We await
    // Promise.allSettled so Vercel doesn't terminate the lambda before the
    // sends complete, but failures here MUST NOT break the user's success
    // response — the registration is already persisted.
    const [confirmResult, organizerResult] = await Promise.allSettled([
      sendRegistrationConfirmation({
        to: data.email,
        folio,
        nombre: data.nombre,
        tipoAcceso: data.tipo_acceso,
        montoMxn: PRECIOS[data.tipo_acceso],
        language,
      }),
      sendOrganizerNotification({
        folio,
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        telefono: data.telefono?.trim() || null,
        empresa: data.empresa,
        cargo: data.cargo,
        tipoAcceso: data.tipo_acceso,
        montoMxn: PRECIOS[data.tipo_acceso],
        requiereCfdi: data.requiere_cfdi ?? false,
        rfc: data.rfc?.trim().toUpperCase() || null,
        ipRegistro: ip,
      }),
    ]);

    const confirmReason = emailFailureReason(confirmResult);
    if (confirmReason) {
      auditLog("email_confirmation_failed", { folio, to: data.email, reason: confirmReason });
      captureControlledFailure("email_confirmation_failed", { folio, reason: confirmReason });
    }

    const organizerReason = emailFailureReason(organizerResult);
    if (organizerReason) {
      auditLog("email_organizer_failed", { folio, reason: organizerReason });
      captureControlledFailure("email_organizer_failed", { folio, reason: organizerReason });
    }

    const successMessage =
      language === "en"
        ? `Registration complete. Your confirmation folio is ${folio}. Payment instructions are on the way to your inbox.${
            data.requiere_cfdi ? " Your CFDI invoice will be issued with the data provided." : ""
          }`
        : `Registro completado exitosamente. Tu folio de confirmación es ${folio}. Recibirás instrucciones de pago en tu correo.${
            data.requiere_cfdi ? " Se procesará tu factura CFDI con los datos proporcionados." : ""
          }`;

    return {
      success: true,
      message: successMessage,
      folio,
    };
  } catch (err) {
    auditLog("unexpected_error", { ip, error: err instanceof Error ? err.message : "unknown" });
    Sentry.captureException(err, { tags: { surface: "registro_action" } });
    return {
      success: false,
      message: "Error inesperado. Contacta a Contacto@LanzLogistics.com",
      errors: {
        _form: ["Error de servidor. Por favor intenta más tarde."],
      },
    };
  }
}
