import "server-only";

import { Resend } from "resend";
import { env, features } from "@/env";
import {
  buildAdminLoginLink,
  buildOrganizerNotification,
  buildRegistrationConfirmation,
  type OrganizerEmailData,
  type RegistrationEmailData,
} from "./email-templates";

export type SendResult = { ok: true; id: string } | { ok: false; error: string };

const NOT_CONFIGURED: SendResult = { ok: false, error: "email-not-configured" };

// Lazy singleton — sin RESEND_API_KEY no instanciamos el cliente, así
// el módulo es importable durante `next build` aunque la clave falte.
let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!features.email) return null;
  if (!_resend) _resend = new Resend(env.RESEND_API_KEY!);
  return _resend;
}
export const resend = getResend();

const _warnedTags = new Set<string>();
function warnDisabledOnce(tag: string) {
  if (_warnedTags.has(tag)) return;
  _warnedTags.add(tag);
  console.warn(
    `[email] RESEND_API_KEY/EMAIL_FROM no configurados — envío "${tag}" omitido`,
  );
}

async function send(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
  tag: string;
}): Promise<SendResult> {
  const client = getResend();
  if (!client || !env.EMAIL_FROM) {
    warnDisabledOnce(args.tag);
    return NOT_CONFIGURED;
  }

  try {
    const { data, error } = await client.emails.send({
      from: env.EMAIL_FROM,
      to: args.to,
      replyTo: env.CONTACT_EMAIL ?? env.EMAIL_FROM,
      subject: args.subject,
      html: args.html,
      text: args.text,
      headers: { "X-Entity-Ref-ID": args.tag },
      tags: [{ name: "category", value: args.tag }],
    });

    if (error) {
      return { ok: false, error: error.message ?? String(error) };
    }
    return { ok: true, id: data?.id ?? "unknown" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendRegistrationConfirmation(
  data: RegistrationEmailData & { to: string },
): Promise<SendResult> {
  const { subject, html, text } = buildRegistrationConfirmation(data);
  return send({ to: data.to, subject, html, text, tag: "registration_confirmation" });
}

export async function sendOrganizerNotification(data: OrganizerEmailData): Promise<SendResult> {
  if (!env.CONTACT_EMAIL) {
    console.warn("[email] CONTACT_EMAIL no configurado — notificación a organizador omitida");
    return { ok: false, error: "contact-email-not-configured" };
  }
  const { subject, html, text } = buildOrganizerNotification(data);
  return send({
    to: env.CONTACT_EMAIL,
    subject,
    html,
    text,
    tag: "organizer_notification",
  });
}

export async function sendAdminLoginLink(args: { to: string; url: string }): Promise<SendResult> {
  const { subject, html, text } = buildAdminLoginLink({ url: args.url });
  return send({ to: args.to, subject, html, text, tag: "admin_login" });
}
