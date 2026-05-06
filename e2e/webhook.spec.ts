import { expect, test } from "@playwright/test";

// Webhook smoke test. We POST a synthetic order.paid payload referencing a
// non-existent order_id and expect a 200 response (Conekta requires 2xx
// to avoid retries). Real DB-mutation testing requires a seeded order_id
// and is gated behind the E2E_WEBHOOK_ORDER_ID env var.
test.describe("Webhook /api/webhooks/conekta", () => {
  test("returns 200 for valid payload with unknown order", async ({ request }) => {
    const res = await request.post("/api/webhooks/conekta", {
      data: {
        type: "order.paid",
        data: { object: { id: "ord_nonexistent_e2e" } },
      },
      headers: process.env.CONEKTA_WEBHOOK_SECRET
        ? { "x-conekta-webhook-secret": process.env.CONEKTA_WEBHOOK_SECRET }
        : {},
    });
    expect(res.status()).toBe(200);
  });

  test("rejects malformed payload with 400", async ({ request }) => {
    const res = await request.post("/api/webhooks/conekta", {
      data: { foo: "bar" },
      headers: process.env.CONEKTA_WEBHOOK_SECRET
        ? { "x-conekta-webhook-secret": process.env.CONEKTA_WEBHOOK_SECRET }
        : {},
    });
    expect(res.status()).toBe(400);
  });

  test("rejects with 401 when secret expected but missing", async ({ request }) => {
    test.skip(
      !process.env.CONEKTA_WEBHOOK_SECRET,
      "Only meaningful when CONEKTA_WEBHOOK_SECRET is set",
    );
    const res = await request.post("/api/webhooks/conekta", {
      data: { type: "order.paid", data: { object: { id: "ord_x" } } },
    });
    expect(res.status()).toBe(401);
  });

  test("happy path — marks DB row as paid", async ({ request }) => {
    const orderId = process.env.E2E_WEBHOOK_ORDER_ID;
    test.skip(!orderId, "Set E2E_WEBHOOK_ORDER_ID to a seeded conekta_order_id");

    const res = await request.post("/api/webhooks/conekta", {
      data: { type: "order.paid", data: { object: { id: orderId } } },
      headers: process.env.CONEKTA_WEBHOOK_SECRET
        ? { "x-conekta-webhook-secret": process.env.CONEKTA_WEBHOOK_SECRET }
        : {},
    });
    expect(res.status()).toBe(200);
    // Caller is responsible for asserting DB state — this test only verifies
    // the endpoint accepts the payload without server error.
  });
});
