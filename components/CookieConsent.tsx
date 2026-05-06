"use client";

import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "scss2026:cookie-consent";

type Decision = "all" | "essential";

type Language = "es" | "en";

const text = {
  es: {
    title: "Privacidad y cookies",
    body: "Utilizamos cookies esenciales para el funcionamiento del sitio y analíticas para mejorar tu experiencia. Al continuar, aceptas nuestra política de privacidad.",
    acceptAll: "Aceptar todas",
    essential: "Solo esenciales",
    privacyLabel: "Aviso de Privacidad",
  },
  en: {
    title: "Privacy & cookies",
    body: "We use essential cookies for site functionality and analytics to improve your experience. By continuing you accept our privacy policy.",
    acceptAll: "Accept all",
    essential: "Essential only",
    privacyLabel: "Privacy Notice",
  },
} as const;

export default function CookieConsent({ language = "es" }: { language?: Language }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable (private mode, etc.) — show banner this session.
      setVisible(true);
    }
  }, []);

  function decide(decision: Decision) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ decision, ts: Date.now() }),
      );
    } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  const t = text[language];

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t.title}
      className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-cyan-500/30 bg-slate-900/95 p-4 sm:p-5 text-slate-100 shadow-2xl backdrop-blur">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300">
            <Cookie className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{t.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              {t.body}{" "}
              <a
                href="/aviso-de-privacidad"
                className="font-semibold text-cyan-300 underline-offset-2 hover:underline"
              >
                {t.privacyLabel}
              </a>
              .
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => decide("all")}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                {t.acceptAll}
              </button>
              <button
                type="button"
                onClick={() => decide("essential")}
                className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                {t.essential}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
