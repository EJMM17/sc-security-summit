import { NextResponse } from "next/server";
import { isVisualOnlyVercelDeployment } from "@/lib/deployment-environment";
import {
  capturedAmountCents,
  getPayment,
  mapPaymentStatus,
  MercadoPagoConfigurationError,
} from "@/server/services/mercadopago-client";
import {
  getWebhookSecret,
  verifyWebhookSignature,
} from "@/server/services/mercadopago-signature";
import {
  listDeliverableTicketOrderNotificationIds,
  recordPayment,
} from "@/server/repositories/ticket-order-repository";
import { tryImmediateTicketOrderNotification } from "@/server/services/ticket-order-notifier";
import { recordPaymentEvent } from "@/server/services/payment-observability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type WebhookBody = {
  type?: unknown;
  action?: unknown;
  data?: { id?: unknown } | null;
};

function readDataId(body: WebhookBody, url: URL): string | null {
  const fromBody = body.data?.id;
  if (typeof fromBody === "string" && fromBody) return fromBody;
  if (typeof fromBody === "number") return String(fromBody);
  // MercadoPago's legacy IPN format delivers the id as a query parameter.
  return url.searchParams.get("data.id") ?? url.searchParams.get("id");
}

/**
 * MercadoPago payment notifications.
 *
 * The body is untrusted: it carries an id and nothing else worth believing.
 * Every fact about the payment is re-read from the MercadoPago API with the
 * server's own credentials, and the order is located through the payment's
 * `external_reference`, never through anything the request body claims.
 *
 * The response is always 200 for a request that was authenticated and
 * understood, including duplicates — a non-2xx makes MercadoPago retry, and
 * retrying a notification that was already applied is pure noise.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (isVisualOnlyVercelDeployment()) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const url = new URL(request.url);

  let body: WebhookBody = {};
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed === "object" && parsed !== null) {
      body = parsed as WebhookBody;
    }
  } catch {
    // An empty or non-JSON body is still valid for the query-parameter form.
  }

  const dataId = readDataId(body, url);
  const verification = verifyWebhookSignature({
    signatureHeader: request.headers.get("x-signature"),
    requestId: request.headers.get("x-request-id"),
    dataId,
    secret: getWebhookSecret(),
  });

  if (!verification.valid) {
    recordPaymentEvent("ticket_webhook_rejected", {
      code: verification.reason,
    });
    // 401 for an unauthenticated caller; a genuine MercadoPago retry with a
    // fresh signature still gets through.
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const topic =
    typeof body.type === "string"
      ? body.type
      : (url.searchParams.get("type") ?? url.searchParams.get("topic") ?? "");

  if (topic !== "payment") {
    // Merchant order and test notifications are acknowledged and dropped.
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (!dataId) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const payment = await getPayment(dataId);
    const orderId = payment.externalReference;

    if (!orderId || !UUID_PATTERN.test(orderId)) {
      recordPaymentEvent("ticket_webhook_rejected", {
        code: "missing_external_reference",
      });
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const status = mapPaymentStatus(payment.status);
    const result = await recordPayment({
      orderId,
      paymentId: payment.id,
      status,
      providerStatus: payment.status,
      providerStatusDetail: payment.statusDetail ?? undefined,
      paidAt: payment.dateApproved ?? undefined,
      // An order is only marked paid for the amount it was priced at. The
      // database compares this against the stored total and refuses the
      // update when they differ, so a preference tampered with in flight
      // settles as an ignored notification instead of a paid ticket.
      paidAmountCents: capturedAmountCents(payment),
    });

    if (
      result.outcome === "ignored" &&
      status === "paid" &&
      result.status !== "paid"
    ) {
      recordPaymentEvent("ticket_payment_amount_mismatch", {
        orderId: result.orderId,
        status: result.status,
      });
    }

    recordPaymentEvent(
      result.outcome === "updated"
        ? "ticket_payment_recorded"
        : "ticket_payment_ignored",
      {
        orderId: result.orderId,
        status: result.status,
        outcome: result.outcome,
      },
    );

    // Becoming paid enqueues the receipt and the internal notice through a
    // database trigger. Try to deliver them now; anything that fails here
    // stays in the outbox and cron retries it. A failure must not turn a
    // recorded payment into a 500, which would make MercadoPago redeliver a
    // notification that was already applied.
    if (result.outcome === "updated" && result.status === "paid") {
      try {
        const notificationIds = await listDeliverableTicketOrderNotificationIds(
          result.orderId,
        );
        await Promise.all(
          notificationIds.map((id) =>
            tryImmediateTicketOrderNotification(id).catch(() => "queued"),
          ),
        );
      } catch {
        recordPaymentEvent("ticket_order_notification_retry", {
          orderId: result.orderId,
          code: "immediate_dispatch_failed",
        });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const code =
      error instanceof MercadoPagoConfigurationError
        ? "not_configured"
        : typeof error === "object" && error !== null && "code" in error
          ? String((error as { code: unknown }).code).slice(0, 64)
          : "unexpected_error";

    recordPaymentEvent("ticket_webhook_failed", { code });
    // 500 asks MercadoPago to retry, which is the correct behaviour when the
    // failure is ours (provider timeout, database unavailable).
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
}
