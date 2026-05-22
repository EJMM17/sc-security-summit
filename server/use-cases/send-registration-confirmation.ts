import "server-only";

import * as Sentry from "@sentry/nextjs";
import { sendEmail } from "@/lib/email";
import { confirmationEmailHtml, confirmationEmailSubject } from "@/lib/email-templates";
import { supabaseAdmin } from "@/lib/supabase";

const EMAIL_TYPE = "registration_confirmation";

export type SendRegistrationConfirmationParams = {
  folio: string;
  email: string;
  nombre: string;
  tipo_acceso: "estudiante" | "general" | "vip";
  monto_mxn: number;
  language: "es" | "en";
};

export type SendRegistrationConfirmationResult = {
  ok: boolean;
  status: "sent" | "failed" | "skipped_duplicate" | "skipped_no_api_key";
  error?: string;
  providerMessageId?: string;
};

/** Mask the local part of an email for privacy-safe logs. */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const head = local.slice(0, 2);
  return `${head}${local.length > 2 ? "***" : ""}@${domain}`;
}

function log(event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), event, ...data }));
}

/**
 * Send the registration confirmation email and record an audit row in
 * `email_events`. Idempotent: a folio that already has a `sent`
 * confirmation event will not be emailed again.
 *
 * This never throws — email delivery must not break a persisted
 * registration. Failures are logged, audited, and reported to Sentry as
 * warnings.
 */
export async function sendRegistrationConfirmation(
  params: SendRegistrationConfirmationParams,
): Promise<SendRegistrationConfirmationResult> {
  const { folio, email, nombre, tipo_acceso, monto_mxn, language } = params;
  const baseLog = { folio, email: maskEmail(email), provider: "resend" };

  log("registration_confirmation_email_attempt", { ...baseLog, status: "attempt" });

  try {
    // 1. Idempotency: skip if a confirmation was already sent for this folio.
    const { data: existing } = await supabaseAdmin
      .from("email_events")
      .select("id")
      .eq("folio", folio)
      .eq("type", EMAIL_TYPE)
      .eq("status", "sent")
      .limit(1)
      .maybeSingle();

    if (existing) {
      log("registration_confirmation_email_skipped_duplicate", {
        ...baseLog,
        status: "skipped_duplicate",
      });
      return { ok: true, status: "skipped_duplicate" };
    }

    // 2. Send.
    const result = await sendEmail({
      to: email,
      subject: confirmationEmailSubject(language, folio),
      html: confirmationEmailHtml({ nombre, folio, tipo_acceso, monto_mxn, language }),
    });

    const status: SendRegistrationConfirmationResult["status"] = result.ok
      ? "sent"
      : result.code === "missing_api_key"
        ? "skipped_no_api_key"
        : "failed";

    // 3. Audit row. Insert failures must not change the email outcome.
    await recordEvent({
      folio,
      email,
      status,
      providerMessageId: result.ok ? result.id : undefined,
      error: result.ok ? undefined : result.error,
      metadata: { tipo_acceso, monto_mxn, language },
    });

    if (result.ok) {
      log("registration_confirmation_email_sent", {
        ...baseLog,
        status: "sent",
        providerMessageId: result.id,
      });
      return { ok: true, status: "sent", providerMessageId: result.id };
    }

    if (status === "skipped_no_api_key") {
      log("registration_confirmation_email_skipped_no_api_key", {
        ...baseLog,
        status: "skipped_no_api_key",
      });
      Sentry.captureMessage("registration_confirmation_email_skipped_no_api_key", {
        level: "warning",
        tags: { use_case: "registration_confirmation_email", provider: "resend" },
        extra: { folio, email: maskEmail(email), status, error: result.error },
      });
      return { ok: false, status: "skipped_no_api_key", error: result.error };
    }

    log("registration_confirmation_email_failed", {
      ...baseLog,
      status: "failed",
      error: result.error,
    });
    Sentry.captureMessage("registration_confirmation_email_failed", {
      level: "warning",
      tags: { use_case: "registration_confirmation_email", provider: "resend" },
      extra: { folio, email: maskEmail(email), status, error: result.error },
    });
    return { ok: false, status: "failed", error: result.error };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    log("registration_confirmation_email_failed", { ...baseLog, status: "failed", error });
    Sentry.captureException(err, {
      level: "warning",
      tags: { use_case: "registration_confirmation_email", provider: "resend" },
      extra: { folio, email: maskEmail(email), status: "failed" },
    });
    return { ok: false, status: "failed", error };
  }
}

async function recordEvent(params: {
  folio: string;
  email: string;
  status: string;
  providerMessageId?: string;
  error?: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabaseAdmin.from("email_events").insert({
    folio: params.folio,
    email: params.email,
    type: EMAIL_TYPE,
    provider: "resend",
    status: params.status,
    provider_message_id: params.providerMessageId ?? null,
    error: params.error ?? null,
    metadata: params.metadata,
  });

  if (error) {
    // Unique-index race (two concurrent submits): the email was sent once,
    // a second 'sent' row collides. Treat as benign — the audit trail
    // already has the winning row.
    if (error.code === "23505") {
      log("registration_confirmation_email_skipped_duplicate", {
        folio: params.folio,
        status: "skipped_duplicate",
        reason: "unique_constraint",
      });
      return;
    }
    log("registration_confirmation_email_audit_failed", {
      folio: params.folio,
      error: error.message,
    });
    Sentry.captureMessage("registration_confirmation_email_audit_failed", {
      level: "warning",
      tags: { use_case: "registration_confirmation_email", provider: "resend" },
      extra: { folio: params.folio, code: error.code, error: error.message },
    });
  }
}
