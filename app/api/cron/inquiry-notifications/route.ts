import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { isVercelProductionDeployment } from "@/lib/deployment-environment";
import { processDueInquiryNotifications } from "@/server/services/inquiry-notifier";
import { processDueTicketOrderNotifications } from "@/server/services/ticket-order-notifier";

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
    // Both outboxes share this schedule: Vercel Pro allows a five-minute cron,
    // and a second schedule would double the invocations for no benefit.
    // allSettled rather than all, so a failing inquiry queue still lets the
    // ticket queue drain before the run is reported as failed.
    const batchSize = notificationBatchSize();
    const [inquiries, ticketOrders] = await Promise.allSettled([
      processDueInquiryNotifications(batchSize),
      processDueTicketOrderNotifications(batchSize),
    ]);

    // Both queues are always attempted, but a failure in either one still
    // fails the run: a cron that silently reports success is a cron nobody
    // notices has stopped working.
    if (inquiries.status === "rejected") throw inquiries.reason;
    if (ticketOrders.status === "rejected") throw ticketOrders.reason;

    return NextResponse.json({
      ok: true,
      ...inquiries.value,
      ticketOrders: ticketOrders.value,
    });
  } catch {
    return NextResponse.json(
      { ok: false, reason: "processing_unavailable" },
      { status: 500 },
    );
  }
}
