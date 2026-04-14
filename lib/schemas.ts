import { z } from "zod";

export const RegistroSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/, "Nombre inválido"),

  apellido: z
    .string()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(100, "El apellido no puede exceder 100 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/, "Apellido inválido"),

  email: z
    .string()
    .email("Ingresa un correo electrónico válido")
    .max(255, "El correo no puede exceder 255 caracteres"),

  telefono: z
    .string()
    .regex(
      /^\+?[0-9\s\-()]{7,20}$/,
      "Ingresa un número de teléfono válido"
    )
    .optional()
    .or(z.literal("")),

  empresa: z
    .string()
    .min(2, "El nombre de la empresa debe tener al menos 2 caracteres")
    .max(150, "El nombre de empresa no puede exceder 150 caracteres"),

  cargo: z
    .string()
    .min(2, "El cargo debe tener al menos 2 caracteres")
    .max(100, "El cargo no puede exceder 100 caracteres"),

  tipo_acceso: z.enum(["estudiante", "general", "vip"], {
    errorMap: () => ({ message: "Selecciona un tipo de acceso válido" }),
  }),

  credencial_estudiantil: z.boolean().optional(),

  acepta_terminos: z
    .boolean()
    .refine((val) => val === true, {
      message: "Debes aceptar los términos y condiciones para continuar",
    }),
});

export type RegistroInput = z.infer<typeof RegistroSchema>;

export const PRECIOS: Record<RegistroInput["tipo_acceso"], number> = {
  estudiante: 890,
  general: 5800,
  vip: 7200,
};
