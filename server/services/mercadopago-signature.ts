import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * MercadoPago webhook signature verification.
 *
 * MercadoPago signs each notification with the secret configured in the
 * provider panel and sends it as:
 *
 *   x-signature: ts=1704908010,v1=<hex hmac>
 *   x-request-id: <uuid>
 *
 * The signed manifest is `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
 * where `data.id` is lowercased when it is alphanumeric.
 */

export const WEBHOOK_MAX_SKEW_SECONDS = 300;

export type SignatureVerification =
  | { valid: true }
  | { valid: false; reason: SignatureRejectionReason };

export type SignatureRejectionReason =
  | "not_configured"
  | "missing_signature"
  | "malformed_signature"
  | "missing_request_id"
  | "stale_timestamp"
  | "mismatch";

export function getWebhookSecret(): string | null {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  return secret ? secret : null;
}

function parseSignatureHeader(
  header: string,
): { ts: string; v1: string } | null {
  let ts = "";
  let v1 = "";

  for (const part of header.split(",")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key === "ts") ts = value;
    else if (key === "v1") v1 = value;
  }

  if (!/^[0-9]{1,20}$/.test(ts) || !/^[0-9a-f]{64}$/i.test(v1)) return null;
  return { ts, v1 };
}

function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function buildSignatureManifest(input: {
  dataId: string;
  requestId: string;
  ts: string;
}): string {
  // MercadoPago lowercases an alphanumeric data id before signing it.
  const dataId = /^[a-zA-Z0-9]+$/.test(input.dataId)
    ? input.dataId.toLowerCase()
    : input.dataId;
  return `id:${dataId};request-id:${input.requestId};ts:${input.ts};`;
}

export function verifyWebhookSignature(input: {
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | null;
  secret: string | null;
  now?: Date;
}): SignatureVerification {
  if (!input.secret) return { valid: false, reason: "not_configured" };
  if (!input.signatureHeader) {
    return { valid: false, reason: "missing_signature" };
  }
  if (!input.requestId) return { valid: false, reason: "missing_request_id" };
  if (!input.dataId) return { valid: false, reason: "malformed_signature" };

  const parsed = parseSignatureHeader(input.signatureHeader);
  if (!parsed) return { valid: false, reason: "malformed_signature" };

  // A replayed notification is rejected on age before any HMAC work so a
  // captured signature cannot be resubmitted indefinitely.
  const timestampMs = Number(parsed.ts) * 1000;
  const nowMs = (input.now ?? new Date()).getTime();
  if (
    !Number.isFinite(timestampMs) ||
    Math.abs(nowMs - timestampMs) > WEBHOOK_MAX_SKEW_SECONDS * 1000
  ) {
    return { valid: false, reason: "stale_timestamp" };
  }

  const manifest = buildSignatureManifest({
    dataId: input.dataId,
    requestId: input.requestId,
    ts: parsed.ts,
  });
  const expected = createHmac("sha256", input.secret)
    .update(manifest, "utf8")
    .digest("hex");

  return safeEqualHex(expected, parsed.v1.toLowerCase())
    ? { valid: true }
    : { valid: false, reason: "mismatch" };
}
