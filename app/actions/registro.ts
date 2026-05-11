"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { RegistroInput } from "@/lib/schemas";
import { serializeRegistroFlashState } from "@/lib/registro-form-state";

type Language = "es" | "en";

function auditLog(event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), event, ...data }));
}

function pickLanguage(formData: FormData, acceptLanguage: string | null): Language {
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
  values?: Partial<Record<keyof RegistroInput, string | boolean>>;
};

function getPersistedValues(formData: FormData) {
  const tipoAcceso = String(formData.get("tipo_acceso") ?? "general");

  return {
    nombre: String(formData.get("nombre") ?? ""),
    apellido: String(formData.get("apellido") ?? ""),
    email: String(formData.get("email") ?? ""),
    telefono: String(formData.get("telefono") ?? ""),
    empresa: String(formData.get("empresa") ?? ""),
    cargo: String(formData.get("cargo") ?? ""),
    tipo_acceso:
      tipoAcceso === "vip" || tipoAcceso === "estudiante" ? tipoAcceso : "general",
    credencial_estudiantil: formData.get("credencial_estudiantil") === "on",
    acepta_terminos: formData.get("acepta_terminos") === "on",
    requiere_cfdi: formData.get("requiere_cfdi") === "true",
    rfc: String(formData.get("rfc") ?? ""),
    razon_social: String(formData.get("razon_social") ?? ""),
    codigo_postal_fiscal: String(formData.get("codigo_postal_fiscal") ?? ""),
  } satisfies Partial<Record<keyof RegistroInput, string | boolean>>;
}

type ProcessResult =
  | {
      ok: true;
      folio: string;
      tipo: "estudiante" | "general" | "vip";
      monto: number;
      language: Language;
    }
  | { ok: false; state: RegistroState; language: Language };

async function processRegistro(formData: FormData): Promise<ProcessResult> {
  const [{ verifyTurnstile }, { RegistroSchema }, { createLead }] = await Promise.all([
    import("@/lib/turnstile"),
    import("@/lib/schemas"),
    import("@/server/use-cases/create-lead"),
  ]);

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? "unknown";
  const userAgent = h.get("user-agent") ?? "unknown";
  const referer = h.get("referer") ?? null;
  const acceptLanguage = h.get("accept-language");
  const language = pickLanguage(formData, acceptLanguage);
  const values = getPersistedValues(formData);

  // 1. Honeypot — pretend success so bots don't get a useful signal.
  const honeypot = formData.get("website");
  if (honeypot && String(honeypot).length > 0) {
    auditLog("honeypot_triggered", { ip });
    return {
      ok: true,
      folio: `SCSS2026-BOT-${Date.now().toString(36).toUpperCase()}`,
      tipo: "general",
      monto: 0,
      language,
    };
  }

  // 2. Turnstile — verifyTurnstile fails open when the secret is not configured.
  const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");
  const turnstileOk = await verifyTurnstile(turnstileToken, ip);
  if (!turnstileOk) {
    return {
      ok: false,
      language,
      state: {
        success: false,
        message: "No pudimos verificar que no eres un bot. Por favor recarga e intenta de nuevo.",
        errors: { _form: ["Verificación de seguridad fallida."] },
        values,
      },
    };
  }

  // 3. Zod validation
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
      ok: false,
      language,
      state: {
        success: false,
        message: "Por favor corrige los errores en el formulario.",
        errors: {
          ...(fieldErrors as RegistroState["errors"]),
          ...(formErrors.length > 0 ? { _form: formErrors } : {}),
        },
        values,
      },
    };
  }

  // 4. Insert via use-case
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
      ok: false,
      language,
      state: {
        success: false,
        message: result.message,
        errors: {
          ...(result.fieldErrors as RegistroState["errors"]),
          ...(result.status === 500 ? { _form: [result.message] } : {}),
        },
        values,
      },
    };
  }

  return {
    ok: true,
    folio: result.folio,
    tipo: result.tipo,
    monto: result.monto,
    language,
  };
}

export async function submitRegistroForm(formData: FormData): Promise<void> {
  const result = await processRegistro(formData);

  if (result.ok) {
    const params = new URLSearchParams({
      folio: result.folio,
      tipo: result.tipo,
      monto: String(result.monto),
    });
    if (result.language === "en") params.set("lang", "en");
    redirect(`/registro-exitoso?${params.toString()}`);
  }

  const params = new URLSearchParams();
  if (result.language === "en") params.set("lang", "en");
  params.set("registro", serializeRegistroFlashState(result.state));
  redirect(`/?${params.toString()}#registro`);
}
