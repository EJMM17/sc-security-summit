import "server-only";

import { checkRateLimit, getClientIp, RateLimitError } from "@/lib/rate-limit";
import { hashTicketOrderPayload } from "@/lib/payments/canonical-payload";
import { quoteTicketOrder, TICKET_TIERS } from "@/lib/payments/catalog";
import type { CheckoutResult } from "@/lib/payments/result";
import type { TicketCheckout } from "@/lib/payments/schema";
import { centsToAmount, formatTaxRate } from "@/lib/payments/tax";
import {
  attachPreference,
  persistTicketOrder,
  type PersistTicketOrderResult,
} from "@/server/repositories/ticket-order-repository";
import {
  createCheckoutPreference,
  MercadoPagoConfigurationError,
  type CreatedPreference,
} from "@/server/services/mercadopago-client";
import { recordPaymentEvent } from "@/server/services/payment-observability";

const CHECKOUT_EXPIRY_MINUTES = 30;
const STATEMENT_DESCRIPTOR = "SCSUMMIT2026";

type CreateCheckoutDependencies = {
  getIp: typeof getClientIp;
  rateLimit: typeof checkRateLimit;
  hashPayload: typeof hashTicketOrderPayload;
  persist: typeof persistTicketOrder;
  createPreference: typeof createCheckoutPreference;
  attach: typeof attachPreference;
  siteUrl: () => string;
  now: () => Date;
};

const DEFAULT_DEPENDENCIES: CreateCheckoutDependencies = {
  getIp: getClientIp,
  rateLimit: checkRateLimit,
  hashPayload: hashTicketOrderPayload,
  persist: persistTicketOrder,
  createPreference: createCheckoutPreference,
  attach: attachPreference,
  siteUrl: () => process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "",
  now: () => new Date(),
};

function technicalCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String((error as { code: unknown }).code);
    if (/^[a-zA-Z0-9_.-]{1,64}$/.test(code)) return code;
  }
  return "unexpected_error";
}

function canonicalSiteUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Persists the order first, then asks MercadoPago for a hosted checkout.
 *
 * The ordering mirrors the inquiry flow and is what makes the webhook safe: a
 * payment notification can only ever arrive for an order that already exists,
 * so the webhook never has to invent a row from provider-supplied data.
 */
