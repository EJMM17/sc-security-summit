"use client";

// Client-side wrapper around AmbientCanvas. Layout.tsx is a server component
// and Next.js 15 forbids `next/dynamic({ ssr: false })` in server components,
// so this small "use client" boundary owns the dynamic import.
//
// We also wait for the browser to be idle before loading the canvas so the
// LCP / TTI on first paint isn't taxed by shader compilation. The visual is
// purely decorative — there's no functional regression if it never loads.

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const AmbientCanvas = dynamic(() => import("./AmbientCanvas"), {
  ssr: false,
  loading: () => null,
});

export default function AmbientCanvasLazy() {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Skip on devices with reduced-motion preference — the canvas is animated.
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    type IdleCallback = (cb: () => void) => number;
    const win = window as unknown as { requestIdleCallback?: IdleCallback };
    const schedule = win.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    const handle = schedule(() => setShouldRender(true));

    return () => {
      const cancelHandle = window as unknown as {
        cancelIdleCallback?: (h: number) => void;
      };
      if (cancelHandle.cancelIdleCallback) cancelHandle.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, []);

  if (!shouldRender) return null;
  return <AmbientCanvas />;
}
