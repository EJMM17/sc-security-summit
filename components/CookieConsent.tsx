"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Image from "next/image";
import { clearAttribution } from "@/lib/attribution";
import {
  COOKIE_CONSENT_EVENT,
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_SETTINGS_EVENT,
  readCookieConsentDecision,
  type CookieConsentDecision,
} from "@/lib/consent";

type Language = "es" | "en";

const text = {
  es: {
    title: "Privacidad y cookies",
    essentialCopy:
      "Usamos cookies esenciales para que el sitio funcione. Con tu permiso, también usamos cookies de analítica y marketing (Google, Meta y LinkedIn) para mejorar tu experiencia y medir nuestras campañas.",
    changeCopy:
      "Puedes cambiar tu elección cuando quieras en «Configurar cookies», al pie de la página. Más detalles en nuestro",
    privacyLabel: "Aviso de Privacidad",
    acceptAll: "Aceptar todas",
    essential: "Solo esenciales",
  },
  en: {
    title: "Privacy & cookies",
    essentialCopy:
      "We use essential cookies to run the site. With your permission, we also use analytics and marketing cookies (Google, Meta and LinkedIn) to improve your experience and measure our campaigns.",
    changeCopy:
      "You can change your choice at any time from “Cookie settings” at the bottom of the page. More details in our",
    privacyLabel: "Privacy Notice",
    acceptAll: "Accept all",
    essential: "Essential only",
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
  // A returning visitor's stored choice hides that markup before first paint
  // (see ConsentMode) and is reconciled from localStorage before React paints.
  const [visible, setVisible] = useState(true);
  // Only the server-rendered notice may be hidden by the pre-paint flag; a
  // notice reopened from "Cookie settings" must always show.
  const [reopened, setReopened] = useState(false);

  useLayoutEffect(() => {
    const decision = readCookieConsentDecision();
    if (!marketingEnabled) clearAttribution();
    setVisible(decision === null);
  }, [marketingEnabled]);

  useEffect(() => {
    const open = () => {
      setReopened(true);
      setVisible(true);
    };
    window.addEventListener(COOKIE_SETTINGS_EVENT, open);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, open);
  }, []);

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

    // The notice closes completely once a choice is made. It comes back only
    // from the "Cookie settings" link in the footer or the privacy notice.
    setVisible(false);

    // Reload only when withdrawing a previous grant. This guarantees that
    // third-party scripts already loaded in this page are removed.
    if (previousDecision === "all" && decision === "essential") {
      window.location.reload();
    }
  }

  if (!visible) return null;

  const t = text[language];

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-copy"
      className="consent-dock"
      data-initial={reopened ? undefined : ""}
    >
      <div className="consent-panel">
        <div className="consent-panel-body">
          <div className="consent-panel-head">
            <span className="consent-panel-logo" aria-hidden="true">
              <Image
                src="/images/logo-symbol-blue.png"
                alt=""
                width={26}
                height={40}
                priority
              />
            </span>
            <div className="min-w-0">
              <p className="consent-panel-brand">SC Security Summit</p>
              <p id="cookie-consent-title" className="consent-panel-title">
                {t.title}
              </p>
            </div>
          </div>
          <p id="cookie-consent-copy" className="consent-panel-text">
            {t.essentialCopy}
          </p>
          <p className="consent-panel-text consent-panel-text--muted">
            {t.changeCopy}{" "}
            <a href="/aviso-de-privacidad" className="consent-panel-link">
              {t.privacyLabel}
            </a>
            .
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
  );
}
