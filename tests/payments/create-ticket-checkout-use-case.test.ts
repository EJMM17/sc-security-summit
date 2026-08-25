import { beforeEach, describe, expect, it, vi } from "vitest";
import { RateLimitError } from "@/lib/rate-limit";
import { createTicketCheckoutUseCase } from "@/server/use-cases/create-ticket-checkout";
import { MercadoPagoConfigurationError } from "@/server/services/mercadopago-client";
import type { createCheckoutPreference } from "@/server/services/mercadopago-client";
import type {
  attachPreference,
  persistTicketOrder,
} from "@/server/repositories/ticket-order-repository";
import type { hashTicketOrderPayload } from "@/lib/payments/canonical-payload";
import type { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  checkoutFixture,
  corporateCheckoutFixture,
  invoicedCheckoutFixture,
} from "@/tests/payments/checkout-fixtures";

const ORDER_ID = "9b2d0c26-2f3d-4a1e-8f2b-6ce0f9b1a742";
const CHECKOUT_URL = "https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=1";

function dependencies() {
  return {
    getIp: vi.fn<typeof getClientIp>(async () => "203.0.113.10"),
    rateLimit: vi.fn<typeof checkRateLimit>(async () => undefined),
    hashPayload: vi.fn<typeof hashTicketOrderPayload>(() => "a".repeat(64)),
    persist: vi.fn<typeof persistTicketOrder>(async () => ({
      outcome: "created" as const,
      orderId: ORDER_ID,
      totalCents: 500_000,
    })),
    createPreference: vi.fn<typeof createCheckoutPreference>(async () => ({
      id: "pref-1",
      initPoint: CHECKOUT_URL,
    })),
    attach: vi.fn<typeof attachPreference>(async () => "pref-1"),
    siteUrl: vi.fn(() => "https://scsecuritysummit.com"),
    now: vi.fn(() => new Date("2026-08-24T12:00:00.000Z")),
  };
}

