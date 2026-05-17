"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** e.g. "estudiante" | "general" | "vip" */
  tipo: string;
  /** Amount in MXN (before tax) */
  monto: number | null;
  /** Registration folio */
  folio: string;
};

/**
 * Fires conversion events to GA4, Meta Pixel, and LinkedIn on mount.
 * Renders nothing — purely a side-effect component.
 * Safe to render even when analytics scripts are not loaded (no-ops).
 */
export default function ConversionTracker({ tipo, monto, folio }: Props) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    // ── GA4 / GTM ──────────────────────────────────────────────────
    if (typeof window !== "undefined" && "gtag" in window) {
      const gtag = (window as Record<string, unknown>).gtag as (
        ...args: unknown[]
      ) => void;
      gtag("event", "generate_lead", {
        currency: "MXN",
        value: monto ?? 0,
        event_category: "registration",
        event_label: tipo,
        transaction_id: folio,
      });
    }

    // Also push to dataLayer for GTM triggers
    if (typeof window !== "undefined" && "dataLayer" in window) {
      const dataLayer = (window as Record<string, unknown>)
        .dataLayer as unknown[];
      dataLayer.push({
        event: "registro_completo",
        tipo_acceso: tipo,
        monto_mxn: monto ?? 0,
        folio,
      });
    }

    // ── Meta Pixel ─────────────────────────────────────────────────
    if (typeof window !== "undefined" && "fbq" in window) {
      const fbq = (window as Record<string, unknown>).fbq as (
        ...args: unknown[]
      ) => void;
      fbq("track", "CompleteRegistration", {
        content_name: `SC Summit 2026 — ${tipo}`,
        currency: "MXN",
        value: monto ?? 0,
        status: "registered",
      });
    }

    // ── LinkedIn ───────────────────────────────────────────────────
    if (typeof window !== "undefined" && "lintrk" in window) {
      const lintrk = (window as Record<string, unknown>).lintrk as (
        ...args: unknown[]
      ) => void;
      lintrk("track", { conversion_id: "registration" });
    }
  }, [tipo, monto, folio]);

  return null;
}
