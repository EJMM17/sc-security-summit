"use client";

import { useEffect } from "react";

/**
 * Tracks the pointer inside cards that opt into the spotlight treatment and
 * publishes its local position as `--spot-x` / `--spot-y`. The gradient itself
 * lives in `app/globals.css`; this component only feeds it coordinates.
 *
 * One delegated listener covers every card on the page, writes are coalesced
 * into a single animation frame, and the whole effect stays unmounted for
 * coarse pointers and for visitors who asked for reduced motion.
 */
const SPOTLIGHT_SELECTOR = ".surface-card, .card-elevated, .pricing-tier";

export default function PointerSpotlight() {
  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return;

    let frame = 0;
    let target: HTMLElement | null = null;
    let clientX = 0;
    let clientY = 0;
    let active: HTMLElement | null = null;

    const paint = () => {
      frame = 0;
      if (!target) return;

      const rect = target.getBoundingClientRect();
      target.style.setProperty("--spot-x", `${clientX - rect.left}px`);
      target.style.setProperty("--spot-y", `${clientY - rect.top}px`);
    };

    const onPointerMove = (event: PointerEvent) => {
      const node = event.target;
      const card =
        node instanceof Element ? node.closest(SPOTLIGHT_SELECTOR) : null;

      if (!(card instanceof HTMLElement)) {
        if (active) {
          active.removeAttribute("data-spotlight");
          active = null;
        }
        target = null;
        return;
      }

      if (active && active !== card) active.removeAttribute("data-spotlight");
      if (active !== card) {
        card.setAttribute("data-spotlight", "on");
        active = card;
      }

      target = card;
      clientX = event.clientX;
      clientY = event.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    document.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      if (frame) cancelAnimationFrame(frame);
      active?.removeAttribute("data-spotlight");
    };
  }, []);

  return null;
}
