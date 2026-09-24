"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Clock } from "lucide-react";
import type { Language } from "@/lib/language";

// Reynosa (America/Matamoros) observes US DST: UTC-5 in September.
const EVENT_START = new Date("2026-09-24T08:00:00-05:00").getTime();
const EVENT_END = new Date("2026-09-24T19:00:00-05:00").getTime();
// Inside the last two days the label stops counting "time remaining" and
// starts announcing the doors, and a hairline under the clock fills as those
// hours run out: the clock reads as an arrival rather than a deadline, which
// is urgency without a banner.
const IMMINENT_WINDOW_MS = 48 * 3_600_000;

type Phase = "countdown" | "imminent" | "live" | "over";

type CountdownValue = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  phase: Phase;
  /** Share of the final 48 hours already gone, from 0 to 1. */
  windowElapsed: number;
};

function getPhase(now: number): Phase {
  if (now >= EVENT_END) return "over";
  if (now >= EVENT_START) return "live";
  return EVENT_START - now < IMMINENT_WINDOW_MS ? "imminent" : "countdown";
}

function getCountdown(now: number): CountdownValue {
  const remaining = Math.max(0, EVENT_START - now);

  return {
    phase: getPhase(now),
    windowElapsed: Math.min(1, Math.max(0, 1 - remaining / IMMINENT_WINDOW_MS)),
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining / 3_600_000) % 24),
    minutes: Math.floor((remaining / 60_000) % 60),
    seconds: Math.floor((remaining / 1_000) % 60),
  };
}

const HEADINGS: Record<Phase, Record<Language, string>> = {
  countdown: { es: "Faltan", en: "Time remaining" },
  imminent: { es: "Las puertas abren en", en: "Doors open in" },
  live: { es: "En vivo ahora", en: "Live now" },
  over: { es: "", en: "" },
};

export default function EventCountdown({ language }: { language: Language }) {
  const [value, setValue] = useState<CountdownValue | null>(null);

  useEffect(() => {
    const update = () => setValue(getCountdown(Date.now()));
    update();

    const interval = window.setInterval(update, 1_000);
    return () => window.clearInterval(interval);
  }, []);

  const phase = value?.phase ?? "countdown";
  // Once the day is over there is nothing left to count toward.
  if (phase === "over") return null;

  const labels =
    language === "es"
      ? ["Días", "Horas", "Min", "Seg"]
      : ["Days", "Hours", "Min", "Sec"];
  const values = value
    ? [value.days, value.hours, value.minutes, value.seconds]
    : ["--", "--", "--", "--"];

  return (
    <div
      className="event-countdown"
      data-phase={value ? phase : undefined}
      aria-label={language === "es" ? "Cuenta regresiva" : "Countdown"}
    >
      <p>
        {phase === "live" ? (
          <span className="event-countdown-live" aria-hidden="true" />
        ) : (
          <Clock aria-hidden="true" />
        )}
        {HEADINGS[phase][language]}
      </p>
      {/* While the event runs the clock would only read 00:00:00, so the
          live label stands on its own. */}
      {phase === "live" ? null : (
        <div>
          {values.map((item, index) => {
            const digits =
              typeof item === "number" ? String(item).padStart(2, "0") : item;

            return (
              <div key={labels[index]}>
                <strong>
                  {/* Keying on the value remounts the span whenever this unit
                      ticks, which replays the roll-in on that unit alone —
                      seconds move every second, days stay still. */}
                  <span key={digits} className="countdown-digit">
                    {digits}
                  </span>
                </strong>
                <span>{labels[index]}</span>
              </div>
            );
          })}
        </div>
      )}
      {phase === "imminent" && value ? (
        <span className="event-countdown-window" aria-hidden="true">
          <span
            style={
              {
                "--window-progress": value.windowElapsed,
              } as CSSProperties
            }
          />
        </span>
      ) : null}
    </div>
  );
}
