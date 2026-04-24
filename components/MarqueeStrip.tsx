"use client";

import { useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   MARQUEE STRIP — Infinite Horizontal Ticker
   ═══════════════════════════════════════════════════════════════
   Awwwards-level infinite horizontal scroll used between sections.
   CSS-only animation with duplicated content for seamless loop.
   Pauses on hover, respects reduced-motion.
   ─────────────────────────────────────────────────────────────── */

interface MarqueeStripProps {
  items: string[];
  /** Speed in seconds for one full cycle */
  speed?: number;
  /** Separator character between items */
  separator?: string;
  /** Extra CSS classes */
  className?: string;
  /** Reverse direction */
  reverse?: boolean;
}

export default function MarqueeStrip({
  items,
  speed = 35,
  separator = "·",
  className = "",
  reverse = false,
}: MarqueeStripProps) {
  const [isReduced, setIsReduced] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsReduced(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  const content = items.map((item, i) => (
    <span key={i} className="marquee-item">
      <span className="marquee-text">{item}</span>
      <span className="marquee-sep" aria-hidden="true">
        {separator}
      </span>
    </span>
  ));

  return (
    <div
      className={`marquee-strip ${className}`}
      aria-label={items.join(", ")}
      role="marquee"
    >
      <div
        ref={trackRef}
        className="marquee-track"
        style={{
          animationDuration: `${speed}s`,
          animationDirection: reverse ? "reverse" : "normal",
          animationPlayState: isReduced ? "paused" : "running",
        }}
      >
        {/* Duplicate content 4× for seamless loop */}
        {content}
        {content}
        {content}
        {content}
      </div>
    </div>
  );
}
