"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import {
  clearSessionCookie,
  hashPassword,
  requireAdmin,
  setSessionCookie,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase";

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
    h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? "unknown";

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
// Mark a registration as paid (manual transfer)
// =============================================================

const FolioSchema = z.string().regex(/^SCSS2026-[A-Z0-9-]+$/);

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
}

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
    return;
  }

  await supabase.from("audit_log").insert({
    evento: "registro_cancelado",
    folio: folio.data,
    usuario_email: admin.email,
    detalles: { notas: note || null },
  });

  auditLog("admin_mark_cancelled", { folio: folio.data, by: admin.email });
}

// =============================================================
// Admin management
// =============================================================

const AdminEmailSchema = z.string().email().max(255);
const AdminPasswordSchema = z.string().min(6).max(255);
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
