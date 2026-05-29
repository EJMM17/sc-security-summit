"use client";

import { useEffect } from "react";

/**
 * Site-wide, zero-UI interaction tracking. Attaches a single delegated
 * click listener and maps anchor clicks to dataLayer events based on the
 * link target and current path — so no approved button/markup has to
 * change.
 *
 * Events emitted:
 *   click_register   → any link to #registro
 *   click_sponsor    → sponsorship mailto / sponsors page / #patrocinadores
 *   click_whatsapp   → wa.me links (off the success page)
 *   click_calendar   → "add to calendar" on /registro-exitoso
 *   share_whatsapp   → WhatsApp share on /registro-exitoso
 *
 * Each event includes: cta_location (nearest section id), page_path, language.
 */
function pushEvent(event: string, params: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...params });
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function InteractionTracker() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Element | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      if (!href) return;

      const path = window.location.pathname;
      const language = document.documentElement.lang || "es";
      const ctaLocation =
        anchor.closest("section")?.id || anchor.closest("[id]")?.id || "";
      const base = { cta_location: ctaLocation, page_path: path, language };

      // ── Success page (/registro-exitoso) ──────────────────────────
      if (path.startsWith("/registro-exitoso")) {
        if (href.includes("calendar.google.com")) pushEvent("click_calendar", base);
        else if (href.includes("wa.me") || href.includes("api.whatsapp.com"))
          pushEvent("share_whatsapp", base);
        return;
      }

      // ── Registration intent ───────────────────────────────────────
      if (href.includes("#registro")) {
        pushEvent("click_register", base);
        return;
      }

      // ── WhatsApp contact ──────────────────────────────────────────
      if (href.includes("wa.me") || href.includes("api.whatsapp.com")) {
        pushEvent("click_whatsapp", base);
        return;
      }

      // ── Sponsorship intent ────────────────────────────────────────
      const decoded = href.startsWith("mailto:") ? safeDecode(href) : href;
      if (
        (href.startsWith("mailto:") && /patrocinio|sponsor/i.test(decoded)) ||
        href === "/sponsors" ||
        href.endsWith("/sponsors") ||
        href.includes("#patrocinadores")
      ) {
        pushEvent("click_sponsor", base);
      }
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
