import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// We test by stubbing global fetch — getConekta() reads env at call time and
// our wrapper makes raw fetch() calls, so this is the cleanest seam.

const ORIGINAL_FETCH = globalThis.fetch;

beforeEach(() => {
  process.env.CONEKTA_API_KEY = "key_test_123456789";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "srv";
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("lib/conekta", () => {
  it("returns null when CONEKTA_API_KEY is not set", async () => {
    delete process.env.CONEKTA_API_KEY;
    vi.resetModules();
    const { getConekta } = await import("./conekta");
    expect(getConekta()).toBeNull();
  });

  it("creates a SPEI order and returns charge details", async () => {
    const fakeOrder = {
      id: "ord_test_001",
      payment_status: "pending_payment",
      amount: 250000,
      currency: "MXN",
      charges: {
        data: [
          {
            id: "chg_test_001",
            payment_method: {
              type: "spei",
              clabe: "646180157000000004",
              reference: "646180157000000004",
            },
          },
        ],
      },
    };

    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(fakeOrder), { status: 200 }),
    );
    globalThis.fetch = fetchSpy as typeof fetch;

    vi.resetModules();
    const { getConekta } = await import("./conekta");
    const client = getConekta();
    expect(client).not.toBeNull();

    const order = await client!.createOrder(
      {
        currency: "MXN",
        customer_info: { name: "Test", email: "t@t.test", phone: "+5210000000000" },
        line_items: [{ name: "GENERAL", unit_price: 250000, quantity: 1 }],
        charges: [{ payment_method: { type: "spei" } }],
      },
      "idem-key-1",
    );

    expect(order.id).toBe("ord_test_001");
    expect(order.charges?.data?.[0]?.payment_method?.clabe).toBe("646180157000000004");

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.conekta.io/orders");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toMatch(/^Basic /);
    expect(headers["Idempotency-Key"]).toBe("idem-key-1");
    expect(headers.Accept).toContain("conekta-v2.1.0");
  });

  it("throws a structured error on 4xx", async () => {
    const errBody = {
      details: [{ message: "Invalid customer info" }],
    };
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(errBody), { status: 422 }),
    ) as typeof fetch;

    vi.resetModules();
    const { getConekta } = await import("./conekta");
    const client = getConekta()!;

    await expect(
      client.createOrder({
        currency: "MXN",
        customer_info: { name: "x", email: "x@x.com", phone: "+5210000000000" },
        line_items: [{ name: "x", unit_price: 100, quantity: 1 }],
      }),
    ).rejects.toThrow(/conekta:422:Invalid customer info/);
  });
});
