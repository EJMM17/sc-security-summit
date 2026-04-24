"use client";

import { useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   MOUSE GLOW — Stripe Sessions–Inspired Cursor Spotlight
   ═══════════════════════════════════════════════════════════════
   Renders a soft radial spotlight that follows the mouse within
   a container. Used on card grids (pillars, why attend, pricing)
   to add depth and interactivity. Lightweight — CSS-only effect,
   no WebGL overhead. Respects prefers-reduced-motion.
   ─────────────────────────────────────────────────────────────── */

interface MouseGlowProps {
  /** Glow color — CSS color with alpha, defaults to brand blue */
  color?: string;
  /** Glow radius in px */
  radius?: number;
  /** Extra CSS classes on the container */
  className?: string;
  children: React.ReactNode;
}

export default function MouseGlow({
  color = "rgba(37, 99, 235, 0.08)",
  radius = 400,
  className = "",
  children,
}: MouseGlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const active = useRef(false);
  const raf = useRef(0);

  const animate = useCallback(() => {
    pos.current.x += (target.current.x - pos.current.x) * 0.08;
    pos.current.y += (target.current.y - pos.current.y) * 0.08;

    if (glowRef.current) {
      glowRef.current.style.background = `radial-gradient(${radius}px circle at ${pos.current.x}px ${pos.current.y}px, ${color}, transparent 70%)`;
      glowRef.current.style.opacity = active.current ? "1" : "0";
    }

    raf.current = requestAnimationFrame(animate);
  }, [color, radius]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = containerRef.current;
    if (!el) return;

    const onEnter = () => {
      active.current = true;
    };
    const onLeave = () => {
      active.current = false;
    };
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      target.current.x = e.clientX - rect.left;
      target.current.y = e.clientY - rect.top;
    };

    el.addEventListener("mouseenter", onEnter, { passive: true });
    el.addEventListener("mouseleave", onLeave, { passive: true });
    el.addEventListener("mousemove", onMove, { passive: true });

    raf.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf.current);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("mousemove", onMove);
    };
  }, [animate]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Glow layer */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500"
        style={{ opacity: 0 }}
      />
      {/* Content — above the glow */}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
