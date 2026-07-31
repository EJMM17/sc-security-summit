"use client";

import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { clearAttribution } from "@/lib/attribution";
import {
  COOKIE_CONSENT_EVENT,
  COOKIE_CONSENT_STORAGE_KEY,
  readCookieConsentDecision,
  type CookieConsentDecision,
} from "@/lib/consent";

type Language = "es" | "en";

const text = {
  es: {
    title: "Privacidad y cookies",
    essentialCopy: "Usamos cookies esenciales para que el sitio funcione.",
    optionalCopy:
      "Con tu permiso, usamos analítica y marketing para mejorar tu experiencia y medir campañas.",
    acceptAll: "Aceptar todas",
    essential: "Solo esenciales",
    privacyLabel: "Aviso de Privacidad",
    settings: "Configurar cookies",
  },
  en: {
    title: "Privacy & cookies",
    essentialCopy: "We use essential cookies to run the site.",
    optionalCopy:
      "With your permission, we use analytics and marketing to improve your experience and measure campaigns.",
    acceptAll: "Accept all",
    essential: "Essential only",
    privacyLabel: "Privacy Notice",
    settings: "Cookie settings",
  },
} as const;

export default function CookieConsent({
  language = "es",
  marketingEnabled = true,
}: {
  language?: Language;
  marketingEnabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [hasDecision, setHasDecision] = useState(false);

  useEffect(() => {
    const decision = readCookieConsentDecision();
    if (!marketingEnabled) clearAttribution();
    setHasDecision(decision !== null);
    setVisible(decision === null);
  }, [marketingEnabled]);

  function decide(decision: CookieConsentDecision) {
    const previousDecision = readCookieConsentDecision();
    try {
      window.localStorage.setItem(
        COOKIE_CONSENT_STORAGE_KEY,
        JSON.stringify({ decision, ts: Date.now() }),
      );
    } catch {}

    if (!marketingEnabled || decision === "essential") clearAttribution();

    // Google Consent Mode v2 — flip storage based on the choice. GTM requires
    // the real gtag `arguments` object (not a plain array), so we reuse the
    // global gtag defined by ConsentMode, with a safe fallback.
    try {
      const w = window as unknown as {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
      };
      w.dataLayer = w.dataLayer || [];
      const gtag =
        w.gtag ||
        function gtag(...args: unknown[]) {
          w.dataLayer!.push(args);
        };
      const value = decision === "all" ? "granted" : "denied";
      gtag("consent", "update", {
        ad_storage: value,
        ad_user_data: value,
        ad_personalization: value,
        analytics_storage: value,
      });
      w.dataLayer.push({ event: "consent_update", consent_decision: decision });
    } catch {}

    // Notify consent-gated pixels (Meta, LinkedIn) without a page reload.
    try {
      window.dispatchEvent(
        new CustomEvent(COOKIE_CONSENT_EVENT, { detail: decision }),
      );
    } catch {}

    setHasDecision(true);
    setVisible(false);

    // Reload only when withdrawing a previous grant. This guarantees that
    // third-party scripts already loaded in this page are removed.
    if (previousDecision === "all" && decision === "essential") {
      window.location.reload();
    }
  }

  const t = text[language];

  if (!visible) {
    if (!hasDecision) return null;
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        className="fixed bottom-3 left-3 z-[90] rounded-full border border-slate-300 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-md backdrop-blur transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        {t.settings}
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t.title}
      className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto max-w-3xl rounded-[20px] border border-slate-700 bg-slate-900 p-4 sm:p-5 text-slate-100 shadow-lg">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300">
            <Cookie className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{t.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              {t.essentialCopy}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              {t.optionalCopy}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              <a
                href="/aviso-de-privacidad"
                className="font-semibold text-cyan-300 underline-offset-2 hover:underline"
              >
                {t.privacyLabel}
              </a>
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => decide("all")}
                className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                {t.acceptAll}
              </button>
              <button
                type="button"
                onClick={() => decide("essential")}
                className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
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
