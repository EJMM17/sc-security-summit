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
    delete process.env.RESEND_API_KEY;
    const result = await sendEmail(PARAMS);
    expect(result).toEqual({
      ok: false,
      error: "RESEND_API_KEY missing or placeholder",
      code: "missing_api_key",
    });
    expect(sendMock).not.toHaveBeenCalled();
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

  it("returns ok:false with the provider error when Resend rejects", async () => {
    process.env.RESEND_API_KEY = "re_live_realkey";
    sendMock.mockResolvedValue({ data: null, error: { name: "rate_limited", message: "slow down" } });
    const result = await sendEmail(PARAMS);
    expect(result).toEqual({ ok: false, error: "slow down", code: "rate_limited" });
  });

  it("does not throw when the SDK throws — returns ok:false", async () => {
    process.env.RESEND_API_KEY = "re_live_realkey";
    sendMock.mockRejectedValue(new Error("network down"));
    const result = await sendEmail(PARAMS);
    expect(result).toEqual({ ok: false, error: "network down", code: "send_exception" });
  });
});
