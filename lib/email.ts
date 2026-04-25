import "server-only";

import { Resend } from "resend";
import { env } from "@/env";
import {
  buildAdminLoginLink,
  buildOrganizerNotification,
  buildRegistrationConfirmation,
  type OrganizerEmailData,
  type RegistrationEmailData,
} from "./email-templates";

export type SendResult = { ok: true; id: string } | { ok: false; error: string };

export const resend = new Resend(env.RESEND_API_KEY);

async function send(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
  tag: string;
}): Promise<SendResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: args.to,
      replyTo: env.CONTACT_EMAIL,
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
  data: RegistrationEmailData & { to: string }
): Promise<SendResult> {
  const { subject, html, text } = buildRegistrationConfirmation(data);
  return send({ to: data.to, subject, html, text, tag: "registration_confirmation" });
}

export async function sendOrganizerNotification(data: OrganizerEmailData): Promise<SendResult> {
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
