import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the supabase admin client and email module so the route handler is
// pure and deterministic. We exercise the branching: invalid payload,
// rate-limit (always ok in tests), and the no-matching-row path.

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "srv";
  delete process.env.CONEKTA_WEBHOOK_SECRET;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

function chain(returnValue: unknown) {
  // Build a chainable mock approximating the supabase-js fluent API.
  const sel: Record<string, unknown> = {};
  sel.select = vi.fn().mockReturnValue(sel);
  sel.eq = vi.fn().mockReturnValue(sel);
  sel.single = vi.fn().mockResolvedValue(returnValue);
  sel.update = vi.fn().mockReturnValue(sel);
  sel.insert = vi.fn().mockResolvedValue({ error: null });
  return sel;
}

describe("POST /api/webhooks/conekta", () => {
  it("rejects malformed payloads with 400", async () => {
    vi.doMock("@/lib/supabase", () => ({
      supabaseAdmin: { from: () => chain({ data: null, error: null }) },
    }));
    vi.doMock("@/lib/email", () => ({ sendPaymentConfirmation: vi.fn() }));
    vi.doMock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

    const { POST } = await import("@/app/api/webhooks/conekta/route");
    const req = new Request("http://localhost/api/webhooks/conekta", {
      method: "POST",
      body: JSON.stringify({ foo: "bar" }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 200 when order is unknown", async () => {
    vi.doMock("@/lib/supabase", () => ({
      supabaseAdmin: { from: () => chain({ data: null, error: null }) },
    }));
    vi.doMock("@/lib/email", () => ({ sendPaymentConfirmation: vi.fn() }));
    vi.doMock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

    const { POST } = await import("@/app/api/webhooks/conekta/route");
    const req = new Request("http://localhost/api/webhooks/conekta", {
      method: "POST",
      body: JSON.stringify({
        type: "order.paid",
        data: { object: { id: "ord_unknown" } },
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
  });

  it("rejects with 401 when secret expected but missing", async () => {
    process.env.CONEKTA_WEBHOOK_SECRET = "shh-supersecret";
    vi.doMock("@/lib/supabase", () => ({
      supabaseAdmin: { from: () => chain({ data: null, error: null }) },
    }));
    vi.doMock("@/lib/email", () => ({ sendPaymentConfirmation: vi.fn() }));
    vi.doMock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

    vi.resetModules();
    const { POST } = await import("@/app/api/webhooks/conekta/route");
    const req = new Request("http://localhost/api/webhooks/conekta", {
      method: "POST",
      body: JSON.stringify({
        type: "order.paid",
        data: { object: { id: "ord_x" } },
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });
});
