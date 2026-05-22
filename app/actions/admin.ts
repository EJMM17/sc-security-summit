"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import {
  clearSessionCookie,
  hashPassword,
  requireAdmin,
  setSessionCookie,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import { checkRateLimit, RateLimitError } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import {
  confirmationEmailHtml,
  confirmationEmailSubject,
} from "@/lib/email-templates";

function auditLog(event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), event, ...data }));
}

// =============================================================
// Login
// =============================================================

export type LoginState = { ok: boolean; message: string };

const LoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(255),
});

const NEUTRAL_LOGIN_MESSAGE = "Credenciales incorrectas";

export async function loginAdmin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const h = await headers();
  const ip =
    h.get("cf-connecting-ip") ??
    h.get("x-forwarded-for")?.split(",")[0].trim() ??
    h.get("x-real-ip") ??
    "unknown";

  try {
    await checkRateLimit(`admin:login:${ip}`);
  } catch (err) {
    if (err instanceof RateLimitError) {
      auditLog("admin_login_rate_limited", { ip });
      return { ok: false, message: "Demasiados intentos. Intenta en unos minutos." };
    }
    throw err;
  }

  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, message: NEUTRAL_LOGIN_MESSAGE };
  }

  const { email, password } = parsed.data;

  const admin = await verifyAdminCredentials(email, password);
  if (!admin) {
    auditLog("admin_login_failed", { ip, email_suffix: email.split("@")[1] });
    return { ok: false, message: NEUTRAL_LOGIN_MESSAGE };
  }

  await setSessionCookie(admin);
  auditLog("admin_login_success", { ip, admin: admin.email });
  redirect("/admin/registros");
}

// =============================================================
// Logout
// =============================================================

export async function adminLogout(): Promise<never> {
  await clearSessionCookie();
  redirect("/admin/login");
}

// =============================================================
// Shared helpers
// =============================================================

const FolioSchema = z.string().regex(/^SCSS2026-[A-Z0-9-]+$/);
const REGISTROS_PATH = "/admin/registros";

// =============================================================
// Mark a registration as paid (manual transfer)
// =============================================================

export async function markRegistroPaid(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const folio = FolioSchema.safeParse(formData.get("folio"));
  if (!folio.success) return;
  const note = String(formData.get("note") ?? "").slice(0, 500);

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("registros")
    .update({
      estado_pago: "pagado",
      pagado_en: new Date().toISOString(),
      pagado_por: admin.email,
      pago_nota: note || null,
    })
    .eq("folio", folio.data)
    .eq("estado_pago", "pendiente");

  if (error) {
    auditLog("admin_mark_paid_failed", { folio: folio.data, error: error.message });
    Sentry.captureException(new Error(`mark_paid: ${error.message}`), {
      extra: { folio: folio.data },
    });
    return;
  }

  await supabase.from("audit_log").insert({
    evento: "pago_confirmado",
    folio: folio.data,
    usuario_email: admin.email,
    detalles: { notas: note || null },
  });

  auditLog("admin_mark_paid", { folio: folio.data, by: admin.email });
  revalidatePath(REGISTROS_PATH);
}

// =============================================================
// Mark a registration as cancelled
// =============================================================

export async function markRegistroCancelled(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const folio = FolioSchema.safeParse(formData.get("folio"));
  if (!folio.success) return;
  const note = String(formData.get("note") ?? "").slice(0, 500);

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("registros")
    .update({
      estado_pago: "cancelado",
      cancelado_en: new Date().toISOString(),
      cancelado_por: admin.email,
      cancelacion_nota: note || null,
    })
    .eq("folio", folio.data);

  if (error) {
    auditLog("admin_mark_cancelled_failed", { folio: folio.data, error: error.message });
    Sentry.captureException(new Error(`mark_cancelled: ${error.message}`), {
      extra: { folio: folio.data },
    });
    return;
  }

  await supabase.from("audit_log").insert({
    evento: "registro_cancelado",
    folio: folio.data,
    usuario_email: admin.email,
    detalles: { notas: note || null },
  });

  auditLog("admin_mark_cancelled", { folio: folio.data, by: admin.email });
  revalidatePath(REGISTROS_PATH);
}

