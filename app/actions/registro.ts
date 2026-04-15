"use server";

import { createAdminClient } from "@/lib/supabase";
import { RegistroSchema, PRECIOS, type RegistroInput } from "@/lib/schemas";
import { AppError, toAppError } from "@/lib/utils/error";

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
  const previousMessage = prevState.message;
  // 1. Extraer datos del FormData
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
  };

  // 2. Validar con Zod (server-side)
  const parsed = RegistroSchema.safeParse(rawData);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      success: false,
      message: "Por favor corrige los errores en el formulario.",
      errors: fieldErrors as RegistroState["errors"],
    };
  }

  const data = parsed.data;

  // 3. Validación de negocio adicional
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

  // 4. Generar folio único
  const folio = `SCSS2026-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}`;

  // 5. Insertar en Supabase
  try {
    const supabase = createAdminClient();

    const { error } = await supabase.from("registros").insert({
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
      created_at: new Date().toISOString(),
    });

    if (error) {
      // Detectar email duplicado (unique constraint en Supabase)
      if (error.code === "23505") {
        return {
          success: false,
          message: "Este correo electrónico ya tiene un registro activo.",
          errors: {
            email: ["Este correo ya está registrado para el evento."],
          },
        };
      }

      throw new AppError(
        "Error al procesar el registro. Intenta nuevamente o contáctanos.",
        "DATABASE_ERROR",
        error
      );
    }

    return {
      success: true,
      message: `Registro completado. Tu folio de confirmación es ${folio}. Recibirás instrucciones de pago en tu correo.`,
      folio,
    };
  } catch (error) {
    const appError = toAppError(
      error,
      previousMessage || "Error inesperado. Contacta a Contacto@LanzLogistics.com"
    );
    return {
      success: false,
      message: appError.message,
      errors: {
        _form: ["Error de servidor. Por favor intenta más tarde."],
      },
    };
  }
}
