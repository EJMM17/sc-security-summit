import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/services/inquiry-notifier", () => ({
  processDueInquiryNotifications: vi.fn(),
}));

import { GET } from "@/app/api/cron/inquiry-notifications/route";
import { processDueInquiryNotifications } from "@/server/services/inquiry-notifier";

const mockedProcess = vi.mocked(processDueInquiryNotifications);

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
    expect(await response.json()).toEqual({
      ok: true,
      claimed: 2,
      sent: 1,
      queued: 1,
      dead: 0,
      failed: 0,
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
