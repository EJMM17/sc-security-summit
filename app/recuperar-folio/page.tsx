import type { Metadata } from "next";
import { headers } from "next/headers";
import { Shield, ArrowLeft } from "lucide-react";
import RecuperarFolioForm from "@/components/RecuperarFolioForm";
import { EVENT } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Recuperar mi folio | SC Security Summit 2026",
  description:
    "Reenvío del folio de registro al correo con el que te inscribiste al SC Security Summit 2026.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: "/recuperar-folio",
  },
};

const copy = {
  es: {
    backLabel: "Regresar al inicio",
    heading: "Recupera tu folio",
    sub: "Si ya te registraste y no encuentras el correo de confirmación, ingresa la dirección con la que te inscribiste y te lo reenviaremos.",
    contactPrefix: "¿No te llega después de 30 minutos? Escríbenos a",
  },
  en: {
    backLabel: "Back to home",
    heading: "Recover your folio",
    sub: "If you already registered and can't find the confirmation email, enter the address you signed up with and we'll send it again.",
    contactPrefix: "Still nothing after 30 minutes? Write us at",
  },
} as const;

export default async function RecuperarFolioPage() {
  const h = await headers();
  const acceptLanguage = h.get("accept-language");
  const language: "es" | "en" =
    acceptLanguage && /^en\b/i.test(acceptLanguage) ? "en" : "es";
  const t = copy[language];

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-slate-900 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <span
                className="font-bold text-white text-sm tracking-tight"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                SC SUMMIT
              </span>
              <span className="block text-[10px] font-bold tracking-[0.2em] text-blue-400">
                REYNOSA 2026
              </span>
            </div>
          </a>
          <a
            href="/"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> {t.backLabel}
          </a>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 sm:px-6 py-16">
        <h1
          className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3"
          style={{ fontFamily: "var(--font-oswald)" }}
        >
          {t.heading}
        </h1>
        <p className="text-sm text-slate-600 mb-8 leading-relaxed">{t.sub}</p>

        <RecuperarFolioForm language={language} />

        <p className="text-xs text-slate-500 mt-8 text-center">
          {t.contactPrefix}{" "}
          <a
            href={`mailto:${EVENT.contact}`}
            className="text-blue-600 hover:underline"
          >
            {EVENT.contact}
          </a>
        </p>
      </main>
    </div>
  );
}
