"use client";

import { useEffect } from "react";

// Registers /sw.js in production builds. Disabled in dev so HMR + Turbopack
// aren't shadow-cached, and on /admin to avoid stale dashboard markup.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    if (window.location.pathname.startsWith("/admin")) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => {
        console.warn("[sw] registration failed", err);
      });
  }, []);

  return null;
}
