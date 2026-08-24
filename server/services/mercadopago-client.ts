import "server-only";

import { isVercelProductionDeployment, isVisualOnlyVercelDeployment } from "@/lib/deployment-environment";

/**
 * Minimal MercadoPago Checkout Pro client.
 *
 * The official SDK is not used on purpose: it pulls a transitive dependency
 * tree into a build that pins `postcss`/`sharp` overrides for security, and
 * the two endpoints this site needs are plain authenticated REST calls.
 *
 * Credentials are read lazily so importing this module during `next build`
 * without secrets never throws.
 */

const API_BASE = "https://api.mercadopago.com";
const REQUEST_TIMEOUT_MS = 10_000;

export class MercadoPagoConfigurationError extends Error {
  constructor(reason: string) {
    super(`MercadoPago configuration is unavailable: ${reason}`);
    this.name = "MercadoPagoConfigurationError";
  }
}

export class MercadoPagoApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(operation: string, status: number, code: string) {
    super(`MercadoPago request failed: ${operation} (${status} ${code})`);
    this.name = "MercadoPagoApiError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Production must use a live access token; every other environment must use a
 * `TEST-` token. This is what keeps a real card charge impossible from a
 * developer machine while still allowing the sandbox to be exercised locally.
 */
export function getMercadoPagoAccessToken(): string {
  if (isVisualOnlyVercelDeployment()) {
    throw new MercadoPagoConfigurationError("visual_only_deployment");
  }

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new MercadoPagoConfigurationError("missing_access_token");
  }

  const isTestToken = token.startsWith("TEST-");
  if (isVercelProductionDeployment() === isTestToken) {
    throw new MercadoPagoConfigurationError(
      isTestToken ? "test_token_in_production" : "live_token_outside_production",
    );
  }

  return token;
}

export function isMercadoPagoConfigured(): boolean {
  try {
    getMercadoPagoAccessToken();
    return true;
  } catch {
    return false;
  }
}

function technicalCode(value: unknown): string {
  if (typeof value === "object" && value !== null && "error" in value) {
    const code = String((value as { error: unknown }).error);
    if (/^[a-zA-Z0-9_.-]{1,64}$/.test(code)) return code;
  }
  return "provider_error";
}

async function request<T>(
  operation: string,
  path: string,
  init: { method: "GET" | "POST"; body?: unknown; idempotencyKey?: string },
): Promise<T> {
  const token = getMercadoPagoAccessToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (init.idempotencyKey) headers["X-Idempotency-Key"] = init.idempotencyKey;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: init.method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    // The provider error is deliberately not forwarded: it can echo the
    // request body, which carries buyer PII.
    throw new MercadoPagoApiError(operation, 0, "network_error");
  }

  if (!response.ok) {
    let code = "provider_error";
    try {
      code = technicalCode(await response.json());
    } catch {
      // A non-JSON error body carries nothing safe to log.
    }
    throw new MercadoPagoApiError(operation, response.status, code);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new MercadoPagoApiError(operation, response.status, "invalid_response");
  }
}

export type PreferenceItem = {
  id: string;
  title: string;
  description?: string;
  /**
   * MercadoPago's industry-data guidance: sending a category improves the
   * risk score the payment is approved against.
   */
  category_id?: string;
  quantity: number;
  currency_id: "MXN";
  unit_price: number;
};

/**
 * Payment methods the checkout refuses.
 *
 * `ticket` (OXXO and friends) and `atm` are offline: the buyer leaves with a
 * voucher and pays hours or days later. Seat capacity holds a pending order
 * for `hold_minutes` and the preference itself expires in
 * `CHECKOUT_EXPIRY_MINUTES`, so an offline voucher would either be dead on
 * arrival or settle after its seats were already released to someone else.
 * Accepting them requires raising both windows past the voucher's due date
 * first — see `docs/PAYMENTS.md`.
 */
export const EXCLUDED_PAYMENT_TYPES = ["ticket", "atm"] as const;

/** Card installments the buyer may choose. Cost is borne by the buyer. */
export const MAX_INSTALLMENTS = 12;

export type CreatePreferenceInput = {
  externalReference: string;
  idempotencyKey: string;
  items: PreferenceItem[];
  payer: { name: string; surname: string; email: string };
  backUrls: { success: string; failure: string; pending: string };
  notificationUrl: string;
  statementDescriptor: string;
  expiresAt?: Date;
};

export type CreatedPreference = {
  id: string;
  initPoint: string;
};

