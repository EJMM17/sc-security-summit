import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildBuyerReceiptEmail,
  buildInternalOrderEmail,
  processTicketOrderNotification,
} from "@/server/services/ticket-order-notifier";
import type { sendEmail } from "@/lib/email";
import type {
  completeTicketOrderNotification,
  getNotifiableTicketOrder,
  NotifiableTicketOrder,
} from "@/server/repositories/ticket-order-repository";

const ORDER_ID = "9b2d0c26-2f3d-4a1e-8f2b-6ce0f9b1a742";
const NOTIFICATION_ID = "a1b2c3d4-1111-4222-8333-444455556666";

function order(overrides: Partial<NotifiableTicketOrder> = {}): NotifiableTicketOrder {
  return {
    id: ORDER_ID,
    status: "paid",
    tier: "plus",
    quantity: 2,
    subtotal_cents: 500_000,
    tax_cents: 80_000,
    total_cents: 580_000,
    tax_rate_basis_points: 1_600,
    buyer_name: "María González",
    email: "maria@empresa.com",
    phone: "+52 899 123 4567",
    company: "Logística del Norte",
    language: "es",
    requires_invoice: false,
    ...overrides,
  };
}

function claim(template = "ticket_buyer_receipt_v1") {
  return {
    notificationId: NOTIFICATION_ID,
    orderId: ORDER_ID,
    attemptNumber: 1,
    template,
  };
}

function dependencies() {
  return {
    send: vi.fn<typeof sendEmail>(async () => ({ ok: true, id: "msg-1" })),
    getOrder: vi.fn<typeof getNotifiableTicketOrder>(async () => order()),
    complete: vi.fn<typeof completeTicketOrderNotification>(async () => "sent"),
    now: vi.fn(() => new Date("2026-08-24T12:00:00.000Z")),
  };
}

describe("buildBuyerReceiptEmail", () => {
  it("itemizes the base, the IVA and the total", () => {
    const email = buildBuyerReceiptEmail(order());
    expect(email.html).toContain("5,000.00");
    expect(email.html).toContain("800.00");
    expect(email.html).toContain("5,800.00");
    expect(email.html).toContain("IVA 16%");
  });

  it("never repeats the buyer's tax identity", () => {
    const email = buildBuyerReceiptEmail(order({ requires_invoice: true }));
    expect(email.html).toContain("CFDI");
    expect(email.html).not.toContain("RFC");
    expect(email.html).not.toContain("ABC800101XY2");
  });

  it("tells a buyer without an invoice how to still request one", () => {
    expect(buildBuyerReceiptEmail(order()).html).toContain(
      "hola@scsecuritysummit.com",
    );
  });

  it("warns the student tier about the ID requirement", () => {
    expect(
      buildBuyerReceiptEmail(order({ tier: "estudiante", quantity: 1 })).html,
    ).toContain("credencial vigente");
  });

  it("renders in English for an English order", () => {
    const email = buildBuyerReceiptEmail(order({ language: "en" }));
    expect(email.subject).toContain("Purchase confirmation");
    expect(email.html).toContain("VAT 16%");
  });

  it("escapes buyer-controlled text", () => {
    const email = buildBuyerReceiptEmail(
      order({ buyer_name: '<img src=x onerror="alert(1)">' }),
    );
    expect(email.html).not.toContain("<img src=x");
  });
});

describe("buildInternalOrderEmail", () => {
  it("flags an order that needs a CFDI without carrying the fiscal data", () => {
    const email = buildInternalOrderEmail(order({ requires_invoice: true }));
    expect(email.subject).toContain("CFDI");
    expect(email.html).toContain("no se envían por correo");
  });
});

describe("processTicketOrderNotification", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("CONTACT_EMAIL", "ops@scsecuritysummit.com");
  });

  it("sends the receipt to the buyer", async () => {
    const deps = dependencies();
    await expect(processTicketOrderNotification(claim(), deps)).resolves.toBe("sent");
    expect(deps.send.mock.calls[0][0].to).toBe("maria@empresa.com");
    expect(deps.send.mock.calls[0][0].idempotencyKey).toBe(
      `ticket-order-notification/${NOTIFICATION_ID}`,
    );
  });

  it("sends the internal notice to the operations inbox", async () => {
    const deps = dependencies();
    await processTicketOrderNotification(claim("ticket_order_internal_v1"), deps);
    expect(deps.send.mock.calls[0][0].to).toBe("ops@scsecuritysummit.com");
  });

  it("refuses to send a receipt for an order that is no longer paid", async () => {
    const deps = dependencies();
    deps.getOrder.mockResolvedValue(order({ status: "refunded" }));
    await expect(processTicketOrderNotification(claim(), deps)).resolves.toBe("dead");
    expect(deps.send).not.toHaveBeenCalled();
  });

  it("kills an unknown template instead of retrying it forever", async () => {
    const deps = dependencies();
    await expect(
      processTicketOrderNotification(claim("something_else_v1"), deps),
    ).resolves.toBe("dead");
    expect(deps.complete.mock.calls[0][0].result).toBe("dead");
  });

  it("queues a retry on a transient provider failure", async () => {
    const deps = dependencies();
    deps.send.mockResolvedValue({ ok: false, code: "rate_limit_exceeded" });
    await expect(processTicketOrderNotification(claim(), deps)).resolves.toBe("queued");
    expect(deps.complete.mock.calls[0][0]).toMatchObject({
      result: "retry",
      errorCode: "rate_limit_exceeded",
    });
  });

  it("kills a permanent provider failure immediately", async () => {
    const deps = dependencies();
    deps.send.mockResolvedValue({ ok: false, code: "invalid_to_address" });
    await expect(processTicketOrderNotification(claim(), deps)).resolves.toBe("dead");
  });

  it("kills the fifth failed attempt", async () => {
    const deps = dependencies();
    deps.send.mockResolvedValue({ ok: false, code: "rate_limit_exceeded" });
    await expect(
      processTicketOrderNotification({ ...claim(), attemptNumber: 5 }, deps),
    ).resolves.toBe("dead");
  });

  it("retries when the order cannot be read", async () => {
    const deps = dependencies();
    deps.getOrder.mockRejectedValue(
      Object.assign(new Error("down"), { code: "57P03" }),
    );
    await expect(processTicketOrderNotification(claim(), deps)).resolves.toBe("queued");
    expect(deps.send).not.toHaveBeenCalled();
  });

  it("retries when the internal inbox is not configured", async () => {
    vi.stubEnv("CONTACT_EMAIL", "");
    const deps = dependencies();
    await expect(
      processTicketOrderNotification(claim("ticket_order_internal_v1"), deps),
    ).resolves.toBe("queued");
    expect(deps.complete.mock.calls[0][0].errorCode).toBe("missing_contact_email");
  });

  it("retries when the send call throws", async () => {
    const deps = dependencies();
    deps.send.mockRejectedValue(new Error("socket hang up"));
    await expect(processTicketOrderNotification(claim(), deps)).resolves.toBe("queued");
    expect(deps.complete.mock.calls[0][0].errorCode).toBe("send_exception");
  });

  it("never logs buyer identity", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const deps = dependencies();
    await processTicketOrderNotification(claim(), deps);
    const logged = info.mock.calls.map((call) => String(call[0])).join("\n");
    expect(logged).toContain(ORDER_ID);
    expect(logged).not.toContain("maria@empresa.com");
    expect(logged).not.toContain("María");
  });
});
