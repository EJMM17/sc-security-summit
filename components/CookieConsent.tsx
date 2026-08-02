"use client";

import { useLayoutEffect, useState } from "react";
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
    optionalDetails: [
      "Con tu permiso, usamos analítica.",
      "También usamos marketing.",
      "Esto ayuda a mejorar tu experiencia.",
      "También permite medir campañas.",
    ],
    acceptAll: "Aceptar todas",
    essential: "Solo esenciales",
    privacyLabel: "Aviso de Privacidad",
    settings: "Configurar cookies",
  },
  en: {
    title: "Privacy & cookies",
    essentialCopy: "We use essential cookies to run the site.",
    optionalDetails: [
      "With your permission, we use analytics.",
      "We also use marketing.",
      "This helps improve your experience.",
      "It also helps measure campaigns.",
    ],
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
  // Render the undecided state in the initial HTML. Besides avoiding a late
  // layout change, this makes the privacy choice available before hydration.
  // Returning visitors are reconciled from localStorage before paint.
  const [visible, setVisible] = useState(true);
  const [hasDecision, setHasDecision] = useState(false);

  useLayoutEffect(() => {
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
        className="consent-fab"
      >
        <Cookie className="consent-fab-icon" aria-hidden="true" />
        <span>{t.settings}</span>
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t.title}
      className="consent-dock"
    >
      <div className="consent-panel">
        <div className="consent-panel-body">
          <div className="consent-panel-icon" aria-hidden="true">
            <Cookie className="h-5 w-5" />
          </div>
          <div className="consent-panel-copy">
            <p className="consent-panel-title">{t.title}</p>
            <p className="consent-panel-text">{t.essentialCopy}</p>
            <ul className="consent-panel-list">
              {t.optionalDetails.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            <p className="consent-panel-text">
              <a href="/aviso-de-privacidad" className="consent-panel-link">
                {t.privacyLabel}
              </a>
            </p>
            <div className="consent-panel-actions">
              <button
                type="button"
                onClick={() => decide("all")}
                className="consent-btn consent-btn--primary"
              >
                {t.acceptAll}
              </button>
              <button
                type="button"
                onClick={() => decide("essential")}
                className="consent-btn consent-btn--ghost"
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
