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

export default function OnDemandMap({
  buttonLabel,
  privacyNote,
  title,
}: OnDemandMapProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  if (isLoaded) {
    return (
      <iframe
        src={MAP_EMBED_URL}
        className="h-[280px] w-full sm:h-[350px]"
        style={{ border: 0 }}
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        title={title}
      />
    );
  }

  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center sm:h-[350px]">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
        <MapPin className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="max-w-sm text-sm leading-relaxed text-slate-500">
        {privacyNote}
      </p>
      <button
        type="button"
        className="btn-secondary px-5 py-3 text-sm"
        onClick={() => setIsLoaded(true)}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
