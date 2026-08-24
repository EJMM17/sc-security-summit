import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/services/mercadopago-client", async () => {
  const actual = await vi.importActual<
    typeof import("@/server/services/mercadopago-client")
  >("@/server/services/mercadopago-client");
  return { ...actual, getPayment: vi.fn() };
});

vi.mock("@/server/repositories/ticket-order-repository", () => ({
  recordPayment: vi.fn(),
  listDeliverableTicketOrderNotificationIds: vi.fn(),
}));

vi.mock("@/server/services/ticket-order-notifier", () => ({
  tryImmediateTicketOrderNotification: vi.fn(),
}));

import { POST } from "@/app/api/webhooks/mercadopago/route";
import { getPayment } from "@/server/services/mercadopago-client";
import {
  listDeliverableTicketOrderNotificationIds,
  recordPayment,
} from "@/server/repositories/ticket-order-repository";
import { tryImmediateTicketOrderNotification } from "@/server/services/ticket-order-notifier";
import { buildSignatureManifest } from "@/server/services/mercadopago-signature";

const SECRET = "webhook-secret-value";
const ORDER_ID = "9b2d0c26-2f3d-4a1e-8f2b-6ce0f9b1a742";
const PAYMENT_ID = "1234567890";
const REQUEST_ID = "req-abc-123";
const URL_STRING = "https://scsecuritysummit.com/api/webhooks/mercadopago";

const mockedGetPayment = vi.mocked(getPayment);
const mockedRecordPayment = vi.mocked(recordPayment);
const mockedListNotifications = vi.mocked(listDeliverableTicketOrderNotificationIds);
const mockedNotify = vi.mocked(tryImmediateTicketOrderNotification);

function signedRequest(options: {
  dataId?: string;
  type?: string;
  secret?: string;
  ts?: number;
} = {}): Request {
  const dataId = options.dataId ?? PAYMENT_ID;
  const ts = String(options.ts ?? Math.floor(Date.now() / 1000));
  const v1 = createHmac("sha256", options.secret ?? SECRET)
    .update(buildSignatureManifest({ dataId, requestId: REQUEST_ID, ts }), "utf8")
    .digest("hex");

  return new Request(URL_STRING, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-signature": `ts=${ts},v1=${v1}`,
      "x-request-id": REQUEST_ID,
    },
    body: JSON.stringify({
      type: options.type ?? "payment",
      action: "payment.updated",
      data: { id: dataId },
    }),
  });
}

function payment(overrides: Record<string, unknown> = {}) {
  return {
    id: PAYMENT_ID,
    status: "approved",
    statusDetail: "accredited",
    externalReference: ORDER_ID,
    transactionAmount: 5_800,
    currencyId: "MXN",
    dateApproved: "2026-08-24T12:00:00.000Z",
    ...overrides,
  };
}

