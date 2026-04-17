"use client";

import { useEffect, useState, type ReactNode } from "react";

export default function HeaderScroll({ children }: { children?: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 60);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Toggle class on <header> element */
  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    if (scrolled) {
      header.classList.add("header-scrolled");
    } else {
      header.classList.remove("header-scrolled");
    }
  }, [scrolled]);

  return <>{children}</>;
}
