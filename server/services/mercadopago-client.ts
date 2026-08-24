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
  quantity: number;
  currency_id: "MXN";
  unit_price: number;
};

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

export async function getPayment(paymentId: string): Promise<MercadoPagoPayment> {
  if (!/^[0-9]{1,32}$/.test(paymentId)) {
    throw new MercadoPagoApiError("get_payment", 0, "invalid_payment_id");
  }

  const payment = await request<Record<string, unknown>>(
    "get_payment",
    `/v1/payments/${paymentId}`,
    { method: "GET" },
  );

  const readString = (key: string): string | null => {
    const value = payment[key];
    return typeof value === "string" && value.length > 0 ? value : null;
  };

  const id = payment.id;
  return {
    id: typeof id === "number" || typeof id === "string" ? String(id) : paymentId,
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
