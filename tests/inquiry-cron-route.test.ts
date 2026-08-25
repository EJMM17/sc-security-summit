import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/services/inquiry-notifier", () => ({
  processDueInquiryNotifications: vi.fn(),
}));

vi.mock("@/server/services/ticket-order-notifier", () => ({
  processDueTicketOrderNotifications: vi.fn(),
}));

vi.mock("@/server/use-cases/sweep-pending-ticket-orders", () => ({
  sweepPendingTicketOrders: vi.fn(),
}));

import { GET } from "@/app/api/cron/inquiry-notifications/route";
import { processDueInquiryNotifications } from "@/server/services/inquiry-notifier";
import { processDueTicketOrderNotifications } from "@/server/services/ticket-order-notifier";
import { sweepPendingTicketOrders } from "@/server/use-cases/sweep-pending-ticket-orders";

const mockedProcess = vi.mocked(processDueInquiryNotifications);
const mockedTicketProcess = vi.mocked(processDueTicketOrderNotifications);
const mockedSweep = vi.mocked(sweepPendingTicketOrders);
const EMPTY_BATCH = { claimed: 0, sent: 0, queued: 0, dead: 0, failed: 0 };
const EMPTY_SWEEP = { scanned: 0, resolved: 0, stillPending: 0 };

function request(authorization?: string): Request {
  return new Request("https://example.com/api/cron/inquiry-notifications", {
    headers: authorization ? { authorization } : undefined,
  });
}

describe("inquiry notification cron", () => {
  beforeEach(() => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_TARGET_ENV", "production");
    delete process.env.CRON_SECRET;
    delete process.env.INQUIRY_NOTIFICATION_BATCH_SIZE;
    mockedProcess.mockReset();
    mockedTicketProcess.mockReset();
    mockedTicketProcess.mockResolvedValue({ ...EMPTY_BATCH });
    mockedSweep.mockReset();
    mockedSweep.mockResolvedValue({ ...EMPTY_SWEEP });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fails closed when CRON_SECRET is not configured", async () => {
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(mockedProcess).not.toHaveBeenCalled();
  });

  it("ignores a copied cron secret outside Vercel Production", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_TARGET_ENV", "preview");
    process.env.CRON_SECRET = "correct-secret";

    const response = await GET(request("Bearer correct-secret"));
    expect(response.status).toBe(503);
    expect(mockedProcess).not.toHaveBeenCalled();
  });

  it("rejects a request with the wrong bearer secret", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const response = await GET(request("Bearer incorrect-secret"));
    expect(response.status).toBe(401);
    expect(mockedProcess).not.toHaveBeenCalled();
  });

  it("rejects a request with no authorization header", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const response = await GET(request());
    expect(response.status).toBe(401);
    expect(mockedProcess).not.toHaveBeenCalled();
  });

  it("processes a bounded configured batch without returning PII", async () => {
    process.env.CRON_SECRET = "correct-secret";
    process.env.INQUIRY_NOTIFICATION_BATCH_SIZE = "500";
    mockedProcess.mockResolvedValue({
      claimed: 2,
      sent: 1,
      queued: 1,
      dead: 0,
      failed: 0,
    });

    const response = await GET(request("Bearer correct-secret"));
    expect(response.status).toBe(200);
    expect(mockedProcess).toHaveBeenCalledWith(25);
    // Both outboxes share this schedule and the same bounded batch size.
    expect(mockedTicketProcess).toHaveBeenCalledWith(25);
    expect(await response.json()).toEqual({
      ok: true,
      claimed: 2,
      sent: 1,
      queued: 1,
      dead: 0,
      failed: 0,
      ticketOrders: { claimed: 0, sent: 0, queued: 0, dead: 0, failed: 0 },
      pendingOrderSweep: { scanned: 0, resolved: 0, stillPending: 0 },
    });
  });

  it("also sweeps orders left pending, and reports what it resolved", async () => {
    process.env.CRON_SECRET = "correct-secret";
    mockedProcess.mockResolvedValue({ ...EMPTY_BATCH });
    mockedSweep.mockResolvedValue({ scanned: 3, resolved: 2, stillPending: 1 });

    const response = await GET(request("Bearer correct-secret"));

    expect(response.status).toBe(200);
    expect(mockedSweep).toHaveBeenCalledTimes(1);
    expect((await response.json()).pendingOrderSweep).toEqual({
      scanned: 3,
      resolved: 2,
      stillPending: 1,
    });
  });

  it("fails the run when only the pending sweep fails", async () => {
    // A sweep that stops working silently is how a paid order goes unnoticed
    // in `pending`, which is exactly what the sweep exists to prevent.
    process.env.CRON_SECRET = "correct-secret";
    mockedProcess.mockResolvedValue({ ...EMPTY_BATCH });
    mockedSweep.mockRejectedValue(new Error("provider down"));

    const response = await GET(request("Bearer correct-secret"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      ok: false,
      reason: "processing_unavailable",
    });
  });

  it("still drains both outboxes when the sweep fails", async () => {
    process.env.CRON_SECRET = "correct-secret";
    mockedProcess.mockResolvedValue({ ...EMPTY_BATCH });
    mockedSweep.mockRejectedValue(new Error("provider down"));

    await GET(request("Bearer correct-secret"));

    expect(mockedProcess).toHaveBeenCalledTimes(1);
    expect(mockedTicketProcess).toHaveBeenCalledTimes(1);
  });

  it("drains the ticket queue even when the inquiry queue fails", async () => {
    process.env.CRON_SECRET = "correct-secret";
    mockedProcess.mockRejectedValue(new Error("inquiry outbox down"));
    mockedTicketProcess.mockResolvedValue({ ...EMPTY_BATCH });

    const response = await GET(request("Bearer correct-secret"));
    // The run is still reported as failed so the cron failure stays visible.
    expect(response.status).toBe(500);
    expect(mockedTicketProcess).toHaveBeenCalledTimes(1);
  });

  it("fails the run when only the ticket queue fails", async () => {
    process.env.CRON_SECRET = "correct-secret";
    mockedProcess.mockResolvedValue({ ...EMPTY_BATCH });
    mockedTicketProcess.mockRejectedValue(new Error("ticket outbox down"));

    const response = await GET(request("Bearer correct-secret"));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      ok: false,
      reason: "processing_unavailable",
    });
  });

  it("uses the default batch size for an invalid configuration", async () => {
    process.env.CRON_SECRET = "correct-secret";
    process.env.INQUIRY_NOTIFICATION_BATCH_SIZE = "not-a-number";
    mockedProcess.mockResolvedValue({
      claimed: 0,
      sent: 0,
      queued: 0,
      dead: 0,
      failed: 0,
    });

    const response = await GET(request("Bearer correct-secret"));
    expect(response.status).toBe(200);
    expect(mockedProcess).toHaveBeenCalledWith(10);
  });

  it("returns only a technical error when processing fails", async () => {
    process.env.CRON_SECRET = "correct-secret";
    mockedProcess.mockRejectedValue(new Error("ada@example.com"));

    const response = await GET(request("Bearer correct-secret"));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      ok: false,
      reason: "processing_unavailable",
    });
  });
});
