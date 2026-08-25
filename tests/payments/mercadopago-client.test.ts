import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCheckoutPreference,
  findPaymentByExternalReference,
  getMercadoPagoAccessToken,
  getPayment,
  isMercadoPagoCheckoutUrl,
  isMercadoPagoConfigured,
  mapPaymentStatus,
  MAX_INSTALLMENTS,
  MercadoPagoApiError,
  MercadoPagoConfigurationError,
} from "@/server/services/mercadopago-client";

const LIVE_TOKEN = "APP_USR-0123456789abcdef";
const TEST_TOKEN = "TEST-0123456789abcdef";

function preferenceInput() {
  return {
    externalReference: "9b2d0c26-2f3d-4a1e-8f2b-6ce0f9b1a742",
    idempotencyKey: "ticket-order:9b2d0c26-2f3d-4a1e-8f2b-6ce0f9b1a742",
    items: [
      {
        id: "plus",
        title: "Acceso Plus",
        quantity: 2,
        currency_id: "MXN" as const,
        unit_price: 2_500,
      },
    ],
    payer: { name: "María", surname: "González", email: "maria@empresa.com" },
    backUrls: {
      success: "https://scsecuritysummit.com/checkout/gracias",
      failure: "https://scsecuritysummit.com/checkout/error",
      pending: "https://scsecuritysummit.com/checkout/pendiente",
    },
    notificationUrl: "https://scsecuritysummit.com/api/webhooks/mercadopago",
    statementDescriptor: "SCSUMMIT2026",
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("getMercadoPagoAccessToken", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires a sandbox token outside Vercel Production", () => {
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", TEST_TOKEN);
    expect(getMercadoPagoAccessToken()).toBe(TEST_TOKEN);
    expect(isMercadoPagoConfigured()).toBe(true);
  });

  it("refuses a live token outside Vercel Production", () => {
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", LIVE_TOKEN);
    expect(() => getMercadoPagoAccessToken()).toThrow(MercadoPagoConfigurationError);
    expect(isMercadoPagoConfigured()).toBe(false);
  });

  it("refuses a sandbox token in Vercel Production", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_TARGET_ENV", "production");
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", TEST_TOKEN);
    expect(() => getMercadoPagoAccessToken()).toThrow(MercadoPagoConfigurationError);
  });

  it("accepts a live token in Vercel Production", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_TARGET_ENV", "production");
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", LIVE_TOKEN);
    expect(getMercadoPagoAccessToken()).toBe(LIVE_TOKEN);
  });

  it("is unavailable on a visual-only deployment even with a token", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_TARGET_ENV", "preview");
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", TEST_TOKEN);
    expect(() => getMercadoPagoAccessToken()).toThrow(MercadoPagoConfigurationError);
  });

  it("throws when no token is configured", () => {
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "");
    expect(() => getMercadoPagoAccessToken()).toThrow(MercadoPagoConfigurationError);
  });
});

describe("isMercadoPagoCheckoutUrl", () => {
  it("accepts only HTTPS MercadoPago hosts", () => {
    expect(
      isMercadoPagoCheckoutUrl("https://www.mercadopago.com.mx/checkout/v1/redirect"),
    ).toBe(true);
    expect(isMercadoPagoCheckoutUrl("https://mercadopago.com/x")).toBe(true);
    expect(isMercadoPagoCheckoutUrl("http://www.mercadopago.com.mx/x")).toBe(false);
    expect(isMercadoPagoCheckoutUrl("https://mercadopago.com.evil.test/x")).toBe(false);
    expect(isMercadoPagoCheckoutUrl("https://evil.test/mercadopago.com")).toBe(false);
    expect(isMercadoPagoCheckoutUrl("not a url")).toBe(false);
  });
});

describe("createCheckoutPreference", () => {
  beforeEach(() => {
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", TEST_TOKEN);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("sends the idempotency key and returns the hosted checkout", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        id: "pref-1",
        init_point: "https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=1",
      }),
    );

    await expect(createCheckoutPreference(preferenceInput())).resolves.toEqual({
      id: "pref-1",
      initPoint: "https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=1",
    });

    const [, init] = fetchMock.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers["X-Idempotency-Key"]).toBe(
      "ticket-order:9b2d0c26-2f3d-4a1e-8f2b-6ce0f9b1a742",
    );
    expect(headers.Authorization).toBe(`Bearer ${TEST_TOKEN}`);
  });

  it("falls back to the sandbox init point", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        id: "pref-1",
        sandbox_init_point: "https://www.mercadopago.com.mx/checkout/sandbox",
      }),
    );
    const preference = await createCheckoutPreference(preferenceInput());
    expect(preference.initPoint).toBe(
      "https://www.mercadopago.com.mx/checkout/sandbox",
    );
  });

  it("refuses a redirect target that is not MercadoPago", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ id: "pref-1", init_point: "https://evil.test/steal" }),
    );
    await expect(createCheckoutPreference(preferenceInput())).rejects.toThrow(
      MercadoPagoApiError,
    );
  });

  it("surfaces a provider error code without its body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ error: "bad_request", message: "maria@empresa.com" }, 400),
    );
    await expect(createCheckoutPreference(preferenceInput())).rejects.toMatchObject({
      name: "MercadoPagoApiError",
      status: 400,
      code: "bad_request",
    });
  });

  it("converts a network failure into a typed error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNRESET"));
    await expect(createCheckoutPreference(preferenceInput())).rejects.toMatchObject({
      code: "network_error",
    });
  });
});

