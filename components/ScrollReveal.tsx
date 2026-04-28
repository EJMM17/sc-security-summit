import type { ReactNode } from "react";

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
  threshold: _threshold = 0.15,
  stagger = false,
}: ScrollRevealProps) {
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
      className={`${dirClass} ${stagger ? "stagger-children" : ""} ${className}`}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
}