export async function createCheckoutPreference(
  input: CreatePreferenceInput,
): Promise<CreatedPreference> {
  const body: Record<string, unknown> = {
    items: input.items,
    payer: input.payer,
    back_urls: {
      success: input.backUrls.success,
      failure: input.backUrls.failure,
      pending: input.backUrls.pending,
    },
    auto_return: "approved",
    external_reference: input.externalReference,
    notification_url: input.notificationUrl,
    statement_descriptor: input.statementDescriptor,
    binary_mode: false,
    payment_methods: {
      excluded_payment_types: EXCLUDED_PAYMENT_TYPES.map((id) => ({ id })),
      installments: MAX_INSTALLMENTS,
    },
  };

  if (input.expiresAt) {
    body.expires = true;
    body.expiration_date_to = input.expiresAt.toISOString();
  }

  const preference = await request<{
    id?: unknown;
    init_point?: unknown;
    sandbox_init_point?: unknown;
  }>("create_preference", "/checkout/preferences", {
    method: "POST",
    body,
    idempotencyKey: input.idempotencyKey,
  });

  const id = typeof preference.id === "string" ? preference.id : "";
  // Production returns init_point; the sandbox only returns
  // sandbox_init_point, so both are accepted and the live one wins.
  const initPoint =
    typeof preference.init_point === "string" && preference.init_point
      ? preference.init_point
      : typeof preference.sandbox_init_point === "string"
        ? preference.sandbox_init_point
        : "";

  if (!id || !isMercadoPagoCheckoutUrl(initPoint)) {
    throw new MercadoPagoApiError("create_preference", 200, "invalid_response");
  }

  return { id, initPoint };
}

/**
 * Guards the redirect target. The browser is sent to whatever this returns, so
 * an unexpected provider response must never become an open redirect.
 */
export function isMercadoPagoCheckoutUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      /^(www\.)?mercadopago\.com(\.[a-z]{2})?$/.test(url.hostname)
    );
  } catch {
    return false;
  }
}

export type MercadoPagoPayment = {
  id: string;
  status: string;
  statusDetail: string | null;
  externalReference: string | null;
  transactionAmount: number | null;
  currencyId: string | null;
  dateApproved: string | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readPayment(payment: Record<string, unknown>): MercadoPagoPayment {
  const readString = (key: string): string | null => {
    const value = payment[key];
    return typeof value === "string" && value.length > 0 ? value : null;
  };

  const id = payment.id;
  return {
    id: typeof id === "number" || typeof id === "string" ? String(id) : "",
    status: readString("status") ?? "unknown",
    statusDetail: readString("status_detail"),
    externalReference: readString("external_reference"),
    transactionAmount:
      typeof payment.transaction_amount === "number"
        ? payment.transaction_amount
        : null,
    currencyId: readString("currency_id"),
    dateApproved: readString("date_approved"),
  };
}

export async function getPayment(paymentId: string): Promise<MercadoPagoPayment> {
  if (!/^[0-9]{1,32}$/.test(paymentId)) {
    throw new MercadoPagoApiError("get_payment", 0, "invalid_payment_id");
  }

  const payment = await request<Record<string, unknown>>(
    "get_payment",
    `/v1/payments/${paymentId}`,
    { method: "GET" },
  );

  const parsed = readPayment(payment);
  return { ...parsed, id: parsed.id || paymentId };
}

/**
 * Payments recorded against one order, newest first.
 *
 * `GET /v1/payments/search` is how an order is reconciled when its webhook
 * never arrived — a misconfigured notification URL, a provider outage, or a
 * notification dropped while the site was down. Without it a paid order can
 * sit `pending` forever and the buyer never receives a receipt.
 *
 * An order can accumulate several payment attempts (a rejected card, then an
 * approved one), so an approved payment wins over any other regardless of
 * order; otherwise the most recent attempt is returned.
 */
export async function findPaymentByExternalReference(
  externalReference: string,
): Promise<MercadoPagoPayment | null> {
  if (!UUID_PATTERN.test(externalReference)) {
    throw new MercadoPagoApiError("search_payments", 0, "invalid_reference");
  }

  const query = new URLSearchParams({
    external_reference: externalReference,
    sort: "date_created",
    criteria: "desc",
    limit: "10",
  });

  const response = await request<{ results?: unknown }>(
    "search_payments",
    `/v1/payments/search?${query.toString()}`,
    { method: "GET" },
  );

  const results = Array.isArray(response.results) ? response.results : [];
  const payments = results
    .filter(
      (entry): entry is Record<string, unknown> =>
        typeof entry === "object" && entry !== null,
    )
    .map(readPayment)
    // The filter is applied by the API, but the result drives a write against
    // our own order id: a payment belonging to another order must never reach
    // it, whatever the provider returns.
    .filter(
      (payment) =>
        payment.id !== "" && payment.externalReference === externalReference,
    );

  if (payments.length === 0) return null;
  return payments.find((payment) => payment.status === "approved") ?? payments[0];
}

/** Maps a MercadoPago payment status onto the stored order status. */
export function mapPaymentStatus(
  status: string,
):
  | "pending"
  | "in_process"
  | "paid"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back" {
  switch (status) {
    case "approved":
      return "paid";
    case "authorized":
    case "in_process":
    case "in_mediation":
      return "in_process";
    case "rejected":
      return "rejected";
    case "cancelled":
      return "cancelled";
    case "refunded":
      return "refunded";
    case "charged_back":
      return "charged_back";
    default:
      return "pending";
  }
}
