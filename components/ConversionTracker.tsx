"use client";

import { useEffect, useRef } from "react";
import { popHashedUserData } from "@/lib/enhanced-conversions";

type Props = {
  /** e.g. "estudiante" | "general" | "vip" */
  tipo: string;
  /** Amount in MXN (before tax) */
  monto: number | null;
  /** Registration folio */
  folio: string;
};

/**
 * Fires the registration conversion exactly once per folio.
 *
 * Measurement strategy: Google Tag Manager is the single entrypoint, so
 * GA4 + Google Ads conversions are driven from the dataLayer `generate_lead`
 * event (configure both inside GTM). Meta Pixel and LinkedIn are loaded
 * directly (not via GTM), so we still call fbq/lintrk here.
 *
 * De-duplication: an in-component ref guards Strict-Mode double mount, and
 * a per-folio sessionStorage flag guards page refreshes / back-forward.
 */
export default function ConversionTracker({ tipo, monto, folio }: Props) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    const dedupeKey = `scss:lead_fired:${folio}`;
    try {
      if (window.sessionStorage.getItem(dedupeKey)) return;
      window.sessionStorage.setItem(dedupeKey, "1");
    } catch {
      /* storage blocked — fall through and fire once for this mount */
    }

    let cancelled = false;

    (async () => {
      const value = monto ?? 0;
      const userData = await popHashedUserData().catch(() => undefined);
      if (cancelled) return;

      const w = window as unknown as {
        dataLayer?: unknown[];
        fbq?: (...args: unknown[]) => void;
        lintrk?: (...args: unknown[]) => void;
      };
      w.dataLayer = w.dataLayer || [];

      // ── GA4 standard lead event (+ Google Ads conversion via GTM) ──
      w.dataLayer.push({
        event: "generate_lead",
        lead_type: "event_registration",
        tipo_acceso: tipo,
        value,
        currency: "MXN",
        transaction_id: folio,
        ...(userData ? { user_data: userData } : {}),
      });

      // ── Legacy event (kept for existing GTM triggers) ──────────────
      w.dataLayer.push({
        event: "registro_completo",
        tipo_acceso: tipo,
        monto_mxn: value,
        folio,
      });

      // ── Meta Pixel (loaded directly, not via GTM) ──────────────────
      if (typeof w.fbq === "function") {
        w.fbq("track", "CompleteRegistration", {
          content_name: `SC Summit 2026 — ${tipo}`,
          currency: "MXN",
          value,
          status: "registered",
        });
      }

      // ── LinkedIn (loaded directly) ─────────────────────────────────
      if (typeof w.lintrk === "function") {
        w.lintrk("track", { conversion_id: "registration" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tipo, monto, folio]);

  return null;
}
