import "server-only";

import { Resend } from "resend";
import { isVercelProductionDeployment } from "@/lib/deployment-environment";

let _resend: Resend | null = null;
let _resendKey: string | null = null;

const PLACEHOLDER_KEYS = new Set(["re_PLACEHOLDER", "re_xxxxxxxxxxxxxxxxx"]);

function isUsableApiKey(apiKey: string | undefined): apiKey is string {
  return Boolean(apiKey && apiKey.trim().length > 0 && !PLACEHOLDER_KEYS.has(apiKey.trim()));
}

function getResend(): Resend | null {
  if (!isVercelProductionDeployment()) return null;

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
  | { ok: true; id: string }
  | { ok: false; code: string };

function safeEmailErrorCode(value: unknown, fallback: string): string {
  const candidate = typeof value === "string" ? value : "";
  return /^[a-zA-Z0-9_.-]{1,120}$/.test(candidate) ? candidate : fallback;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  idempotencyKey?: string;
}): Promise<SendEmailResult> {
  const resend = getResend();
  if (!resend) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event: "email_skipped_no_api_key",
      }),
    );
    return {
      ok: false,
      code: "missing_api_key",
    };
  }

  const from = params.from ?? process.env.EMAIL_FROM ?? DEFAULT_FROM;

  try {
    const { data, error } = await resend.emails.send(
      {
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      },
      params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : undefined,
    );

    if (error) {
      return {
        ok: false,
        code: safeEmailErrorCode(error.name, "provider_error"),
      };
    }
    if (!data?.id) {
      return {
        ok: false,
        code: "invalid_provider_response",
      };
    }
    return { ok: true, id: data.id };
  } catch {
    return {
      ok: false,
      code: "send_exception",
    };
  }
}
