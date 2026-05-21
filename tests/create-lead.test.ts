import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpcMock, insertMock, sendConfirmationMock, sentryMessageMock, sentryExceptionMock } =
  vi.hoisted(() => ({
    rpcMock: vi.fn(),
    insertMock: vi.fn(),
    sendConfirmationMock: vi.fn(),
    sentryMessageMock: vi.fn(),
    sentryExceptionMock: vi.fn(),
  }));

vi.mock("@/lib/supabase", () => {
  const client = {
    rpc: (...args: unknown[]) => rpcMock(...args),
    from: () => ({ insert: (row: unknown) => insertMock(row) }),
  };
  return { supabaseAdmin: client, createAdminClient: () => client };
});

vi.mock("@/server/use-cases/send-registration-confirmation", () => ({
  sendRegistrationConfirmation: (...args: unknown[]) => sendConfirmationMock(...args),
}));

vi.mock("@sentry/nextjs", () => ({
  captureMessage: sentryMessageMock,
  captureException: sentryExceptionMock,
}));

import { createLead } from "@/server/use-cases/create-lead";

const INPUT = {
  nombre: "Ana",
  apellido: "López",
  email: "ana@example.com",
  telefono: "+52 899 123 4567",
  empresa: "Acme",
  cargo: "Engineer",
  tipo_acceso: "general" as const,
  credencial_estudiantil: false,
  requiere_cfdi: false,
  language: "es" as const,
  ip: "1.2.3.4",
  userAgent: "test",
};

describe("createLead → confirmation email", () => {
  beforeEach(() => {
    rpcMock.mockReset().mockResolvedValue({ data: 100, error: null });
    insertMock.mockReset().mockResolvedValue({ error: null });
    sendConfirmationMock.mockReset().mockResolvedValue({ ok: true, status: "sent", providerMessageId: "m1" });
    sentryMessageMock.mockReset();
    sentryExceptionMock.mockReset();
  });

  it("inserts the registro then triggers the confirmation email with folio/monto/tipo", async () => {
    const result = await createLead(INPUT);

    expect(result.ok).toBe(true);
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(sendConfirmationMock).toHaveBeenCalledTimes(1);

    const emailArgs = sendConfirmationMock.mock.calls[0][0];
    if (!result.ok) throw new Error("expected ok");
    expect(emailArgs).toMatchObject({
      folio: result.folio,
      email: INPUT.email,
      nombre: INPUT.nombre,
      tipo_acceso: "general",
      monto_mxn: result.monto,
      language: "es",
    });
  });

  it("still returns ok:true when the email fails, and warns Sentry", async () => {
    sendConfirmationMock.mockResolvedValue({ ok: false, status: "failed", error: "smtp down" });

    const result = await createLead(INPUT);

    expect(result.ok).toBe(true);
    expect(sentryMessageMock).toHaveBeenCalledWith(
      "create_lead.confirmation_email_not_delivered",
      expect.objectContaining({ level: "warning" }),
    );
  });

  it("warns Sentry when the API key is missing but does not fail the registration", async () => {
    sendConfirmationMock.mockResolvedValue({ ok: false, status: "skipped_no_api_key", error: "no key" });

    const result = await createLead(INPUT);

    expect(result.ok).toBe(true);
    expect(sentryMessageMock).toHaveBeenCalledWith(
      "create_lead.confirmation_email_not_delivered",
      expect.objectContaining({ level: "warning" }),
    );
  });
});