// =============================================================
// Revert a paid registration back to pending
// =============================================================

export async function revertRegistroPendiente(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const folio = FolioSchema.safeParse(formData.get("folio"));
  if (!folio.success) return;
  const note = String(formData.get("note") ?? "").slice(0, 500);

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("registros")
    .update({
      estado_pago: "pendiente",
      pagado_en: null,
      pagado_por: null,
      pago_nota: null,
    })
    .eq("folio", folio.data)
    .eq("estado_pago", "pagado");

  if (error) {
    auditLog("admin_revert_failed", { folio: folio.data, error: error.message });
    Sentry.captureException(new Error(`revert_pendiente: ${error.message}`), {
      extra: { folio: folio.data },
    });
    return;
  }

  await supabase.from("audit_log").insert({
    evento: "pago_revertido",
    folio: folio.data,
    usuario_email: admin.email,
    detalles: { notas: note || null },
  });

  auditLog("admin_revert_pendiente", { folio: folio.data, by: admin.email });
  revalidatePath(REGISTROS_PATH);
}

// =============================================================
// Resend confirmation email
// =============================================================

export type ResendEmailState = { ok: boolean; message: string };

export async function resendConfirmationEmail(
  _prev: ResendEmailState,
  formData: FormData,
): Promise<ResendEmailState> {
  const admin = await requireAdmin();
  const folio = FolioSchema.safeParse(formData.get("folio"));
  if (!folio.success) return { ok: false, message: "Folio inválido." };

  const supabase = createAdminClient();
  const { data: registro, error } = await supabase
    .from("registros")
    .select("folio,nombre,apellido,email,tipo_acceso,monto_mxn")
    .eq("folio", folio.data)
    .single();

  if (error || !registro) {
    return { ok: false, message: "Registro no encontrado." };
  }

  const html = confirmationEmailHtml({
    nombre: registro.nombre,
    folio: registro.folio,
    tipo_acceso: registro.tipo_acceso,
    monto_mxn: registro.monto_mxn,
    language: "es",
  });

  const result = await sendEmail({
    to: registro.email,
    subject: confirmationEmailSubject("es", registro.folio),
    html,
  });

  // Audit every resend attempt in email_events (separate type so it never
  // collides with the original confirmation idempotency guard).
  await supabase.from("email_events").insert({
    folio: registro.folio,
    email: registro.email,
    type: "registration_confirmation_resend",
    provider: "resend",
    status: result.ok ? "sent" : "failed",
    provider_message_id: result.ok ? (result.id ?? null) : null,
    error: result.ok ? null : result.error,
    metadata: {
      tipo_acceso: registro.tipo_acceso,
      monto_mxn: registro.monto_mxn,
      resent_by: admin.email,
    },
  });

  if (!result.ok) {
    auditLog("admin_resend_email_failed", { folio: folio.data, error: result.error });
    Sentry.captureException(new Error(`resend_email: ${result.error}`), {
      extra: { folio: folio.data },
    });
    return { ok: false, message: "Error al enviar el correo. Intenta de nuevo." };
  }

  await supabase.from("audit_log").insert({
    evento: "email_reenviado",
    folio: folio.data,
    usuario_email: admin.email,
    detalles: { destinatario: registro.email },
  });

  auditLog("admin_resend_email", { folio: folio.data, to: registro.email, by: admin.email });
  return { ok: true, message: `Correo enviado a ${registro.email}` };
}

// =============================================================
// Edit registro fields
// =============================================================

export type UpdateRegistroState = { ok: boolean; message: string };

const UpdateRegistroSchema = z.object({
  folio: z.string().regex(/^SCSS2026-[A-Z0-9-]+$/),
  nombre: z.string().trim().min(2).max(120),
  apellido: z.string().trim().min(2).max(120),
  empresa: z.string().trim().min(2).max(255),
  cargo: z.string().trim().min(2).max(120),
  telefono: z.string().trim().max(30).optional().or(z.literal("")),
  metodo_pago: z.string().trim().max(60).optional().or(z.literal("")),
});

