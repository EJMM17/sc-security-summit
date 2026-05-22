import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendEmailMock, maybeSingleMock, insertMock, sentryMessageMock, sentryExceptionMock } =
  vi.hoisted(() => ({
    sendEmailMock: vi.fn(),
    maybeSingleMock: vi.fn(),
    insertMock: vi.fn(),
    sentryMessageMock: vi.fn(),
    sentryExceptionMock: vi.fn(),
  }));

vi.mock("@/lib/email", () => ({
  sendEmail: (...args: unknown[]) => sendEmailMock(...args),
}));

vi.mock("@sentry/nextjs", () => ({
  captureMessage: sentryMessageMock,
  captureException: sentryExceptionMock,
}));

vi.mock("@/lib/supabase", () => {
  const builder: Record<string, unknown> = {};
  builder.select = () => builder;
  builder.eq = () => builder;
  builder.limit = () => builder;
  builder.maybeSingle = () => maybeSingleMock();
  builder.insert = (row: unknown) => insertMock(row);
  const client = { from: () => builder };
  return { supabaseAdmin: client, createAdminClient: () => client };
});

import { sendRegistrationConfirmation } from "@/server/use-cases/send-registration-confirmation";

const PARAMS = {
  folio: "SCSS2026-ABC-123",
  email: "asistente@example.com",
  nombre: "Ana",
  tipo_acceso: "general" as const,
  monto_mxn: 5800,
  language: "es" as const,
};

describe("sendRegistrationConfirmation", () => {
  beforeEach(() => {
    sendEmailMock.mockReset();
    maybeSingleMock.mockReset().mockResolvedValue({ data: null, error: null });
    insertMock.mockReset().mockResolvedValue({ error: null });
    sentryMessageMock.mockReset();
    sentryExceptionMock.mockReset();
  });

  it("sends and records a 'sent' event with the provider message id", async () => {
    sendEmailMock.mockResolvedValue({ ok: true, id: "msg_777" });

    const result = await sendRegistrationConfirmation(PARAMS);

    expect(result).toEqual({ ok: true, status: "sent", providerMessageId: "msg_777" });
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledTimes(1);
    const row = insertMock.mock.calls[0][0];
    expect(row).toMatchObject({
      folio: PARAMS.folio,
      email: PARAMS.email,
      type: "registration_confirmation",
      provider: "resend",
      status: "sent",
      provider_message_id: "msg_777",
    });
    expect(row.metadata).toMatchObject({ tipo_acceso: "general", monto_mxn: 5800, language: "es" });
  });

  it("records 'failed' and warns Sentry when Resend fails, without throwing", async () => {
    sendEmailMock.mockResolvedValue({ ok: false, error: "boom", code: "rate_limited" });

    const result = await sendRegistrationConfirmation(PARAMS);

    expect(result).toEqual({ ok: false, status: "failed", error: "boom" });
    expect(insertMock.mock.calls[0][0]).toMatchObject({ status: "failed", error: "boom" });
    expect(sentryMessageMock).toHaveBeenCalledWith(
      "registration_confirmation_email_failed",
      expect.objectContaining({ level: "warning" }),
    );
  });

  it("records 'skipped_no_api_key' when the API key is missing", async () => {
    sendEmailMock.mockResolvedValue({
      ok: false,
      error: "RESEND_API_KEY missing or placeholder",
      code: "missing_api_key",
    });

    const result = await sendRegistrationConfirmation(PARAMS);

    expect(result.status).toBe("skipped_no_api_key");
    expect(insertMock.mock.calls[0][0]).toMatchObject({ status: "skipped_no_api_key" });
    expect(sentryMessageMock).toHaveBeenCalledWith(
      "registration_confirmation_email_skipped_no_api_key",
      expect.objectContaining({ level: "warning" }),
    );
  });

  it("does not resend when a 'sent' event already exists (idempotent)", async () => {
    maybeSingleMock.mockResolvedValue({ data: { id: "existing" }, error: null });

    const result = await sendRegistrationConfirmation(PARAMS);

    expect(result).toEqual({ ok: true, status: "skipped_duplicate" });
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("treats a unique-constraint race on insert as a benign duplicate", async () => {
    sendEmailMock.mockResolvedValue({ ok: true, id: "msg_dup" });
    insertMock.mockResolvedValue({ error: { code: "23505", message: "duplicate key" } });

    const result = await sendRegistrationConfirmation(PARAMS);

    // The email outcome is unchanged; the audit collision is swallowed.
    expect(result.status).toBe("sent");
  });
});
