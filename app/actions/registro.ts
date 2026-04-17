"use server";

import { createPublicClient } from "@/lib/supabase";
import { RegistroSchema, PRECIOS, type RegistroInput } from "@/lib/schemas";

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
    // Respuesta falsa exitosa para no revelar la detección al bot
    return {
      success: true,
      message: "Registro completado. Recibirás instrucciones en tu correo.",
      folio: `SCSS2026-BOT-${Date.now().toString(36).toUpperCase()}`,
    };
  }

  // 1. Extract form data
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

  // 2. Validate with Zod
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

  // 3. Business rule: estudiante must confirm credencial
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

  // 4. Generate unique folio
  const folio = `SCSS2026-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}`;

  // 5. Insert into Supabase
  try {
    const supabase = createPublicClient();

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
        return {
          success: false,
          message: "Este correo electrónico ya tiene un registro activo.",
          errors: {
            email: ["Este correo ya está registrado para el evento."],
          },
        };
      }

      // Log estructurado para Vercel — no se expone al cliente
      console.error("[registro] DB error", { code: error.code, hint: error.hint });
      return {
        success: false,
        message:
          "Error al procesar el registro. Intenta nuevamente o contáctanos.",
        errors: {
          _form: ["Error interno del servidor. Contáctanos si el problema persiste."],
        },
      };
    }

    const cfdiNote = data.requiere_cfdi
      ? " Se procesará tu factura CFDI con los datos proporcionados."
      : "";

    return {
      success: true,
      message: `Registro completado exitosamente. Tu folio de confirmación es ${folio}. Recibirás instrucciones de pago en tu correo.${cfdiNote}`,
      folio,
    };
  } catch (err) {
    console.error("[registro] Unexpected error", err instanceof Error ? err.message : "unknown");
    return {
      success: false,
      message: "Error inesperado. Contacta a Contacto@LanzLogistics.com",
      errors: {
        _form: ["Error de servidor. Por favor intenta más tarde."],
      },
    };
  }
}