describe("POST /api/webhooks/mercadopago", () => {
  beforeEach(() => {
    vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET", SECRET);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockedGetPayment.mockReset();
    mockedRecordPayment.mockReset();
    mockedGetPayment.mockResolvedValue(payment());
    mockedRecordPayment.mockResolvedValue({
      orderId: ORDER_ID,
      status: "paid",
      outcome: "updated",
    });
    mockedListNotifications.mockReset();
    mockedNotify.mockReset();
    mockedListNotifications.mockResolvedValue(["a1b2c3d4-1111-4222-8333-444455556666"]);
    mockedNotify.mockResolvedValue("sent");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("records an approved payment against the order in external_reference", async () => {
    const response = await POST(signedRequest());
    expect(response.status).toBe(200);
    expect(mockedRecordPayment).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: ORDER_ID, paymentId: PAYMENT_ID, status: "paid" }),
    );
  });

  it("rejects an unsigned request without touching the provider", async () => {
    const response = await POST(
      new Request(URL_STRING, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "payment", data: { id: PAYMENT_ID } }),
      }),
    );
    expect(response.status).toBe(401);
    expect(mockedGetPayment).not.toHaveBeenCalled();
  });

  it("rejects a signature made with the wrong secret", async () => {
    const response = await POST(signedRequest({ secret: "attacker-secret" }));
    expect(response.status).toBe(401);
    expect(mockedRecordPayment).not.toHaveBeenCalled();
  });

  it("fails closed when no webhook secret is configured", async () => {
    vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET", "");
    const response = await POST(signedRequest());
    expect(response.status).toBe(401);
    expect(mockedGetPayment).not.toHaveBeenCalled();
  });

  it("rejects a replayed notification outside the skew window", async () => {
    const response = await POST(
      signedRequest({ ts: Math.floor(Date.now() / 1000) - 3_600 }),
    );
    expect(response.status).toBe(401);
  });

  it("re-reads the payment instead of trusting the request body", async () => {
    await POST(signedRequest());
    expect(mockedGetPayment).toHaveBeenCalledWith(PAYMENT_ID);
  });

  it("acknowledges a duplicate delivery with 200 so it is not retried", async () => {
    mockedRecordPayment.mockResolvedValue({
      orderId: ORDER_ID,
      status: "paid",
      outcome: "duplicate",
    });
    const response = await POST(signedRequest());
    expect(response.status).toBe(200);
  });

  it("acknowledges and drops a non-payment topic", async () => {
    const response = await POST(signedRequest({ type: "merchant_order" }));
    expect(response.status).toBe(200);
    expect(mockedGetPayment).not.toHaveBeenCalled();
  });

  it("acknowledges a payment that carries no order reference", async () => {
    mockedGetPayment.mockResolvedValue(payment({ externalReference: null }));
    const response = await POST(signedRequest());
    expect(response.status).toBe(200);
    expect(mockedRecordPayment).not.toHaveBeenCalled();
  });

  it("ignores an external reference that is not one of our order ids", async () => {
    mockedGetPayment.mockResolvedValue(
      payment({ externalReference: "../../etc/passwd" }),
    );
    const response = await POST(signedRequest());
    expect(response.status).toBe(200);
    expect(mockedRecordPayment).not.toHaveBeenCalled();
  });

  it("returns 500 so MercadoPago retries when our side fails", async () => {
    mockedRecordPayment.mockRejectedValue(
      Object.assign(new Error("db down"), { code: "57P03" }),
    );
    const response = await POST(signedRequest());
    expect(response.status).toBe(500);
  });

  it("is unavailable on a visual-only deployment", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_TARGET_ENV", "preview");
    const response = await POST(signedRequest());
    expect(response.status).toBe(503);
    expect(mockedGetPayment).not.toHaveBeenCalled();
  });

  it("never logs payer data from the provider response", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    mockedGetPayment.mockResolvedValue(
      payment({ statusDetail: "accredited" }),
    );
    await POST(signedRequest());
    const logged = info.mock.calls.map((call) => String(call[0])).join("\n");
    expect(logged).toContain(ORDER_ID);
    expect(logged).not.toContain("@");
  });

  it("dispatches the queued confirmation emails once an order is paid", async () => {
    await POST(signedRequest());
    expect(mockedListNotifications).toHaveBeenCalledWith(ORDER_ID);
    expect(mockedNotify).toHaveBeenCalledWith(
      "a1b2c3d4-1111-4222-8333-444455556666",
    );
  });

  it("still acknowledges the payment when the email dispatch fails", async () => {
    mockedListNotifications.mockRejectedValue(new Error("outbox unavailable"));
    const response = await POST(signedRequest());
    // The payment was recorded; making MercadoPago retry would re-apply a
    // notification that already succeeded.
    expect(response.status).toBe(200);
  });

  it("does not dispatch emails for a duplicate delivery", async () => {
    mockedRecordPayment.mockResolvedValue({
      orderId: ORDER_ID,
      status: "paid",
      outcome: "duplicate",
    });
    await POST(signedRequest());
    expect(mockedNotify).not.toHaveBeenCalled();
  });
});
