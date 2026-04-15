"use server";

import { z } from "zod";

import { createServerActionSupabaseClient } from "@/lib/supabase";
import { AppError, toAppError } from "@/lib/utils/error";

const SampleLookupSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
});

export type SampleLookupState = {
  success: boolean;
  message: string;
  data?: {
    folio: string;
    email: string;
    estado_pago: "pendiente" | "pagado" | "cancelado";
    tipo_acceso: "estudiante" | "general" | "vip";
  } | null;
};

export async function lookupOwnRegistrationByEmail(
  input: unknown
): Promise<SampleLookupState> {
  const parsed = SampleLookupSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.errors[0]?.message ?? "Datos inválidos",
    };
  }

  try {
    const supabase = await createServerActionSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      throw new AppError("Debes iniciar sesión para consultar tu registro", "UNAUTHORIZED");
    }

    if (user.email !== parsed.data.email) {
      throw new AppError("Solo puedes consultar tu propio registro", "UNAUTHORIZED");
    }

    const { data, error } = await supabase
      .from("registros")
      .select("folio, email, estado_pago, tipo_acceso")
      .eq("email", user.email)
      .maybeSingle();

    if (error) {
      throw new AppError("No se pudo consultar el registro", "DATABASE_ERROR", error);
    }

    return {
      success: true,
      message: data ? "Registro encontrado" : "No existe registro para este correo",
      data,
    };
  } catch (error) {
    const appError = toAppError(error, "Error al consultar registro");
    return {
      success: false,
      message: appError.message,
    };
  }
}
