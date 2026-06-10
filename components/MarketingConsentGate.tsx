"use client";

import { useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "scss2026:cookie-consent";
export const CONSENT_EVENT = "scss2026:consent";

/**
 * Renders marketing pixels (Meta, LinkedIn) only after the visitor accepts
 * all cookies. GTM/GA stay outside this gate because they honor Google
 * Consent Mode v2 defaults (denied) on their own; Meta Pixel and LinkedIn
 * Insight have no equivalent built-in gating, so they must not load until
 * consent is granted.
 */
export default function MarketingConsentGate({ children }: { children: ReactNode }) {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw && JSON.parse(raw)?.decision === "all") {
        setGranted(true);
        return;
      }
    } catch {
      // localStorage unavailable — stay gated until an explicit accept event.
    }

    const onConsent = (event: Event) => {
      if ((event as CustomEvent).detail === "all") setGranted(true);
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  if (!granted) return null;
  return <>{children}</>;
}
