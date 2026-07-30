import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

import { sendEmail } from "@/lib/email";

const PARAMS = { to: "user@example.com", subject: "Hi", html: "<p>Hi</p>" };

describe("sendEmail", () => {
  const originalKey = process.env.RESEND_API_KEY;

  beforeEach(() => {
    sendMock.mockReset();
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalKey;
  });

  it("returns ok:false with missing_api_key when the key is absent (no false success)", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    delete process.env.RESEND_API_KEY;
    const result = await sendEmail(PARAMS);
    expect(result).toEqual({
      ok: false,
      code: "missing_api_key",
    });
    expect(sendMock).not.toHaveBeenCalled();
    const logged = String(log.mock.calls[0][0]);
    expect(logged).toContain("email_skipped_no_api_key");
    expect(logged).not.toContain(PARAMS.to);
    expect(logged).not.toContain(PARAMS.subject);
    log.mockRestore();
  });

  it("treats the example placeholder key as missing", async () => {
    process.env.RESEND_API_KEY = "re_PLACEHOLDER";
    const result = await sendEmail(PARAMS);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("missing_api_key");
  });

  it("returns ok:true with the provider id on success", async () => {
    process.env.RESEND_API_KEY = "re_live_realkey";
    sendMock.mockResolvedValue({ data: { id: "msg_123" }, error: null });
    const result = await sendEmail(PARAMS);
    expect(result).toEqual({ ok: true, id: "msg_123" });
  });

  it("passes an idempotency key to Resend", async () => {
    process.env.RESEND_API_KEY = "re_live_realkey";
    sendMock.mockResolvedValue({ data: { id: "msg_123" }, error: null });
    const idempotencyKey =
      "inquiry-notification/6b899fb2-5501-46ae-9621-d0d87983351d";
    await sendEmail({ ...PARAMS, idempotencyKey });
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: PARAMS.to, subject: PARAMS.subject }),
      { idempotencyKey },
    );
  });

  it("returns ok:false with the provider error when Resend rejects", async () => {
    process.env.RESEND_API_KEY = "re_live_realkey";
    sendMock.mockResolvedValue({ data: null, error: { name: "rate_limited", message: "slow down" } });
    const result = await sendEmail(PARAMS);
    expect(result).toEqual({ ok: false, code: "rate_limited" });
  });

  it("sanitizes an invalid provider error name", async () => {
    process.env.RESEND_API_KEY = "re_live_realkey";
    sendMock.mockResolvedValue({
      data: null,
      error: { name: "ada@example.com", message: "contains PII" },
    });
    await expect(sendEmail(PARAMS)).resolves.toEqual({
      ok: false,
      code: "provider_error",
    });
  });

  it("does not report success without a provider message id", async () => {
    process.env.RESEND_API_KEY = "re_live_realkey";
    sendMock.mockResolvedValue({ data: null, error: null });
    await expect(sendEmail(PARAMS)).resolves.toEqual({
      ok: false,
      code: "invalid_provider_response",
    });
  });

  it("does not throw when the SDK throws — returns ok:false", async () => {
    process.env.RESEND_API_KEY = "re_live_realkey";
    sendMock.mockRejectedValue(new Error("network down"));
    const result = await sendEmail(PARAMS);
    expect(result).toEqual({ ok: false, code: "send_exception" });
  });

  it("normalizes non-Error SDK exceptions", async () => {
    process.env.RESEND_API_KEY = "re_live_realkey";
    sendMock.mockRejectedValue("network down");
    await expect(sendEmail(PARAMS)).resolves.toEqual({
      ok: false,
      code: "send_exception",
    });
  });
});
