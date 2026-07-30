"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  COOKIE_CONSENT_EVENT,
  readCookieConsentDecision,
} from "@/lib/consent";

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
