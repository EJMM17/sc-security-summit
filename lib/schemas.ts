import { z } from "zod";
import { ACCESO_OPTIONS } from "./constants";

// ─── Registro Schema ──────────────────────────────────────────────────────────

export const RegistroSchema = z
  .object({
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
      .regex(/^\+?[0-9\s\-()]{7,20}$/, "Ingresa un número de teléfono válido")
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

    acepta_terminos: z.boolean().refine((val) => val === true, {
      message: "Debes aceptar los términos y condiciones para continuar",
    }),

    // ── CFDI fields (optional unless requiere_cfdi is true) ──────────────────
    requiere_cfdi: z.boolean().optional().default(false),

    rfc: z
      .string()
      .transform((v) => v.toUpperCase().trim())
      .pipe(
        z
          .string()
          .regex(
            /^([A-ZÑ&]{3,4})\d{6}([A-Z\d]{3})$/,
            "RFC inválido. Formato: XAXX010101000"
          )
      )
      .optional()
      .or(z.literal("")),

    razon_social: z
      .string()
      .min(3, "La razón social debe tener al menos 3 caracteres")
      .max(200, "La razón social no puede exceder 200 caracteres")
      .optional()
      .or(z.literal("")),

    codigo_postal_fiscal: z
      .string()
      .regex(/^\d{5}$/, "El código postal debe tener exactamente 5 dígitos")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    // If CFDI is required, validate the 3 fiscal fields
    if (data.requiere_cfdi) {
      if (!data.rfc || data.rfc.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El RFC es requerido para facturación CFDI",
          path: ["rfc"],
        });
      }
      if (!data.razon_social || data.razon_social.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La razón social es requerida para facturación CFDI",
          path: ["razon_social"],
        });
      }
      if (!data.codigo_postal_fiscal || data.codigo_postal_fiscal.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El código postal fiscal es requerido para facturación CFDI",
          path: ["codigo_postal_fiscal"],
        });
      }
    }
  });

export type RegistroInput = z.infer<typeof RegistroSchema>;

// ─── Precios — derived from ACCESO_OPTIONS (single source of truth) ──────────

export const PRECIOS = Object.fromEntries(
  ACCESO_OPTIONS.map((opt) => [
    opt.value,
    parseInt(opt.price.replace(/[^0-9]/g, ""), 10),
  ])
) as Record<RegistroInput["tipo_acceso"], number>;
