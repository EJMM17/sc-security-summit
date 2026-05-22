import "server-only";

import { Resend } from "resend";

let _resend: Resend | null = null;
let _resendKey: string | null = null;

const PLACEHOLDER_KEYS = new Set(["re_PLACEHOLDER", "re_xxxxxxxxxxxxxxxxx"]);

function isUsableApiKey(apiKey: string | undefined): apiKey is string {
  return Boolean(apiKey && apiKey.trim().length > 0 && !PLACEHOLDER_KEYS.has(apiKey.trim()));
}

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!isUsableApiKey(apiKey)) return null;
  // Re-create the client if the key changed (relevant for tests).
  if (!_resend || _resendKey !== apiKey) {
    _resend = new Resend(apiKey);
    _resendKey = apiKey;
  }
  return _resend;
}

export const DEFAULT_FROM = "SC Security Summit <hola@scsecuritysummit.com>";

export type SendEmailResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; code?: string };

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
    return {
      ok: false,
      error: "RESEND_API_KEY missing or placeholder",
      code: "missing_api_key",
    };
  }

  const from = params.from ?? process.env.EMAIL_FROM ?? DEFAULT_FROM;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      return { ok: false, error: error.message, code: error.name };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      code: "send_exception",
    };
  }
}
