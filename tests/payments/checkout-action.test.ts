import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/use-cases/create-ticket-checkout", () => ({
  createTicketCheckoutUseCase: vi.fn(),
}));

import { createTicketCheckout } from "@/app/actions/checkout";
import { createTicketCheckoutUseCase } from "@/server/use-cases/create-ticket-checkout";
import { checkoutFormData } from "@/tests/payments/checkout-fixtures";

const mockedUseCase = vi.mocked(createTicketCheckoutUseCase);

const SUCCESS = {
  ok: true as const,
  orderId: "9b2d0c26-2f3d-4a1e-8f2b-6ce0f9b1a742",
  checkoutUrl: "https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=1",
  subtotalCents: 431_034,
  taxCents: 68_966,
  totalCents: 500_000,
};

describe("createTicketCheckout server action", () => {
  beforeEach(() => {
    mockedUseCase.mockReset();
    mockedUseCase.mockResolvedValue(SUCCESS);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("refuses a visual Preview deployment before parsing", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_TARGET_ENV", "preview");

    await expect(createTicketCheckout(checkoutFormData())).resolves.toEqual({
      ok: false,
      reason: "storage_unavailable",
    });
    expect(mockedUseCase).not.toHaveBeenCalled();
  });

  it("swallows a honeypot submission without creating an order", async () => {
    const result = await createTicketCheckout(
      checkoutFormData({ website: "https://spam.example" }),
    );
    expect(result).toMatchObject({ ok: true, checkoutUrl: "", totalCents: 0 });
    expect(mockedUseCase).not.toHaveBeenCalled();
  });

  it("forwards a valid submission to the use case", async () => {
    await expect(createTicketCheckout(checkoutFormData())).resolves.toEqual(SUCCESS);
    expect(mockedUseCase).toHaveBeenCalledTimes(1);
  });

  it("returns invalid for a malformed buyer field", async () => {
    await expect(
      createTicketCheckout(checkoutFormData({ email: "not-an-email" })),
    ).resolves.toEqual({ ok: false, reason: "invalid" });
    expect(mockedUseCase).not.toHaveBeenCalled();
  });

  it("distinguishes a fiscal-data failure so the form can point at it", async () => {
    await expect(
      createTicketCheckout(
        checkoutFormData({
          requiresInvoice: "on",
          rfc: "NOTANRFC1234",
          legalName: "Logística del Norte SA de CV",
          taxRegime: "601",
          cfdiUse: "G03",
          postalCode: "88680",
        }),
      ),
    ).resolves.toEqual({ ok: false, reason: "invalid_invoice" });
  });

  it("converts an unexpected use-case throw into a typed failure", async () => {
    mockedUseCase.mockRejectedValue(new Error("boom"));
    await expect(createTicketCheckout(checkoutFormData())).resolves.toEqual({
      ok: false,
      reason: "unexpected",
    });
  });
});
