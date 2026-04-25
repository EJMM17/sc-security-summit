"use client";

import { useEffect, type ReactNode } from "react";

export default function HeaderScroll({ children }: { children?: ReactNode }) {
  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const headerEl = header;

    let scrolled = false;
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const nextScrolled = window.scrollY > 60;
        if (nextScrolled !== scrolled) {
          scrolled = nextScrolled;
          headerEl.classList.toggle("header-scrolled", scrolled);
        }
        ticking = false;
      });
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <>{children}</>;
}
