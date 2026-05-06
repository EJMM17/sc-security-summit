"use client";

import { useState } from "react";

function makeKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for very old browsers — not cryptographically strong but
  // sufficient as a deduplication token paired with server-side rate limiting.
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

export default function RegistroIdempotencyField() {
  const [key] = useState(makeKey);
  return <input type="hidden" name="idempotency_key" value={key} />;
}
