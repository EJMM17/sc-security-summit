"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import {
  buildLoginUrl,
  clearSessionCookie,
  isAllowedEmail,
  mintLoginToken,
  requireAdmin,
} from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendAdminLoginLink } from "@/lib/email";

function auditLog(event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), event, ...data }));
}

// =============================================================
// Magic-link request
// =============================================================

export type LoginState = { ok: boolean; message: string };

const LoginSchema = z.string().email().max(255);

const NEUTRAL_LOGIN_MESSAGE =
  "Si tu correo está autorizado, recibirás un link de acceso en los próximos minutos.";

export async function requestAdminLogin(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? "unknown";

  // Reuse the same Upstash window so an attacker brute-forcing emails hits
  // the global rate limit fast.
  const rl = await checkRateLimit(`admin-login:${ip}`);
  if (!rl.ok) {
    auditLog("admin_login_rate_limited", { ip });
    return { ok: false, message: "Demasiados intentos. Espera 15 minutos." };
  }

  const parsed = LoginSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { ok: false, message: "Correo inválido." };
  }
  const email = parsed.data.toLowerCase().trim();

  // Privacy: same response whether email is allow-listed or not so we can't
  // be used to enumerate admin emails.
  if (!isAllowedEmail(email)) {
    auditLog("admin_login_email_not_allowed", { ip, email_suffix: email.split("@")[1] });
    return { ok: true, message: NEUTRAL_LOGIN_MESSAGE };
  }

  try {
    const token = mintLoginToken(email);
    const url = buildLoginUrl(token);
    const result = await sendAdminLoginLink({ to: email, url });
    if (!result.ok) {
      auditLog("admin_login_email_failed", { ip, reason: result.error });
      Sentry.captureMessage("admin_login_email_failed", {
        level: "error",
        extra: { reason: result.error },
      });
    } else {
      auditLog("admin_login_email_sent", { ip });
    }
  } catch (err) {
    auditLog("admin_login_unexpected_error", {
      ip,
      error: err instanceof Error ? err.message : "unknown",
    });
    Sentry.captureException(err, { tags: { surface: "admin_login" } });
  }

  return { ok: true, message: NEUTRAL_LOGIN_MESSAGE };
}

// =============================================================
// Logout
// =============================================================

export async function adminLogout(): Promise<never> {
  await clearSessionCookie();
  redirect("/admin/login");
}

// =============================================================
// Mark a registration as paid (manual SPEI/transfer)
// =============================================================

const FolioSchema = z.string().regex(/^SCSS2026-[A-Z0-9-]+$/);

export async function markRegistroPaid(formData: FormData): Promise<void> {
  const adminEmail = await requireAdmin();
  const folio = FolioSchema.safeParse(formData.get("folio"));
  if (!folio.success) return;
  const note = String(formData.get("note") ?? "").slice(0, 500);

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("registros")
    .update({
      estado_pago: "pagado",
      pagado_en: new Date().toISOString(),
      pagado_por: adminEmail,
      pago_nota: note || null,
    })
    .eq("folio", folio.data);

  if (error) {
    auditLog("admin_mark_paid_failed", { folio: folio.data, error: error.message });
    Sentry.captureException(new Error(`mark_paid: ${error.message}`), {
      extra: { folio: folio.data },
    });
    return;
  }
  auditLog("admin_mark_paid", { folio: folio.data, by: adminEmail });
}

export async function markRegistroCancelled(formData: FormData): Promise<void> {
  const adminEmail = await requireAdmin();
  const folio = FolioSchema.safeParse(formData.get("folio"));
  if (!folio.success) return;
  const note = String(formData.get("note") ?? "").slice(0, 500);

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("registros")
    .update({
      estado_pago: "cancelado",
      cancelado_en: new Date().toISOString(),
      cancelado_por: adminEmail,
      cancelacion_nota: note || null,
    })
    .eq("folio", folio.data);

  if (error) {
    auditLog("admin_mark_cancelled_failed", { folio: folio.data, error: error.message });
    return;
  }
  auditLog("admin_mark_cancelled", { folio: folio.data, by: adminEmail });
}
