"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

const MAP_EMBED_URL =
  "https://www.google.com/maps?q=Libramiento+Ote+S/N,+Azteca,+88680+Reynosa,+Tamaulipas,+Mexico&output=embed";

type OnDemandMapProps = {
  buttonLabel: string;
  privacyNote: string;
  title: string;
};

/**
 * The map is part of the section composition, so it mounts with the page
 * instead of waiting for a click. It fades in over an on-brand skeleton once
 * the embed reports `load`. The frame is cross-origin, so readiness cannot be
 * inspected directly — the retry control remounts the iframe for the case
 * where the third-party request never completes.
 */
export default function OnDemandMap({
  buttonLabel,
  privacyNote,
  title,
}: OnDemandMapProps) {
  const [isReady, setIsReady] = useState(false);
  const [attempt, setAttempt] = useState(0);

  return (
    <figure className="summit-map">
      <div className="summit-map-frame">
        <div
          className={`summit-map-skeleton ${isReady ? "is-hidden" : ""}`}
          aria-hidden="true"
        >
          <span className="summit-map-skeleton-pin">
            <MapPin className="h-6 w-6" />
          </span>
          <span className="summit-map-skeleton-grid" />
        </div>

        <iframe
          key={attempt}
          src={MAP_EMBED_URL}
          className={`summit-map-embed ${isReady ? "is-ready" : ""}`}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          title={title}
          onLoad={() => setIsReady(true)}
        />

        <span className="summit-map-wash" aria-hidden="true" />
        <span className="summit-map-pulse" aria-hidden="true" />

        {!isReady ? (
          <button
            type="button"
            className="summit-map-retry"
            onClick={() => setAttempt((value) => value + 1)}
          >
            {buttonLabel}
          </button>
        ) : null}
      </div>
      <figcaption className="summit-map-note">{privacyNote}</figcaption>
    </figure>
  );
}
