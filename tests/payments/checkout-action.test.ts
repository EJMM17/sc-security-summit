import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/use-cases/create-ticket-checkout", () => ({
  createTicketCheckoutUseCase: vi.fn(),
}));

vi.mock("@/server/use-cases/validate-discount-code", () => ({
  validateDiscountCodeUseCase: vi.fn(),
}));

import {
  createTicketCheckout,
  validateDiscountCode,
} from "@/app/actions/checkout";
import { createTicketCheckoutUseCase } from "@/server/use-cases/create-ticket-checkout";
import { validateDiscountCodeUseCase } from "@/server/use-cases/validate-discount-code";
import { checkoutFormData } from "@/tests/payments/checkout-fixtures";

const mockedUseCase = vi.mocked(createTicketCheckoutUseCase);
const mockedDiscountUseCase = vi.mocked(validateDiscountCodeUseCase);

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

describe("the browser cannot price its own order", () => {
  beforeEach(() => {
    mockedUseCase.mockReset();
    mockedUseCase.mockResolvedValue(SUCCESS);
  });

  it("ignores every amount a tampered form tries to submit", async () => {
    await createTicketCheckout(
      checkoutFormData({
        // Exactly what DevTools would inject: a price, a total, a discount and
        // a rate. None of these is a field the action reads.
        unitPriceCents: "1",
        subtotal: "10",
        total: "1",
        totalCents: "1",
        discountAmount: "999999",
        discountPercentage: "99",
        discountBasisPoints: "9900",
      }),
    );

    const order = mockedUseCase.mock.calls[0][0];
    expect(order).not.toHaveProperty("total");
    expect(order).not.toHaveProperty("totalCents");
    expect(order).not.toHaveProperty("discountAmount");
    expect(order).not.toHaveProperty("discountPercentage");
    expect(order).not.toHaveProperty("discountBasisPoints");
    // The tier and the quantity are the only things the browser gets to say.
    expect(order).toMatchObject({ tier: "plus", quantity: 2 });
  });

  it("passes the discount code through normalized, and nothing else about it", async () => {
    await createTicketCheckout(checkoutFormData({ discountCode: " uvb2026 " }));

    expect(mockedUseCase.mock.calls[0][0]).toMatchObject({
      discountCode: "UVB2026",
    });
  });

  it("submits no code at all when the field is empty", async () => {
    await createTicketCheckout(checkoutFormData({ discountCode: "   " }));
    expect(mockedUseCase.mock.calls[0][0].discountCode).toBeUndefined();
  });
});

describe("validateDiscountCode server action", () => {
  const REJECTED = {
    valid: false as const,
    reason: "unknown" as const,
    listTotalCents: 250_000,
    discountCents: 0 as const,
    totalCents: 250_000,
  };

  beforeEach(() => {
    mockedDiscountUseCase.mockReset();
    mockedDiscountUseCase.mockResolvedValue(REJECTED);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("refuses a visual Preview deployment before reading the coupon store", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_TARGET_ENV", "preview");

    await expect(
      validateDiscountCode({ tier: "plus", quantity: 1, code: "UVB2026" }),
    ).resolves.toMatchObject({ valid: false, reason: "unavailable" });
    expect(mockedDiscountUseCase).not.toHaveBeenCalled();
  });

  it("rejects a request carrying anything beyond the tier, quantity and code", async () => {
    await expect(
      validateDiscountCode({
        tier: "plus",
        quantity: 1,
        code: "UVB2026",
        // A browser trying to supply its own price.
        subtotalCents: 10,
      } as never),
    ).resolves.toMatchObject({ valid: false, reason: "unknown" });
    expect(mockedDiscountUseCase).not.toHaveBeenCalled();
  });

  it("rejects an unknown tier without asking the coupon store", async () => {
    await expect(
      validateDiscountCode({ tier: "vip" as never, quantity: 1, code: "UVB2026" }),
    ).resolves.toMatchObject({ valid: false });
    expect(mockedDiscountUseCase).not.toHaveBeenCalled();
  });

  it("answers `unavailable` instead of throwing when the use case fails", async () => {
    mockedDiscountUseCase.mockRejectedValue(new Error("supabase down"));

    await expect(
      validateDiscountCode({ tier: "plus", quantity: 1, code: "UVB2026" }),
    ).resolves.toMatchObject({ valid: false, reason: "unavailable" });
  });
});