export async function updateRegistro(
  _prev: UpdateRegistroState,
  formData: FormData,
): Promise<UpdateRegistroState> {
  const admin = await requireAdmin();

  const parsed = UpdateRegistroSchema.safeParse({
    folio: formData.get("folio"),
    nombre: formData.get("nombre"),
    apellido: formData.get("apellido"),
    empresa: formData.get("empresa"),
    cargo: formData.get("cargo"),
    telefono: formData.get("telefono"),
    metodo_pago: formData.get("metodo_pago"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Datos inválidos. Revisa los campos." };
  }

  const { folio, ...fields } = parsed.data;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("registros")
    .update({
      nombre: fields.nombre,
      apellido: fields.apellido,
      empresa: fields.empresa,
      cargo: fields.cargo,
      telefono: fields.telefono || null,
      metodo_pago: fields.metodo_pago || null,
    })
    .eq("folio", folio);

  if (error) {
    auditLog("admin_update_registro_failed", { folio, error: error.message });
    Sentry.captureException(new Error(`update_registro: ${error.message}`), {
      extra: { folio },
    });
    return { ok: false, message: "Error al actualizar el registro." };
  }

  await supabase.from("audit_log").insert({
    evento: "registro_editado",
    folio,
    usuario_email: admin.email,
    detalles: { campos: Object.keys(fields) },
  });

  auditLog("admin_update_registro", { folio, by: admin.email });
  revalidatePath(REGISTROS_PATH);
  return { ok: true, message: "Registro actualizado correctamente." };
}

// =============================================================
// Bulk actions
// =============================================================

export type BulkActionState = { ok: boolean; message: string; count?: number };

function parseFolioList(raw: FormDataEntryValue | null): string[] {
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((f) => f.trim())
    .filter((f) => FolioSchema.safeParse(f).success);
}

export async function bulkMarkPaid(
  _prev: BulkActionState,
  formData: FormData,
): Promise<BulkActionState> {
  const admin = await requireAdmin();
  const folios = parseFolioList(formData.get("folios"));
  if (folios.length === 0) return { ok: false, message: "Sin folios seleccionados." };

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: updatedRows, error } = await supabase
    .from("registros")
    .update({
      estado_pago: "pagado",
      pagado_en: now,
      pagado_por: admin.email,
      pago_nota: null,
    })
    .in("folio", folios)
    .eq("estado_pago", "pendiente")
    .select("folio");

  if (error) {
    auditLog("admin_bulk_paid_failed", { folios, error: error.message });
    Sentry.captureException(new Error(`bulk_paid: ${error.message}`));
    return { ok: false, message: "Error en la operación masiva." };
  }

  const updated = updatedRows?.length ?? 0;

  if (updated > 0) {
    const auditRows = folios.map((f) => ({
      evento: "pago_confirmado",
      folio: f,
      usuario_email: admin.email,
      detalles: { bulk: true },
    }));
    await supabase.from("audit_log").insert(auditRows);
  }

  auditLog("admin_bulk_paid", { folios, updated, by: admin.email });
  revalidatePath(REGISTROS_PATH);
  return { ok: true, message: `${updated} registro(s) marcado(s) como pagado.`, count: updated };
}

export async function bulkMarkCancelled(
  _prev: BulkActionState,
  formData: FormData,
): Promise<BulkActionState> {
  const admin = await requireAdmin();
  const folios = parseFolioList(formData.get("folios"));
  if (folios.length === 0) return { ok: false, message: "Sin folios seleccionados." };

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: updatedRows, error } = await supabase
    .from("registros")
    .update({
      estado_pago: "cancelado",
      cancelado_en: now,
      cancelado_por: admin.email,
      cancelacion_nota: null,
    })
    .in("folio", folios)
    .select("folio");

  if (error) {
    auditLog("admin_bulk_cancelled_failed", { folios, error: error.message });
    Sentry.captureException(new Error(`bulk_cancelled: ${error.message}`));
    return { ok: false, message: "Error en la operación masiva." };
  }

  const updated = updatedRows?.length ?? 0;

  if (updated > 0) {
    const auditRows = folios.map((f) => ({
      evento: "registro_cancelado",
      folio: f,
      usuario_email: admin.email,
      detalles: { bulk: true },
    }));
    await supabase.from("audit_log").insert(auditRows);
  }

  auditLog("admin_bulk_cancelled", { folios, updated, by: admin.email });
  revalidatePath(REGISTROS_PATH);
  return {
    ok: true,
    message: `${updated} registro(s) marcado(s) como cancelado.`,
    count: updated,
  };
}

