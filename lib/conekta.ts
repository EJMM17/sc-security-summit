import "server-only";

import { env, features } from "@/env";

// Lightweight typed wrapper around Conekta v2 REST API.
// We deliberately avoid the official SDK to keep bundle size lean and
// dependencies fixed — the API surface we need is just Order.create.
//
// Auth: Basic with the secret key as username (no password).
// All Conekta amounts are in cents (MXN minor units).

const CONEKTA_BASE = "https://api.conekta.io";
const CONEKTA_API_VERSION = "2.1.0";

export type ConektaPaymentMethod =
  | { type: "spei"; expires_at?: number }
  | { type: "cash"; expires_at?: number };

export type ConektaCharge = {
  id: string;
  payment_method?: {
    type: string;
    clabe?: string;
    reference?: string;
    barcode_url?: string;
    expires_at?: number;
  };
};

export type ConektaCheckout = {
  id?: string;
  url?: string;
  type?: string;
};

export type ConektaOrder = {
  id: string;
  payment_status?: string;
  amount?: number;
  currency?: string;
  charges?: { data?: ConektaCharge[] };
  checkout?: ConektaCheckout;
  metadata?: Record<string, unknown>;
};

export type CreateOrderInput = {
  currency: "MXN";
  customer_info: {
    name: string;
    email: string;
    phone: string;
  };
  line_items: Array<{
    name: string;
    unit_price: number;
    quantity: number;
  }>;
  charges?: Array<{ payment_method: ConektaPaymentMethod }>;
  checkout?: {
    type: "HostedPayment";
    allowed_payment_methods: Array<"card" | "cash" | "bank_transfer">;
    success_url: string;
    failure_url: string;
    expires_at?: number;
  };
  metadata?: Record<string, unknown>;
};

let _warned = false;
export function warnConektaDisabled(): void {
  if (_warned) return;
  _warned = true;
  console.warn(
    "[conekta] CONEKTA_API_KEY no configurado — pagos automatizados deshabilitados",
  );
}

function authHeader(apiKey: string): string {
  // Basic <base64(apiKey:)>
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
}

async function request<T>(
  apiKey: string,
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  idempotencyKey?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: `application/vnd.conekta-v${CONEKTA_API_VERSION}+json`,
    "Accept-Language": "es",
    Authorization: authHeader(apiKey),
  };
  if (body) headers["Content-Type"] = "application/json";
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const res = await fetch(`${CONEKTA_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { raw: text };
  }

  if (!res.ok) {
    const detail =
      (parsed as { details?: Array<{ message?: string }> })?.details?.[0]?.message ||
      (parsed as { message?: string })?.message ||
      `conekta_http_${res.status}`;
    throw new Error(`conekta:${res.status}:${detail}`);
  }

  return parsed as T;
}

export type ConektaClient = {
  createOrder: (input: CreateOrderInput, idempotencyKey?: string) => Promise<ConektaOrder>;
  getOrder: (id: string) => Promise<ConektaOrder>;
};

export function getConekta(): ConektaClient | null {
  if (!features.conekta) return null;
  const apiKey = env.CONEKTA_API_KEY!;
  return {
    createOrder: (input, idempotencyKey) =>
      request<ConektaOrder>(apiKey, "POST", "/orders", input, idempotencyKey),
    getOrder: (id) => request<ConektaOrder>(apiKey, "GET", `/orders/${id}`),
  };
}
