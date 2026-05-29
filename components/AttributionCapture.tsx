"use client";

import { useEffect, useState } from "react";
import {
  ATTRIBUTION_FIELD_KEYS,
  captureAttribution,
  getAttributionPayload,
  type AttributionPayload,
} from "@/lib/attribution";

/**
 * Persists marketing attribution on mount (every page) and — when
 * `asInputs` is set — renders hidden form inputs carrying the captured
 * UTM / click-id / landing-page / referrer / touch-timestamp values so
 * they ride along with the registration POST.
 *
 * Invisible: renders nothing visual; the hidden inputs do not affect the
 * form layout or the approved UI.
 */
export default function AttributionCapture({ asInputs = false }: { asInputs?: boolean }) {
  const [payload, setPayload] = useState<AttributionPayload | null>(null);

  useEffect(() => {
    captureAttribution();
    if (asInputs) setPayload(getAttributionPayload());
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
