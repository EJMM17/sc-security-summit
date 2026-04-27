"use client";

import { useState, useEffect } from "react";

type Language = "es" | "en";

const TARGET_DATE = new Date("2026-09-24T08:00:00-06:00").getTime();

function getTimeLeft() {
  const now = Date.now();
  const diff = Math.max(TARGET_DATE - now, 0);
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

/* Renders a single number with a slide-up animation each time value changes.
   Using key forces React to remount the span, restarting the CSS animation. */
function FlipNumber({ value, mounted }: { value: number; mounted: boolean }) {
  const display = mounted ? String(value).padStart(2, "0") : "--";
  return (
    <span key={display} className="countdown-flip" suppressHydrationWarning>
      {display}
    </span>
  );
}

export default function CountdownTimer({ language = "es" }: { language?: Language }) {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setMounted(true);
    setTime(getTimeLeft());
    const interval = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  const units = language === "es"
    ? [
        { value: time.days,    label: "Días"  },
        { value: time.hours,   label: "Horas" },
        { value: time.minutes, label: "Min"   },
        { value: time.seconds, label: "Seg"   },
      ]
    : [
        { value: time.days,    label: "Days"  },
        { value: time.hours,   label: "Hours" },
        { value: time.minutes, label: "Min"   },
        { value: time.seconds, label: "Sec"   },
      ];

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:flex sm:items-center sm:gap-4">
      {units.map((u, i) => (
        <div key={u.label} className="flex items-center justify-center gap-2 sm:gap-4">
          <div className="countdown-unit">
            <div className="countdown-number" style={{ overflow: "hidden" }}>
              <FlipNumber value={u.value} mounted={mounted} />
            </div>
            <div className="countdown-label">{u.label}</div>
          </div>
          {i < units.length - 1 && (
            <span className="countdown-separator hidden sm:inline-flex">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
