"use client";

import { useActionState } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { recuperarFolio, type RecuperarFolioState } from "@/app/actions/recuperar-folio";

type Language = "es" | "en";

const text = {
  es: {
    emailLabel: "Correo registrado",
    emailPlaceholder: "tu@empresa.com",
    submit: "Enviar mi folio",
    pending: "Enviando...",
    websiteLabel: "Website (no llenar)",
    successHeading: "Solicitud recibida",
  },
  en: {
    emailLabel: "Registered email",
    emailPlaceholder: "you@company.com",
    submit: "Send me my folio",
    pending: "Sending...",
    websiteLabel: "Website (leave blank)",
    successHeading: "Request received",
  },
} as const;

const initialState: RecuperarFolioState = { success: false, message: "" };

const inputClass =
  "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function RecuperarFolioForm({ language = "es" }: { language?: Language }) {
  const [state, formAction, isPending] = useActionState(recuperarFolio, initialState);
  const t = text[language];

  if (state.success && state.message) {
    return (
      <div className="flex flex-col items-center text-center py-10">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" aria-hidden="true" />
        <h2
          className="text-xl font-bold text-slate-900 mb-2"
          style={{ fontFamily: "var(--font-oswald)" }}
        >
          {t.successHeading}
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-sm">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="language" value={language} />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "auto",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        <label htmlFor="rec-website">{t.websiteLabel}</label>
        <input
          id="rec-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="rec-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
          {t.emailLabel}
        </label>
        <input
          id="rec-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t.emailPlaceholder}
          aria-describedby={state.errors?.email ? "rec-email-error" : undefined}
          aria-invalid={state.errors?.email ? true : undefined}
          className={inputClass}
        />
        {state.errors?.email && (
          <p id="rec-email-error" role="alert" className="text-xs text-red-500 mt-1.5">
            {state.errors.email[0]}
          </p>
        )}
      </div>

      {turnstileSiteKey && (
        <div
          className="cf-turnstile"
          data-sitekey={turnstileSiteKey}
          data-theme="light"
          data-size="flexible"
        />
      )}

      {state.message && !state.success && (
        <p role="alert" className="text-sm text-red-600">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary w-full py-4 text-base">
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t.pending}
          </>
        ) : (
          <>
            {t.submit}
            <Send className="w-4 h-4 ml-1" />
          </>
        )}
      </button>
    </form>
  );
}
