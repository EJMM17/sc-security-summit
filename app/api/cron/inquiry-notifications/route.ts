import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { isVercelProductionDeployment } from "@/lib/deployment-environment";
import { processDueInquiryNotifications } from "@/server/services/inquiry-notifier";
import { processDueTicketOrderNotifications } from "@/server/services/ticket-order-notifier";
import { sweepPendingTicketOrders } from "@/server/use-cases/sweep-pending-ticket-orders";

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

/**
 * The technical code of a failed cron task, and nothing else.
 *
 * Both repository errors already carry a sanitized `code`; the surrounding
 * message names the operation and never a payload. Anything else is reduced to
 * its constructor name, so a provider error object can never leak a buyer
 * address or a fiscal identifier into a log line.
 */
function failureCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String((error as { code: unknown }).code);
    if (/^[a-zA-Z0-9_.-]{1,64}$/.test(code)) return code;
  }
  if (error instanceof Error && /^[a-zA-Z0-9_.-]{1,64}$/.test(error.name)) {
    return error.name;
  }
  return "unexpected_error";
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
    const [inquiries, ticketOrders, sweep] = await Promise.allSettled([
      processDueInquiryNotifications(batchSize),
      processDueTicketOrderNotifications(batchSize),
      // The same run also reconciles orders left `pending`. The return pages
      // only reconcile for a buyer who comes back; this covers the one who
      // paid and closed the tab, and it is what lets the site sell before
      // `MERCADOPAGO_WEBHOOK_SECRET` is registered.
      sweepPendingTicketOrders(),
    ]);

    // Both queues are always attempted, but a failure in either one still
    // fails the run: a cron that silently reports success is a cron nobody
    // notices has stopped working. Naming the task that failed is what makes
    // that visible run diagnosable — a bare 500 says only that something did.
    if (
      inquiries.status === "rejected" ||
      ticketOrders.status === "rejected" ||
      sweep.status === "rejected"
    ) {
      const failures = (
        [
          ["inquiries", inquiries],
          ["ticketOrders", ticketOrders],
          ["pendingOrderSweep", sweep],
        ] as const
      ).flatMap(([task, outcome]) =>
        outcome.status === "rejected"
          ? [{ task, code: failureCode(outcome.reason) }]
          : [],
      );

      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          event: "cron_run_failed",
          failures,
        }),
      );
      return NextResponse.json(
        { ok: false, reason: "processing_unavailable" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      ...inquiries.value,
      ticketOrders: ticketOrders.value,
      pendingOrderSweep: sweep.value,
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event: "cron_run_failed",
        failures: [{ task: "route", code: failureCode(error) }],
      }),
    );
    return NextResponse.json(
      { ok: false, reason: "processing_unavailable" },
      { status: 500 },
    );
  }
}
