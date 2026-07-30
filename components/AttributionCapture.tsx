"use client";

import { useEffect, useState } from "react";
import {
  ATTRIBUTION_FIELD_KEYS,
  captureAttribution,
  clearAttribution,
  getAttributionPayload,
  type AttributionPayload,
} from "@/lib/attribution";
import {
  COOKIE_CONSENT_EVENT,
  isCookieConsentDecision,
  readCookieConsentDecision,
} from "@/lib/consent";

/**
 * Persists marketing attribution only after explicit marketing consent and —
 * when `asInputs` is set — renders the approved fields as hidden inputs.
 *
 * Invisible: renders nothing visual; the hidden inputs do not affect the
 * form layout or the approved UI.
 */
export default function AttributionCapture({ asInputs = false }: { asInputs?: boolean }) {
  const [payload, setPayload] = useState<AttributionPayload | null>(null);

  useEffect(() => {
    const synchronize = (decision = readCookieConsentDecision()) => {
      const granted = decision === "all";
      if (granted) {
        captureAttribution(true);
        if (asInputs) setPayload(getAttributionPayload(true));
      } else {
        clearAttribution();
        if (asInputs) setPayload(null);
      }
    };

    synchronize();
    const onConsent = (event: Event) => {
      const detail: unknown = (event as CustomEvent).detail;
      synchronize(isCookieConsentDecision(detail) ? detail : null);
    };
    window.addEventListener(COOKIE_CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsent);
  }, [asInputs]);

  if (!asInputs) return null;

  return (
    <>
      {ATTRIBUTION_FIELD_KEYS.map((name) => (
        <input key={name} type="hidden" name={name} value={payload?.[name] ?? ""} readOnly />
      ))}
    </>
  );
}
