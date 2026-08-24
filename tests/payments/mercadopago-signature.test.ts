import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildSignatureManifest,
  verifyWebhookSignature,
  WEBHOOK_MAX_SKEW_SECONDS,
} from "@/server/services/mercadopago-signature";

const SECRET = "webhook-secret-value";
const NOW = new Date("2026-08-24T12:00:00.000Z");

function signedHeader(input: {
  dataId: string;
  requestId: string;
  ts?: string;
  secret?: string;
}): string {
  const ts = input.ts ?? String(Math.floor(NOW.getTime() / 1000));
  const manifest = buildSignatureManifest({
    dataId: input.dataId,
    requestId: input.requestId,
    ts,
  });
  const v1 = createHmac("sha256", input.secret ?? SECRET)
    .update(manifest, "utf8")
    .digest("hex");
  return `ts=${ts},v1=${v1}`;
}

describe("buildSignatureManifest", () => {
  it("lowercases an alphanumeric data id", () => {
    expect(
      buildSignatureManifest({ dataId: "AbC123", requestId: "req-1", ts: "10" }),
    ).toBe("id:abc123;request-id:req-1;ts:10;");
  });

  it("leaves a non-alphanumeric data id untouched", () => {
    expect(
      buildSignatureManifest({ dataId: "AB-12", requestId: "req-1", ts: "10" }),
    ).toBe("id:AB-12;request-id:req-1;ts:10;");
  });
});

describe("verifyWebhookSignature", () => {
  const base = {
    dataId: "123456789",
    requestId: "b1c2d3e4",
    secret: SECRET,
    now: NOW,
  };

  it("accepts a correctly signed notification", () => {
    expect(
      verifyWebhookSignature({
        ...base,
        signatureHeader: signedHeader({ dataId: base.dataId, requestId: base.requestId }),
      }),
    ).toEqual({ valid: true });
  });

  it("rejects a signature made with a different secret", () => {
    expect(
      verifyWebhookSignature({
        ...base,
        signatureHeader: signedHeader({
          dataId: base.dataId,
          requestId: base.requestId,
          secret: "another-secret",
        }),
      }),
    ).toEqual({ valid: false, reason: "mismatch" });
  });

  it("rejects a signature computed over a different payment id", () => {
    expect(
      verifyWebhookSignature({
        ...base,
        signatureHeader: signedHeader({
          dataId: "999999999",
          requestId: base.requestId,
        }),
      }),
    ).toEqual({ valid: false, reason: "mismatch" });
  });

  it("rejects a replayed notification outside the skew window", () => {
    const staleTs = String(
      Math.floor(NOW.getTime() / 1000) - WEBHOOK_MAX_SKEW_SECONDS - 1,
    );
    expect(
      verifyWebhookSignature({
        ...base,
        signatureHeader: signedHeader({
          dataId: base.dataId,
          requestId: base.requestId,
          ts: staleTs,
        }),
      }),
    ).toEqual({ valid: false, reason: "stale_timestamp" });
  });

  it("fails closed when no secret is configured", () => {
    expect(
      verifyWebhookSignature({
        ...base,
        secret: null,
        signatureHeader: signedHeader({ dataId: base.dataId, requestId: base.requestId }),
      }),
    ).toEqual({ valid: false, reason: "not_configured" });
  });

  it("rejects missing or malformed headers", () => {
    expect(
      verifyWebhookSignature({ ...base, signatureHeader: null }).valid,
    ).toBe(false);
    expect(
      verifyWebhookSignature({ ...base, signatureHeader: "nonsense" }),
    ).toEqual({ valid: false, reason: "malformed_signature" });
    expect(
      verifyWebhookSignature({ ...base, signatureHeader: "ts=abc,v1=zz" }),
    ).toEqual({ valid: false, reason: "malformed_signature" });
    expect(
      verifyWebhookSignature({
        ...base,
        requestId: null,
        signatureHeader: signedHeader({ dataId: base.dataId, requestId: "x" }),
      }),
    ).toEqual({ valid: false, reason: "missing_request_id" });
    expect(
      verifyWebhookSignature({
        ...base,
        dataId: null,
        signatureHeader: signedHeader({ dataId: "1", requestId: base.requestId }),
      }),
    ).toEqual({ valid: false, reason: "malformed_signature" });
  });
});
