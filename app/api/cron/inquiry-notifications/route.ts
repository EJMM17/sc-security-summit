import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { isVercelProductionDeployment } from "@/lib/deployment-environment";
import { processDueInquiryNotifications } from "@/server/services/inquiry-notifier";

export const dynamic = "force-dynamic";
const DEFAULT_BATCH_SIZE = 10;
const MAX_BATCH_SIZE = 25;

function authorized(request: Request, secret: string): boolean {
  const provided = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const providedBuffer = Buffer.from(provided, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

function notificationBatchSize(): number {
  const configured = Number(process.env.INQUIRY_NOTIFICATION_BATCH_SIZE);
  if (!Number.isInteger(configured) || configured < 1) return DEFAULT_BATCH_SIZE;
  return Math.min(configured, MAX_BATCH_SIZE);
}

export async function GET(request: Request) {
  if (!isVercelProductionDeployment()) {
    return NextResponse.json(
      { ok: false, reason: "cron_unavailable" },
      { status: 503 },
    );
  }

  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { ok: false, reason: "cron_unavailable" },
      { status: 503 },
    );
  }
  if (!authorized(request, secret)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDueInquiryNotifications(notificationBatchSize());
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json(
      { ok: false, reason: "processing_unavailable" },
      { status: 500 },
    );
  }
}