describe("createTicketCheckoutUseCase", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("prices the order server side and returns the checkout URL", async () => {
    const deps = dependencies();
    await expect(
      createTicketCheckoutUseCase(checkoutFixture, deps),
    ).resolves.toEqual({
      ok: true,
      orderId: ORDER_ID,
      checkoutUrl: CHECKOUT_URL,
      subtotalCents: 431_034,
      taxCents: 68_966,
      totalCents: 500_000,
    });

    const quote = deps.persist.mock.calls[0][1];
    expect(quote).toMatchObject({
      unitPriceCents: 250_000,
      subtotalCents: 431_034,
      taxCents: 68_966,
      totalCents: 500_000,
      taxRateBasisPoints: 1_600,
      currency: "MXN",
    });
  });

  it("persists before contacting MercadoPago", async () => {
    const deps = dependencies();
    const order: string[] = [];
    deps.persist.mockImplementation(async () => {
      order.push("persist");
      return { outcome: "created" as const, orderId: ORDER_ID, totalCents: 500_000 };
    });
    deps.createPreference.mockImplementation(async () => {
      order.push("preference");
      return { id: "pref-1", initPoint: CHECKOUT_URL };
    });

    await createTicketCheckoutUseCase(checkoutFixture, deps);
    expect(order).toEqual(["persist", "preference"]);
  });

  it("charges one line at the published price, with no tax added on top", async () => {
    const deps = dependencies();
    await createTicketCheckoutUseCase(checkoutFixture, deps);

    const { items } = deps.createPreference.mock.calls[0][0];
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: "plus", quantity: 2, unit_price: 2_500 });

    const charged = items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0,
    );
    expect(Math.round(charged * 100)).toBe(500_000);
  });

  it("keys the preference on the order so a retry cannot double-charge", async () => {
    const deps = dependencies();
    await createTicketCheckoutUseCase(checkoutFixture, deps);
    expect(deps.createPreference.mock.calls[0][0].idempotencyKey).toBe(
      `ticket-order:${ORDER_ID}`,
    );
    expect(deps.createPreference.mock.calls[0][0].externalReference).toBe(ORDER_ID);
  });

  it("points the webhook and return URLs at the canonical site", async () => {
    const deps = dependencies();
    await createTicketCheckoutUseCase(checkoutFixture, deps);
    const input = deps.createPreference.mock.calls[0][0];
    expect(input.notificationUrl).toBe(
      "https://scsecuritysummit.com/api/webhooks/mercadopago",
    );
    expect(input.backUrls.success).toBe(
      `https://scsecuritysummit.com/checkout/gracias?order=${ORDER_ID}`,
    );
  });

  it("refuses to start a checkout without a canonical site URL", async () => {
    const deps = dependencies();
    deps.siteUrl.mockReturnValue("");
    await expect(
      createTicketCheckoutUseCase(checkoutFixture, deps),
    ).resolves.toEqual({ ok: false, reason: "provider_unavailable" });
    expect(deps.persist).not.toHaveBeenCalled();
  });

  it("rejects a quantity the catalog does not authorize before any I/O", async () => {
    const deps = dependencies();
    await expect(
      createTicketCheckoutUseCase(
        { ...checkoutFixture, tier: "estudiante", quantity: 9 },
        deps,
      ),
    ).resolves.toEqual({ ok: false, reason: "invalid" });
    expect(deps.rateLimit).not.toHaveBeenCalled();
    expect(deps.persist).not.toHaveBeenCalled();
  });

  it("returns rate_limited without persisting", async () => {
    const deps = dependencies();
    deps.rateLimit.mockRejectedValue(new RateLimitError(60_000));
    await expect(
      createTicketCheckoutUseCase(checkoutFixture, deps),
    ).resolves.toEqual({ ok: false, reason: "rate_limited" });
    expect(deps.persist).not.toHaveBeenCalled();
  });

  it("returns storage_unavailable and never calls MercadoPago", async () => {
    const deps = dependencies();
    deps.persist.mockRejectedValue(Object.assign(new Error("down"), { code: "57P03" }));
    await expect(
      createTicketCheckoutUseCase(checkoutFixture, deps),
    ).resolves.toEqual({ ok: false, reason: "storage_unavailable" });
    expect(deps.createPreference).not.toHaveBeenCalled();
  });

  it("refuses a replay whose payload changed", async () => {
    const deps = dependencies();
    deps.persist.mockResolvedValue({ outcome: "conflict", orderId: ORDER_ID });
    await expect(
      createTicketCheckoutUseCase(checkoutFixture, deps),
    ).resolves.toEqual({ ok: false, reason: "idempotency_conflict" });
    expect(deps.createPreference).not.toHaveBeenCalled();
  });

  it("keeps the stored order when MercadoPago is unavailable", async () => {
    const deps = dependencies();
    deps.createPreference.mockRejectedValue(
      new MercadoPagoConfigurationError("missing_access_token"),
    );
    await expect(
      createTicketCheckoutUseCase(checkoutFixture, deps),
    ).resolves.toEqual({ ok: false, reason: "provider_unavailable" });
    expect(deps.persist).toHaveBeenCalledTimes(1);
  });

  it("still returns the checkout when the preference id cannot be stored", async () => {
    const deps = dependencies();
    deps.attach.mockRejectedValue(new Error("write failed"));
    const result = await createTicketCheckoutUseCase(checkoutFixture, deps);
    expect(result.ok).toBe(true);
  });

  it("localizes the MercadoPago line items", async () => {
    const deps = dependencies();
    await createTicketCheckoutUseCase(
      { ...checkoutFixture, language: "en" },
      deps,
    );
    const { items } = deps.createPreference.mock.calls[0][0];
    expect(items[0].title).toBe("Plus Pass");
    expect(items[0].description).toContain("September 24");
  });

  it("never logs buyer identity or fiscal data", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const deps = dependencies();
    await createTicketCheckoutUseCase(invoicedCheckoutFixture, deps);

    const logged = info.mock.calls.map((call) => String(call[0])).join("\n");
    for (const secret of [
      "maria@empresa.com",
      "María",
      "González",
      "ABC800101XY2",
      "Logística del Norte SA de CV",
      "88680",
      "+52 899 123 4567",
    ]) {
      expect(logged).not.toContain(secret);
    }
  });
});

describe("corporate blocks", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("charges the discounted block through the same MercadoPago flow", async () => {
    const deps = dependencies();
    deps.persist.mockResolvedValue({
      outcome: "created" as const,
      orderId: ORDER_ID,
      totalCents: 937_500,
    });

    await expect(
      createTicketCheckoutUseCase(corporateCheckoutFixture, deps),
    ).resolves.toMatchObject({ ok: true, checkoutUrl: CHECKOUT_URL });

    const quote = deps.persist.mock.calls[0][1];
    expect(quote).toMatchObject({
      tier: "corporativo",
      quantity: 5,
      // 25% off the 2,500 MXN list price, applied to the unit so the line
      // stays an exact multiple of it.
      unitPriceCents: 187_500,
      totalCents: 937_500,
    });

    const preference = deps.createPreference.mock.calls[0][0];
    expect(preference.items[0]).toMatchObject({
      id: "corporativo",
      quantity: 5,
      unit_price: 1_875,
    });
  });
});
