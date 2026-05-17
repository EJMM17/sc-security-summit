"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Mail, ArrowRight } from "lucide-react";

type Language = "es" | "en";

const STORAGE_KEY = "scss2026:lead-capture";
const SCROLL_THRESHOLD = 0.6; // 60% of page
const DELAY_MS = 45_000; // 45 seconds

const text = {
  es: {
    title: "Recibe el programa completo",
    desc: "Sé el primero en conocer la agenda, speakers confirmados y beneficios exclusivos del Summit.",
    placeholder: "tu@email.com",
    cta: "Enviar",
    success: "¡Listo! Te mantendremos informado.",
    privacy: "Sin spam. Puedes darte de baja en cualquier momento.",
  },
  en: {
    title: "Get the full program",
    desc: "Be the first to know the agenda, confirmed speakers, and exclusive benefits of the Summit.",
    placeholder: "you@email.com",
    cta: "Submit",
    success: "Done! We'll keep you informed.",
    privacy: "No spam. Unsubscribe anytime.",
  },
} as const;

export default function LeadCapture({ language = "es" }: { language?: Language }) {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now() }));
    } catch {}
  }, []);

  useEffect(() => {
    // Don't show if already dismissed
    try {
      if (window.localStorage.getItem(STORAGE_KEY)) return;
    } catch {}

    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      setVisible(true);
    };

    // Timer trigger
    const timer = setTimeout(show, DELAY_MS);

    // Scroll trigger
    const onScroll = () => {
      const scrollRatio =
        window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollRatio >= SCROLL_THRESHOLD) {
        show();
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Push to dataLayer for GTM capture
    if (typeof window !== "undefined" && "dataLayer" in window) {
      const dataLayer = (window as Record<string, unknown>).dataLayer as unknown[];
      dataLayer.push({
        event: "lead_capture",
        lead_email: email,
        lead_source: "popup",
      });
    }

    // Meta Pixel lead event
    if (typeof window !== "undefined" && "fbq" in window) {
      const fbq = (window as Record<string, unknown>).fbq as (
        ...args: unknown[]
      ) => void;
      fbq("track", "Lead", { content_name: "SC Summit 2026 — Program Download" });
    }

    setSubmitted(true);
    setTimeout(dismiss, 2500);
  };

  if (!visible) return null;

  const t = text[language];

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-label={t.title}
        className="relative w-full max-w-md rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-2xl p-6 sm:p-8 animate-slide-up"
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-oswald text-xl font-bold text-slate-900">{t.title}</h3>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-5">{t.desc}</p>

        {submitted ? (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
            <p className="text-sm font-semibold text-green-700">{t.success}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.placeholder}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors flex items-center gap-1.5 flex-shrink-0"
              >
                {t.cta}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400">{t.privacy}</p>
          </form>
        )}
      </div>
    </div>
  );
}
