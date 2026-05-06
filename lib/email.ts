import "server-only";

import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";
import { env, features } from "@/env";
import {
  buildOrganizerNotification,
  buildPaymentConfirmation,
  buildPaymentReminder,
  buildRegistrationConfirmation,
  buildWaitlistNotification,
  type OrganizerEmailData,
  type PaymentConfirmationData,
  type PaymentReminderData,
  type RegistrationEmailData,
  type WaitlistEmailData,
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

// Retry policy: 3 attempts (initial + 2 retries) with exponential backoff
// (1s, 3s). Network blips and transient 5xx are usually recoverable. We do
// NOT retry on 4xx (validation errors) — those will fail again and waste budget.
const RETRY_DELAYS_MS = [1000, 3000];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sendOnce(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
  tag: string;
}): Promise<SendResult & { retryable?: boolean }> {
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
      const message = error.message ?? String(error);
      const status = (error as { statusCode?: number }).statusCode ?? 0;
      const retryable = status === 0 || status === 429 || status >= 500;
      return { ok: false, error: message, retryable };
    }
    return { ok: true, id: data?.id ?? "unknown" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      retryable: true,
    };
  }
}

async function send(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
  tag: string;
}): Promise<SendResult> {
  let last: SendResult & { retryable?: boolean } = NOT_CONFIGURED;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    last = await sendOnce(args);
    if (last.ok) return last;
    if (last.error === "email-not-configured") return last;
    if (last.retryable === false) break;
    if (attempt < RETRY_DELAYS_MS.length) await sleep(RETRY_DELAYS_MS[attempt]);
  }

  Sentry.captureMessage("email.send_failed_after_retries", {
    level: "warning",
    extra: {
      tag: args.tag,
      to: args.to,
      error: last.ok ? undefined : last.error,
    },
  });

  return last;
}

export async function sendRegistrationConfirmation(
  data: RegistrationEmailData & { to: string },
): Promise<SendResult> {
  const { subject, html, text } = buildRegistrationConfirmation(data);
  return send({ to: data.to, subject, html, text, tag: "registration_confirmation" });
}

export async function sendPaymentConfirmation(
  data: PaymentConfirmationData & { to: string },
): Promise<SendResult> {
  const { subject, html, text } = buildPaymentConfirmation(data);
  return send({ to: data.to, subject, html, text, tag: "payment_confirmation" });
}

export async function sendPaymentReminder(
  data: PaymentReminderData & { to: string },
): Promise<SendResult> {
  const { subject, html, text } = buildPaymentReminder(data);
  return send({ to: data.to, subject, html, text, tag: "payment_reminder" });
}

export async function sendWaitlistNotification(
  data: WaitlistEmailData,
): Promise<SendResult> {
  const { subject, html, text } = buildWaitlistNotification(data);
  return send({ to: data.email, subject, html, text, tag: "waitlist_notification" });
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

