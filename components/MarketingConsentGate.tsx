"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  COOKIE_CONSENT_EVENT,
  readCookieConsentDecision,
} from "@/lib/consent";

/**
 * Renders analytics and marketing integrations only after the visitor accepts
 * all cookies. This is basic consent mode: no third-party tag or product
 * telemetry is mounted, and no interaction event is queued, before opt-in.
 */
export default function MarketingConsentGate({ children }: { children: ReactNode }) {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    setGranted(readCookieConsentDecision() === "all");

    const onConsent = (event: Event) => {
      setGranted((event as CustomEvent).detail === "all");
    };
    window.addEventListener(COOKIE_CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsent);
  }, []);

  if (!granted) return null;
  return <>{children}</>;
}
