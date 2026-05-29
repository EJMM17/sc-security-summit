import "server-only";

import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { generateFolio } from "@/lib/folio";
import { PRECIOS } from "@/lib/schemas";
import { supabaseAdmin } from "@/lib/supabase";
import { sendRegistrationConfirmation } from "@/server/use-cases/send-registration-confirmation";

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
  // Extended attribution (persisted only if the DB columns exist — see
  // migration 010_attribution_columns.sql; insert falls back gracefully).
  utm_term: z.string().nullable().optional(),
  utm_content: z.string().nullable().optional(),
  gclid: z.string().nullable().optional(),
  gbraid: z.string().nullable().optional(),
  wbraid: z.string().nullable().optional(),
  fbclid: z.string().nullable().optional(),
  li_fat_id: z.string().nullable().optional(),
  msclkid: z.string().nullable().optional(),
  landing_page: z.string().nullable().optional(),
  referrer: z.string().nullable().optional(),
  first_touch_timestamp: z.string().nullable().optional(),
  last_touch_timestamp: z.string().nullable().optional(),
});

/** True when a Supabase error means a column is not in the schema cache. */
function isMissingColumnError(error: {
  code?: string;
  message?: string;
}): boolean {
  if (error.code === "PGRST204" || error.code === "42703") return true;
  return /column .* does not exist|could not find the .* column/i.test(
    error.message ?? "",
  );
}

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

    // Extended attribution columns. Kept separate so we can retry without
    // them if the migration hasn't been applied yet (no broken registrations).
    const attributionPayload: Record<string, unknown> = {
      utm_term: data.utm_term ?? null,
      utm_content: data.utm_content ?? null,
      gclid: data.gclid ?? null,
      gbraid: data.gbraid ?? null,
      wbraid: data.wbraid ?? null,
      fbclid: data.fbclid ?? null,
      li_fat_id: data.li_fat_id ?? null,
      msclkid: data.msclkid ?? null,
      landing_page: data.landing_page ?? null,
      referrer: data.referrer ?? null,
      first_touch_timestamp: data.first_touch_timestamp || null,
      last_touch_timestamp: data.last_touch_timestamp || null,
    };

    const insert = (payload: Record<string, unknown>) =>
      supabaseAdmin.from("registros").insert(payload);

    let { error } = await insert({ ...insertPayload, ...attributionPayload });

    // Migration not applied yet → retry with only the base columns so the
    // registration still succeeds. Attribution is logged for visibility.
    if (error && isMissingColumnError(error)) {
      Sentry.captureMessage("create_lead.attribution_columns_missing", {
        level: "warning",
        tags: { use_case: "create_lead" },
        extra: { code: error.code, message: error.message },
      });
      ({ error } = await insert(insertPayload));
    }

    if (error) {
      if (error.code === "23505") {
        return {
          ok: false,
          status: 409,
          message: "Este correo electrónico ya tiene un registro activo.",
          fieldErrors: { email: ["Este correo ya está registrado para el evento."] },
        };
      }

      // DB-level capacity trigger (migration 007)
      if (error.hint === "CAPACITY_EXCEEDED" || error.message?.includes("capacity_exceeded")) {
        return {
          ok: false,
          status: 409,
          message:
            data.language === "en"
              ? "We're sorry — all seats for the event are sold out."
              : "Lo sentimos, los cupos para este evento se han agotado.",
        };
      }

      throw new Error(`supabase_insert_failed:${error.code}:${error.message}`);
    }

    // Send the confirmation email. A failure here MUST NOT fail the
    // registration — the row is already persisted and the folio is shown
    // on screen as a fallback. The sender audits every outcome and reports
    // problems to Sentry as warnings.
    const emailResult = await sendRegistrationConfirmation({
      folio,
      email: data.email,
      nombre: data.nombre,
      tipo_acceso: data.tipo_acceso,
      monto_mxn: monto,
      language: data.language,
    });

    if (emailResult.status === "failed" || emailResult.status === "skipped_no_api_key") {
      Sentry.captureMessage("create_lead.confirmation_email_not_delivered", {
        level: "warning",
        tags: { use_case: "create_lead" },
        extra: { folio, status: emailResult.status, error: emailResult.error },
      });
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
