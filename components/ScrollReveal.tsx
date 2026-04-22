"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Shared observer instances keyed by threshold — avoids creating one per component.
// Using WeakMap so entries are garbage-collected when elements are removed.
const observerMap = new Map<number, IntersectionObserver>();
const callbackMap = new WeakMap<Element, () => void>();

function getObserver(threshold: number): IntersectionObserver {
  if (observerMap.has(threshold)) return observerMap.get(threshold)!;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const cb = callbackMap.get(entry.target);
          if (cb) {
            cb();
            observer.unobserve(entry.target);
            callbackMap.delete(entry.target);
          }
        }
      }
    },
    { threshold, rootMargin: "0px 0px -40px 0px" }
  );

  observerMap.set(threshold, observer);
  return observer;
}

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "left" | "right" | "scale";
  delay?: number;
  threshold?: number;
  stagger?: boolean;
}

export default function ScrollReveal({
  children,
  className = "",
  direction = "up",
  delay = 0,
  threshold = 0.15,
  stagger = false,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = getObserver(threshold);
    callbackMap.set(el, () => el.classList.add("visible"));
    observer.observe(el);

    return () => {
      observer.unobserve(el);
      callbackMap.delete(el);
    };
  }, [threshold]);

  const dirClass =
    direction === "left"
      ? "reveal-left"
      : direction === "right"
        ? "reveal-right"
        : direction === "scale"
          ? "reveal-scale"
          : "reveal";

  return (
    <div
      ref={ref}
      className={`${dirClass} ${stagger ? "stagger-children" : ""} ${className}`}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
}
