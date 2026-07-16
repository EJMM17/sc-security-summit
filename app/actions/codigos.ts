"use server";

import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { CODIGO_DESCUENTO_REGEX } from "@/lib/descuentos";
import { createAdminClient } from "@/lib/supabase";

const CODIGOS_PATH = "/admin/codigos";

function auditLog(event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), event, ...data }));
}

export type CodigoRow = {
  id: string;
  codigo: string;
  descripcion: string | null;
  tipo_descuento: "porcentaje" | "monto_fijo";
  valor: number;
  aplica_a: string[] | null;
  max_usos: number | null;
  usos: number;
  valido_desde: string;
  valido_hasta: string | null;
  activo: boolean;
  created_by: string | null;
  created_at: string;
};

export async function listCodigos(): Promise<CodigoRow[]> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("codigos_descuento")
    .select(
      "id,codigo,descripcion,tipo_descuento,valor,aplica_a,max_usos,usos,valido_desde,valido_hasta,activo,created_by,created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    Sentry.captureException(new Error(`listCodigos: ${error.message}`));
    return [];
  }
  return (data ?? []) as CodigoRow[];
}

// =============================================================
// Create
// =============================================================

export type CodigoCrudState = { ok: boolean; message: string };

const TIERS = ["estudiante", "general", "vip"] as const;

const CreateCodigoSchema = z
  .object({
    codigo: z
      .string()
      .transform((v) => v.trim().toUpperCase())
      .pipe(
        z
          .string()
          .regex(
            CODIGO_DESCUENTO_REGEX,
            "Código inválido: 4–32 caracteres, solo A-Z, 0-9, guion y guion bajo.",
          ),
      ),
    descripcion: z.string().trim().max(300).optional().or(z.literal("")),
    tipo_descuento: z.enum(["porcentaje", "monto_fijo"]),
    valor: z.coerce.number().positive("El valor debe ser mayor a 0"),
    aplica_a: z.array(z.enum(TIERS)).optional(),
    max_usos: z.coerce.number().int().positive().optional(),
    valido_hasta: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.tipo_descuento === "porcentaje" && data.valor > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Un porcentaje no puede ser mayor a 100.",
        path: ["valor"],
      });
    }
  });

export async function createCodigo(
  _prev: CodigoCrudState,
  formData: FormData,
): Promise<CodigoCrudState> {
  const admin = await requireAdmin();

  const aplicaA = TIERS.filter((t) => formData.get(`aplica_${t}`) === "on");
  const maxUsosRaw = String(formData.get("max_usos") ?? "").trim();
  const validoHastaRaw = String(formData.get("valido_hasta") ?? "").trim();

  const parsed = CreateCodigoSchema.safeParse({
    codigo: formData.get("codigo"),
    descripcion: formData.get("descripcion"),
    tipo_descuento: formData.get("tipo_descuento"),
    valor: formData.get("valor"),
    // Sin checkboxes o con los 3 marcados = aplica a todos (NULL en BD).
    aplica_a: aplicaA.length > 0 && aplicaA.length < TIERS.length ? aplicaA : undefined,
    max_usos: maxUsosRaw ? maxUsosRaw : undefined,
    valido_hasta: validoHastaRaw,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Datos inválidos. Revisa los campos.",
    };
  }

  const d = parsed.data;

  let validoHasta: string | null = null;
  if (d.valido_hasta) {
    const date = new Date(`${d.valido_hasta}T23:59:59-06:00`);
    if (Number.isNaN(date.getTime())) {
      return { ok: false, message: "Fecha de vigencia inválida." };
    }
    validoHasta = date.toISOString();
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("codigos_descuento").insert({
    codigo: d.codigo,
    descripcion: d.descripcion || null,
    tipo_descuento: d.tipo_descuento,
    valor: d.valor,
    aplica_a: d.aplica_a ?? null,
    max_usos: d.max_usos ?? null,
    valido_hasta: validoHasta,
    activo: true,
    created_by: admin.email,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: `Ya existe un código "${d.codigo}".` };
    }
    auditLog("admin_create_codigo_failed", { codigo: d.codigo, error: error.message });
    Sentry.captureException(new Error(`create_codigo: ${error.message}`), {
      extra: { codigo: d.codigo },
    });
    return { ok: false, message: "Error al crear el código. Intenta de nuevo." };
  }

  await supabase.from("audit_log").insert({
    evento: "codigo_creado",
    folio: null,
    usuario_email: admin.email,
    detalles: {
      codigo: d.codigo,
      tipo_descuento: d.tipo_descuento,
      valor: d.valor,
      aplica_a: d.aplica_a ?? "todos",
      max_usos: d.max_usos ?? "ilimitado",
    },
  });

  auditLog("admin_create_codigo", { codigo: d.codigo, by: admin.email });
  revalidatePath(CODIGOS_PATH);
  return { ok: true, message: `Código ${d.codigo} creado correctamente.` };
}

// =============================================================
// Activate / deactivate (no se eliminan: histórico + auditoría)
// =============================================================

export async function toggleCodigo(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const parsed = z
    .object({
      id: z.string().uuid(),
      activo: z.enum(["true", "false"]),
    })
    .safeParse({ id: formData.get("id"), activo: formData.get("activo") });

  if (!parsed.success) return;

  const nextActivo = parsed.data.activo === "true";
  const supabase = createAdminClient();

  const { data: updated, error } = await supabase
    .from("codigos_descuento")
    .update({ activo: nextActivo })
    .eq("id", parsed.data.id)
    .select("codigo")
    .maybeSingle();

  if (error || !updated) {
    auditLog("admin_toggle_codigo_failed", {
      id: parsed.data.id,
      error: error?.message ?? "not_found",
    });
    if (error) {
      Sentry.captureException(new Error(`toggle_codigo: ${error.message}`), {
        extra: { id: parsed.data.id },
      });
    }
    return;
  }

  await supabase.from("audit_log").insert({
    evento: nextActivo ? "codigo_activado" : "codigo_desactivado",
    folio: null,
    usuario_email: admin.email,
    detalles: { codigo: updated.codigo },
  });

  auditLog("admin_toggle_codigo", {
    codigo: updated.codigo,
    activo: nextActivo,
    by: admin.email,
  });
  revalidatePath(CODIGOS_PATH);
}
