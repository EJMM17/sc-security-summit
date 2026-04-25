// =============================================================
// Transactional email service — Resend
// =============================================================
// Send-side concerns only: client init, error handling, logging.
// Template rendering lives in lib/email-templates.ts.
//
// Failure semantics:
//   • In production, if RESEND_API_KEY is missing the module throws on
//     first send so we don't silently drop confirmation emails.
//   • In dev without an API key, sends are logged to stdout instead.
//   • Send failures resolve to { ok: false, error } so callers can use
//     Promise.allSettled and continue the registration flow.
// =============================================================

import { Resend } from "resend";
import {
  buildOrganizerNotification,
  buildRegistrationConfirmation,
  type OrganizerEmailData,
  type RegistrationEmailData,
} from "./email-templates";

export type SendResult = { ok: true; id: string } | { ok: false; error: string };

let _resend: Resend | null = null;
let _devLogged = false;

function getResend(): Resend | null {
  if (_resend) return _resend;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[email] RESEND_API_KEY is required in production");
    }
    if (!_devLogged) {
      console.warn("[email] RESEND_API_KEY no configurada — emails se imprimirán a consola en dev");
      _devLogged = true;
    }
    return null;
  }

  _resend = new Resend(apiKey);
  return _resend;
}

function getFromAddress(): string {
  return (
    process.env.EMAIL_FROM ??
    "SC Security Summit <noreply@scsecuritysummit.com>"
  );
}

function getReplyTo(): string {
  return process.env.CONTACT_EMAIL ?? "Contacto@LanzLogistics.com";
}

async function send(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
  tag: string;
}): Promise<SendResult> {
  const resend = getResend();

  // Dev fallback: print to stdout so developers can see what would have shipped
  if (!resend) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event: "email_dev_stub",
        tag: args.tag,
        to: args.to,
        subject: args.subject,
        textPreview: args.text.slice(0, 240),
      })
    );
    return { ok: true, id: "dev-stub" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: args.to,
      replyTo: getReplyTo(),
      subject: args.subject,
      html: args.html,
      text: args.text,
      headers: {
        // Help inbox providers cluster transactional traffic
        "X-Entity-Ref-ID": args.tag,
      },
      tags: [{ name: "category", value: args.tag }],
    });

    if (error) {
      return { ok: false, error: error.message ?? String(error) };
    }
    return { ok: true, id: data?.id ?? "unknown" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function sendRegistrationConfirmation(
  data: RegistrationEmailData & { to: string }
): Promise<SendResult> {
  const { subject, html, text } = buildRegistrationConfirmation(data);
  return send({
    to: data.to,
    subject,
    html,
    text,
    tag: "registration_confirmation",
  });
}

export async function sendOrganizerNotification(
  data: OrganizerEmailData
): Promise<SendResult> {
  const recipient = process.env.CONTACT_EMAIL;
  if (!recipient) {
    return { ok: false, error: "CONTACT_EMAIL not configured" };
  }
  const { subject, html, text } = buildOrganizerNotification(data);
  return send({
    to: recipient,
    subject,
    html,
    text,
    tag: "organizer_notification",
  });
}