export async function createTicketCheckoutUseCase(
  order: TicketCheckout,
  dependencyOverrides: Partial<CreateCheckoutDependencies> = {},
): Promise<CheckoutResult> {
  const dependencies = { ...DEFAULT_DEPENDENCIES, ...dependencyOverrides };

  const origin = canonicalSiteUrl(dependencies.siteUrl());
  if (!origin) {
    recordPaymentEvent("ticket_order_preference_failed", {
      code: "missing_site_url",
    });
    return { ok: false, reason: "provider_unavailable" };
  }

  // The browser never sends an amount. The tier and quantity are priced here,
  // against the server-side catalog, and the quote is what gets stored and
  // charged.
  let quote;
  try {
    quote = quoteTicketOrder(order.tier, order.quantity);
  } catch {
    return { ok: false, reason: "invalid" };
  }

  try {
    const ip = await dependencies.getIp();
    await dependencies.rateLimit(`checkout:${ip}`);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { ok: false, reason: "rate_limited" };
    }
    return { ok: false, reason: "unexpected" };
  }

  let persisted: PersistTicketOrderResult;
  try {
    persisted = await dependencies.persist(
      order,
      quote,
      dependencies.hashPayload(order),
      dependencies.now(),
    );
  } catch (error) {
    recordPaymentEvent("ticket_order_persistence_failed", {
      tier: order.tier,
      quantity: order.quantity,
      language: order.language,
      code: technicalCode(error),
    });
    return { ok: false, reason: "storage_unavailable" };
  }

  if (persisted.outcome === "sold_out") {
    recordPaymentEvent("ticket_order_sold_out", {
      tier: order.tier,
      quantity: order.quantity,
      language: order.language,
    });
    return { ok: false, reason: "sold_out" };
  }

  if (persisted.outcome === "conflict") {
    recordPaymentEvent("ticket_order_persistence_failed", {
      orderId: persisted.orderId,
      tier: order.tier,
      language: order.language,
      code: "idempotency_conflict",
    });
    return { ok: false, reason: "idempotency_conflict" };
  }

  recordPaymentEvent(
    persisted.outcome === "created"
      ? "ticket_order_persisted"
      : "ticket_order_replayed",
    {
      orderId: persisted.orderId,
      tier: order.tier,
      quantity: order.quantity,
      language: order.language,
      requiresInvoice: order.requiresInvoice,
      totalCents: quote.totalCents,
    },
  );

  const tier = TICKET_TIERS[order.tier];
  const tierLabel = tier.label[order.language];
  const taxLabel =
    order.language === "es"
      ? `IVA ${formatTaxRate(quote.taxRateBasisPoints)}`
      : `VAT ${formatTaxRate(quote.taxRateBasisPoints)}`;

  let preference: CreatedPreference;
  try {
    preference = await dependencies.createPreference({
      externalReference: persisted.orderId,
      // Retrying the same order must not create a second preference.
      idempotencyKey: `ticket-order:${persisted.orderId}`,
      items: [
        {
          id: `${order.tier}`,
          title: tierLabel,
          // MercadoPago's industry-data guidance: a category on the item feeds
          // the risk model the payment is approved against.
          category_id: "tickets",
          description:
            order.language === "es"
              ? "SC Security Summit 2026 — 24 de septiembre, Reynosa"
              : "SC Security Summit 2026 — September 24, Reynosa",
          quantity: quote.quantity,
          currency_id: quote.currency,
          unit_price: centsToAmount(quote.unitPriceCents),
        },
        {
          id: "iva",
          title: taxLabel,
          category_id: "tickets",
          quantity: 1,
          currency_id: quote.currency,
          unit_price: centsToAmount(quote.taxCents),
        },
      ],
      payer: {
        name: order.firstName,
        surname: order.lastName,
        email: order.email,
      },
      backUrls: {
        success: `${origin}/checkout/gracias?order=${persisted.orderId}`,
        failure: `${origin}/checkout/error?order=${persisted.orderId}`,
        pending: `${origin}/checkout/pendiente?order=${persisted.orderId}`,
      },
      notificationUrl: `${origin}/api/webhooks/mercadopago`,
      statementDescriptor: STATEMENT_DESCRIPTOR,
      expiresAt: new Date(
        dependencies.now().getTime() + CHECKOUT_EXPIRY_MINUTES * 60_000,
      ),
    });
  } catch (error) {
    recordPaymentEvent("ticket_order_preference_failed", {
      orderId: persisted.orderId,
      tier: order.tier,
      language: order.language,
      code:
        error instanceof MercadoPagoConfigurationError
          ? "not_configured"
          : technicalCode(error),
    });
    // The order row survives. Operations can recover it from /admin and the
    // buyer can retry with the same submission id.
    return { ok: false, reason: "provider_unavailable" };
  }

  try {
    await dependencies.attach(persisted.orderId, preference.id);
    recordPaymentEvent("ticket_order_preference_created", {
      orderId: persisted.orderId,
      tier: order.tier,
      language: order.language,
    });
  } catch (error) {
    // Losing the preference id is an operational inconvenience, not a reason
    // to withhold a checkout the buyer can already pay. The webhook matches on
    // external_reference, not on the preference.
    recordPaymentEvent("ticket_order_preference_failed", {
      orderId: persisted.orderId,
      code: technicalCode(error),
    });
  }

  return {
    ok: true,
    orderId: persisted.orderId,
    checkoutUrl: preference.initPoint,
    subtotalCents: quote.subtotalCents,
    taxCents: quote.taxCents,
    totalCents: quote.totalCents,
  };
}
