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
 *   section_view     → first meaningful view of each landing section
 *   scroll_depth     → 25/50/75/90/100% page-depth milestones
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

function pageContext() {
  return {
    page_path: window.location.pathname,
    language: document.documentElement.lang || "es",
  };
}

export default function InteractionTracker() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Element | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      if (!href) return;

      const { page_path: path, language } = pageContext();
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

  useEffect(() => {
    const milestones = [25, 50, 75, 90, 100] as const;
    const fired = new Set<number>();
    let ticking = false;

    function onScrollDepth() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollable <= 0) return;

        const depth = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
        for (const milestone of milestones) {
          if (depth < milestone || fired.has(milestone)) continue;
          fired.add(milestone);
          pushEvent("scroll_depth", { ...pageContext(), percent_scrolled: milestone });
        }
      });
    }

    onScrollDepth();
    window.addEventListener("scroll", onScrollDepth, { passive: true });
    window.addEventListener("resize", onScrollDepth);
    return () => {
      window.removeEventListener("scroll", onScrollDepth);
      window.removeEventListener("resize", onScrollDepth);
    };
  }, []);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;

    const seen = new Set<string>();
    const sections = Array.from(document.querySelectorAll<HTMLElement>("section[id]"));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const section = entry.target as HTMLElement;
          if (!entry.isIntersecting || seen.has(section.id)) continue;
          seen.add(section.id);
          pushEvent("section_view", {
            ...pageContext(),
            section_id: section.id,
          });
          observer.unobserve(section);
        }
      },
      { rootMargin: "0px 0px -35% 0px", threshold: 0.35 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return null;
}