// =============================================================
// Admin management
// =============================================================

const AdminEmailSchema = z.string().email().max(255);
const AdminPasswordSchema = z
  .string()
  .min(12, "La contraseña debe tener al menos 12 caracteres")
  .max(255);
const AdminNameSchema = z.string().trim().min(1).max(255);

export type AdminCrudState = { ok: boolean; message: string };

export async function createAdmin(_prev: AdminCrudState, formData: FormData): Promise<AdminCrudState> {
  await requireAdmin();

  const parsed = z
    .object({
      email: AdminEmailSchema,
      nombre: AdminNameSchema,
      password: AdminPasswordSchema,
    })
    .safeParse({
      email: formData.get("email"),
      nombre: formData.get("nombre"),
      password: formData.get("password"),
    });

  if (!parsed.success) {
    return { ok: false, message: "Datos inválidos. Revisa los campos." };
  }

  const { email, nombre, password } = parsed.data;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("admins")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (existing) {
    return { ok: false, message: "Ya existe un administrador con ese correo." };
  }

  const passwordHash = await hashPassword(password);

  const { error } = await supabase.from("admins").insert({
    email: email.toLowerCase(),
    nombre,
    password_hash: passwordHash,
    active: true,
  });

  if (error) {
    auditLog("admin_create_failed", { email, error: error.message });
    return { ok: false, message: "Error al crear el administrador. Intenta de nuevo." };
  }

  auditLog("admin_created", { email });
  return { ok: true, message: "Administrador creado correctamente." };
}

export async function updateAdmin(_prev: AdminCrudState, formData: FormData): Promise<AdminCrudState> {
  await requireAdmin();

  const parsed = z
    .object({
      id: z.string().uuid(),
      nombre: AdminNameSchema,
      active: z.enum(["true", "false"]),
      password: z.string().max(255).optional().or(z.literal("")),
    })
    .safeParse({
      id: formData.get("id"),
      nombre: formData.get("nombre"),
      active: formData.get("active"),
      password: formData.get("password"),
    });

  if (!parsed.success) {
    return { ok: false, message: "Datos inválidos." };
  }

  const { id, nombre, active, password } = parsed.data;
  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = {
    nombre,
    active: active === "true",
    updated_at: new Date().toISOString(),
  };

  if (password && password.length >= 6) {
    updateData.password_hash = await hashPassword(password);
  }

  const { error } = await supabase.from("admins").update(updateData).eq("id", id);

  if (error) {
    auditLog("admin_update_failed", { id, error: error.message });
    return { ok: false, message: "Error al actualizar el administrador." };
  }

  auditLog("admin_updated", { id });
  return { ok: true, message: "Administrador actualizado correctamente." };
}

export async function deleteAdmin(_prev: AdminCrudState, formData: FormData): Promise<AdminCrudState> {
  await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) {
    return { ok: false, message: "ID inválido." };
  }

  const supabase = createAdminClient();

  const { count } = await supabase
    .from("admins")
    .select("id", { count: "exact", head: true })
    .eq("active", true);

  if ((count ?? 0) <= 1) {
    return { ok: false, message: "No puedes eliminar el último administrador activo." };
  }

  const { error } = await supabase.from("admins").delete().eq("id", id.data);

  if (error) {
    auditLog("admin_delete_failed", { id: id.data, error: error.message });
    return { ok: false, message: "Error al eliminar el administrador." };
  }

  auditLog("admin_deleted", { id: id.data });
  return { ok: true, message: "Administrador eliminado correctamente." };
}

export async function listAdmins() {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admins")
    .select("id, email, nombre, active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    Sentry.captureException(new Error(`listAdmins: ${error.message}`));
    return [];
  }
  return data ?? [];
}
