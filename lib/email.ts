import "server-only";

import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "re_PLACEHOLDER") return null;
  if (!_resend) _resend = new Resend(apiKey);
  return _resend;
}

const DEFAULT_FROM = "SC Security Summit <hola@scsecuritysummit.com.mx>";

export type SendEmailResult = { ok: true } | { ok: false; error: string };

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<SendEmailResult> {
  const resend = getResend();
  if (!resend) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event: "email_skipped_no_api_key",
        to: params.to,
        subject: params.subject,
      }),
    );
    return { ok: true };
  }

  const from = params.from ?? process.env.EMAIL_FROM ?? DEFAULT_FROM;

  try {
    const { error } = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
