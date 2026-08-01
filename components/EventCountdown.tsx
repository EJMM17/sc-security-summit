"use client";

import { useEffect, useState } from "react";
import type { Language } from "@/lib/language";

const EVENT_START = new Date("2026-09-24T08:00:00-05:00").getTime();

type CountdownValue = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getCountdown(now: number): CountdownValue {
  const remaining = Math.max(0, EVENT_START - now);

  return {
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining / 3_600_000) % 24),
    minutes: Math.floor((remaining / 60_000) % 60),
    seconds: Math.floor((remaining / 1_000) % 60),
  };
}

export default function EventCountdown({ language }: { language: Language }) {
  const [value, setValue] = useState<CountdownValue | null>(null);

  useEffect(() => {
    const update = () => setValue(getCountdown(Date.now()));
    update();

    const interval = window.setInterval(update, 1_000);
    return () => window.clearInterval(interval);
  }, []);

  const labels =
    language === "es"
      ? ["Días", "Horas", "Minutos", "Segundos"]
      : ["Days", "Hours", "Minutes", "Seconds"];
  const values = value
    ? [value.days, value.hours, value.minutes, value.seconds]
    : ["--", "--", "--", "--"];

  return (
    <div className="event-countdown" aria-label={language === "es" ? "Cuenta regresiva" : "Countdown"}>
      <p>{language === "es" ? "Faltan" : "Time remaining"}</p>
      <div>
        {values.map((item, index) => (
          <div key={labels[index]}>
            <strong>{typeof item === "number" ? String(item).padStart(2, "0") : item}</strong>
            <span>{labels[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
