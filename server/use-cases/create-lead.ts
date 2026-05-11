import "server-only";

import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { generateFolio } from "@/lib/folio";
import { PRECIOS } from "@/lib/schemas";
import { supabaseAdmin } from "@/lib/supabase";

const createLeadInputSchema = z.object({
  nombre: z.string().trim().min(2),
  apellido: z.string().trim().min(2),
  email: z.string().trim().email(),
  telefono: z.string().trim().optional().default(""),
  empresa: z.string().trim().min(2),
  cargo: z.string().trim().min(2),
  tipo_acceso: z.enum(["estudiante", "general", "vip"]),
  credencial_estudiantil: z.boolean().default(false),
  requiere_cfdi: z.boolean().default(false),
  rfc: z.string().trim().optional(),
  razon_social: z.string().trim().optional(),
  codigo_postal_fiscal: z.string().trim().optional(),
  language: z.enum(["es", "en"]).default("es"),
  ip: z.string().min(1),
  userAgent: z.string().default("unknown"),
  referer: z.string().nullable().optional(),
  utm_source: z.string().nullable().optional(),
  utm_medium: z.string().nullable().optional(),
  utm_campaign: z.string().nullable().optional(),
});

export type CreateLeadInput = z.input<typeof createLeadInputSchema>;

export type CreateLeadResult =
  | { ok: true; folio: string; tipo: "estudiante" | "general" | "vip"; monto: number; message: string }
  | {
      ok: false;
      status: 400 | 409 | 429 | 500;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export async function createLead(input: CreateLeadInput): Promise<CreateLeadResult> {
  try {
    const parsed = createLeadInputSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        status: 400,
        message: "Invalid registration payload.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const data = parsed.data;

    if (data.tipo_acceso === "estudiante" && !data.credencial_estudiantil) {
      return {
        ok: false,
        status: 400,
        message: "Student access requires a valid student credential.",
        fieldErrors: {
          credencial_estudiantil: [
            "Confirma que presentarás credencial estudiantil vigente",
          ],
        },
      };
    }

    const { data: cuposData, error: cuposError } = await supabaseAdmin.rpc(
      "get_cupos_disponibles",
    );

    if (cuposError) {
      Sentry.captureMessage("createLead.capacity_check_failed", {
        level: "warning",
        extra: { code: cuposError.code, message: cuposError.message },
      });
    } else {
      const cuposDisponibles = typeof cuposData === "number" ? cuposData : 0;
      if (cuposDisponibles <= 0) {
        return {
          ok: false,
          status: 409,
          message:
            data.language === "en"
              ? "We're sorry — all seats for the event are sold out."
              : "Lo sentimos, los cupos para este evento se han agotado.",
        };
      }
    }

    const folio = generateFolio();
    const monto = PRECIOS[data.tipo_acceso];

    const insertPayload: Record<string, unknown> = {
      folio,
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email,
      telefono: data.telefono || null,
      empresa: data.empresa,
      cargo: data.cargo,
      tipo_acceso: data.tipo_acceso,
      monto_mxn: monto,
      estado_pago: "pendiente",
      metodo_pago: "transferencia_manual",
      credencial_estudiantil: data.credencial_estudiantil,
      requiere_cfdi: data.requiere_cfdi,
      created_at: new Date().toISOString(),
      ip_registro: data.ip,
      user_agent: data.userAgent,
      referer: data.referer ?? null,
      utm_source: data.utm_source ?? null,
      utm_medium: data.utm_medium ?? null,
      utm_campaign: data.utm_campaign ?? null,
    };

    if (data.requiere_cfdi) {
      insertPayload.rfc = data.rfc?.toUpperCase() ?? null;
      insertPayload.razon_social = data.razon_social ?? null;
      insertPayload.codigo_postal_fiscal = data.codigo_postal_fiscal ?? null;
    }

    const { error } = await supabaseAdmin.from("registros").insert(insertPayload);

    if (error) {
      if (error.code === "23505") {
        return {
          ok: false,
          status: 409,
          message: "Este correo electrónico ya tiene un registro activo.",
          fieldErrors: { email: ["Este correo ya está registrado para el evento."] },
        };
      }

      throw new Error(`supabase_insert_failed:${error.code}:${error.message}`);
    }

    const message =
      data.language === "en"
        ? `Registration complete. Your confirmation folio is ${folio}.`
        : `Registro completado exitosamente. Tu folio de confirmación es ${folio}.`;

    return { ok: true, folio, tipo: data.tipo_acceso, monto, message };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { use_case: "create_lead" },
      extra: { inputEmail: input.email, ip: input.ip },
    });

    return {
      ok: false,
      status: 500,
      message: "Error interno procesando el registro. Intenta nuevamente.",
    };
  }
}
