"use client";

import { useEffect } from "react";

const observerMap = new Map<number, IntersectionObserver>();
const callbackMap = new WeakMap<Element, () => void>();

function getObserver(threshold: number): IntersectionObserver {
  if (observerMap.has(threshold)) return observerMap.get(threshold)!;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const callback = callbackMap.get(entry.target);
          if (callback) {
            callback();
            observer.unobserve(entry.target);
            callbackMap.delete(entry.target);
          }
        }
      }
    },
    { threshold, rootMargin: "0px 0px -40px 0px" },
  );

  observerMap.set(threshold, observer);
  return observer;
}

export default function ScrollRevealObserver() {
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".reveal, .reveal-left, .reveal-right, .reveal-scale",
      ),
    );

    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      for (const element of elements) element.classList.add("visible");
      return;
    }

    for (const element of elements) {
      if (element.classList.contains("visible")) continue;

      // Server content is visible by default. Only arm an entrance below the
      // viewport after the observer is available; restored scroll positions
      // and deep links must never flash or conceal already reached content.
      if (element.getBoundingClientRect().top < window.innerHeight) {
        element.classList.add("visible");
        continue;
      }

      const configuredThreshold = Number(element.dataset.revealThreshold);
      const threshold = Number.isFinite(configuredThreshold)
        ? Math.min(1, Math.max(0, configuredThreshold))
        : 0.15;
      const observer = getObserver(threshold);

      callbackMap.set(element, () => {
        element.classList.add("visible");
        element.removeAttribute("data-reveal-pending");
      });
      observer.observe(element);
      element.setAttribute("data-reveal-pending", "");
    }

    return () => {
      for (const element of elements) {
        const configuredThreshold = Number(element.dataset.revealThreshold);
        const threshold = Number.isFinite(configuredThreshold)
          ? Math.min(1, Math.max(0, configuredThreshold))
          : 0.15;
        const observer = observerMap.get(threshold);
        if (observer) observer.unobserve(element);
        callbackMap.delete(element);
        element.removeAttribute("data-reveal-pending");
      }
    };
  }, []);

  return null;
}