describe("getPayment", () => {
  beforeEach(() => {
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", TEST_TOKEN);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("normalizes the fields the webhook needs", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        id: 1234567890,
        status: "approved",
        status_detail: "accredited",
        external_reference: "9b2d0c26-2f3d-4a1e-8f2b-6ce0f9b1a742",
        transaction_amount: 5800,
        currency_id: "MXN",
        date_approved: "2026-08-24T12:00:00.000Z",
      }),
    );

    await expect(getPayment("1234567890")).resolves.toEqual({
      id: "1234567890",
      status: "approved",
      statusDetail: "accredited",
      externalReference: "9b2d0c26-2f3d-4a1e-8f2b-6ce0f9b1a742",
      transactionAmount: 5800,
      currencyId: "MXN",
      dateApproved: "2026-08-24T12:00:00.000Z",
    });
  });

  it("refuses a payment id that is not numeric", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(getPayment("../v1/users/me")).rejects.toMatchObject({
      code: "invalid_payment_id",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("mapPaymentStatus", () => {
  it("maps every MercadoPago status onto a stored order status", () => {
    expect(mapPaymentStatus("approved")).toBe("paid");
    expect(mapPaymentStatus("authorized")).toBe("in_process");
    expect(mapPaymentStatus("in_process")).toBe("in_process");
    expect(mapPaymentStatus("in_mediation")).toBe("in_process");
    expect(mapPaymentStatus("rejected")).toBe("rejected");
    expect(mapPaymentStatus("cancelled")).toBe("cancelled");
    expect(mapPaymentStatus("refunded")).toBe("refunded");
    expect(mapPaymentStatus("charged_back")).toBe("charged_back");
    expect(mapPaymentStatus("something_new")).toBe("pending");
  });
});

describe("preference payment methods", () => {
  beforeEach(() => {
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", TEST_TOKEN);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("excludes offline payment types the seat hold cannot outlive", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        id: "pref-1",
        init_point: "https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=1",
      }),
    );

    await createCheckoutPreference(preferenceInput());

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.payment_methods.excluded_payment_types).toEqual([
      { id: "ticket" },
      { id: "atm" },
    ]);
    expect(body.payment_methods.installments).toBe(MAX_INSTALLMENTS);
  });
});

describe("findPaymentByExternalReference", () => {
  const ORDER_ID = "9b2d0c26-2f3d-4a1e-8f2b-6ce0f9b1a742";

  beforeEach(() => {
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", TEST_TOKEN);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rejects a reference that is not an order id", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(findPaymentByExternalReference("../../v1/payments")).rejects.toThrow(
      MercadoPagoApiError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("searches by external reference and returns null when nothing matches", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ results: [] }));

    expect(await findPaymentByExternalReference(ORDER_ID)).toBeNull();

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("/v1/payments/search?");
    expect(url).toContain(`external_reference=${ORDER_ID}`);
  });

  it("prefers an approved payment over a rejected earlier attempt", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        results: [
          { id: 222, status: "rejected", external_reference: ORDER_ID },
          {
            id: 111,
            status: "approved",
            status_detail: "accredited",
            external_reference: ORDER_ID,
            transaction_amount: 2900,
            currency_id: "MXN",
            date_approved: "2026-08-24T10:00:00.000-06:00",
          },
        ],
      }),
    );

    const payment = await findPaymentByExternalReference(ORDER_ID);
    expect(payment?.id).toBe("111");
    expect(payment?.status).toBe("approved");
    expect(payment?.dateApproved).toBe("2026-08-24T10:00:00.000-06:00");
  });

  it("discards a result that belongs to another order", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        results: [
          {
            id: 999,
            status: "approved",
            external_reference: "11111111-2222-4333-8444-555555555555",
          },
        ],
      }),
    );

    expect(await findPaymentByExternalReference(ORDER_ID)).toBeNull();
  });

  it("falls back to the most recent attempt when none is approved", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        results: [
          { id: 333, status: "rejected", external_reference: ORDER_ID },
          { id: 222, status: "cancelled", external_reference: ORDER_ID },
        ],
      }),
    );

    expect((await findPaymentByExternalReference(ORDER_ID))?.id).toBe("333");
  });
});
