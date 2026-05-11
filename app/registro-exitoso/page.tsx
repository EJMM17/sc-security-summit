import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Calendar, MapPin, MessageCircle } from "lucide-react";

import CopyButton from "@/components/CopyButton";

export const metadata: Metadata = {
  title: "Registro confirmado · SC Security Summit 2026",
  robots: { index: false, follow: false },
};

type Tipo = "estudiante" | "general" | "vip";
type Language = "es" | "en";

const TIPO_LABEL: Record<Tipo, { es: string; en: string }> = {
  estudiante: { es: "Estudiante", en: "Student" },
  general:    { es: "General",    en: "General" },
  vip:        { es: "VIP",        en: "VIP" },
};

const TIPO_BADGE: Record<Tipo, string> = {
  estudiante: "bg-slate-100 text-slate-700 ring-slate-200",
  general:    "bg-blue-50 text-blue-700 ring-blue-200",
  vip:        "bg-amber-50 text-amber-700 ring-amber-200",
};

const COPY = {
  es: {
    eyebrow: "REGISTRO COMPLETO",
    title: "¡Tu lugar está reservado!",
    subtitle: "Te enviamos los siguientes pasos a continuación.",
    folioLabel: "Folio de confirmación",
    copyLabel: "Copiar",
    copiedLabel: "Copiado",
    amountSuffix: "MXN + IVA",
    nextStepsLabel: "PRÓXIMOS PASOS",
    nextStepsTitle: "¿Qué sigue?",
    steps: [
      {
        title: "Regístrate",
        desc: "Tu folio ya está generado: guárdalo para tu check-in",
      },
      {
        title: "Recibe instrucciones",
        desc: "Un representante de Lanz Logistics te contactará en 24–48 hrs hábiles con las instrucciones de pago",
      },
      {
        title: "Confirma tu lugar",
        desc: "Realiza el pago y recibirás tu confirmación final",
      },
    ],
    contactTitle: "¿Preguntas sobre el pago?",
    contactPrefix: "Escríbenos a",
    contactOr: "o al",
    eventDay: "El día del evento",
    eventDate: "24 de septiembre, 2026 · 8:00 AM — 5:30 PM",
    eventVenue: "Centro de Convenciones de Reynosa · Blvd. Morelos 190, Tamaulipas",
    addToCalendar: "Agregar al calendario",
    shareWhatsApp: "Compartir por WhatsApp",
    backHome: "Volver al inicio",
    shareMessage: (folio: string) =>
      `Me registré al SC Security Summit 2026 — 24 de septiembre en Reynosa. Mi folio: ${folio}`,
    eventLabel: "SC Security Summit 2026",
    calendarDetails: (folio: string) => `Folio: ${folio}`,
  },
  en: {
    eyebrow: "REGISTRATION COMPLETE",
    title: "Your spot is reserved!",
    subtitle: "Here's what happens next.",
    folioLabel: "Confirmation code",
    copyLabel: "Copy",
    copiedLabel: "Copied",
    amountSuffix: "MXN + VAT",
    nextStepsLabel: "NEXT STEPS",
    nextStepsTitle: "What's next?",
    steps: [
      {
        title: "Registered",
        desc: "Your code is generated — save it for check-in",
      },
      {
        title: "Receive instructions",
        desc: "A Lanz Logistics representative will reach out within 24–48 business hours with payment instructions",
      },
      {
        title: "Confirm your seat",
        desc: "Complete the payment and receive your final confirmation",
      },
    ],
    contactTitle: "Questions about payment?",
    contactPrefix: "Email us at",
    contactOr: "or call",
    eventDay: "On event day",
    eventDate: "September 24, 2026 · 8:00 AM — 5:30 PM",
    eventVenue: "Reynosa Convention Center · Blvd. Morelos 190, Tamaulipas",
    addToCalendar: "Add to calendar",
    shareWhatsApp: "Share on WhatsApp",
    backHome: "Back to home",
    shareMessage: (folio: string) =>
      `I just registered for the SC Security Summit 2026 — September 24 in Reynosa. My code: ${folio}`,
    eventLabel: "SC Security Summit 2026",
    calendarDetails: (folio: string) => `Confirmation: ${folio}`,
  },
} satisfies Record<Language, unknown>;

const formatMxn = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(n);

function calendarUrl(folio: string, language: Language): string {
  // 08:00–17:30 hora Reynosa (UTC-6) ⇒ 14:00:00Z–23:30:00Z UTC.
  const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
  const params = new URLSearchParams({
    text: COPY[language].eventLabel,
    dates: "20260924T140000Z/20260924T233000Z",
    details: COPY[language].calendarDetails(folio),
    location: "Centro de Convenciones de Reynosa, Blvd. Morelos 190, Reynosa, Tamaulipas",
  });
  return `${base}&${params.toString()}`;
}

function whatsappUrl(folio: string, language: Language): string {
  return `https://wa.me/?text=${encodeURIComponent(COPY[language].shareMessage(folio))}`;
}

function isTipo(value: string | undefined): value is Tipo {
  return value === "estudiante" || value === "general" || value === "vip";
}

export default async function RegistroExitosoPage({
  searchParams,
}: {
  searchParams: Promise<{ folio?: string; tipo?: string; monto?: string; lang?: string }>;
}) {
  const params = await searchParams;
  if (!params.folio) redirect("/");

  const language: Language = params.lang === "en" ? "en" : "es";
  const tipo: Tipo = isTipo(params.tipo) ? params.tipo : "general";
  const monto = params.monto && /^\d+$/.test(params.monto) ? Number(params.monto) : null;
  const folio = params.folio;
  const t = COPY[language];

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="px-4 sm:px-6 pt-16 pb-20">
        <div className="max-w-3xl mx-auto">
          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="text-center mb-10">
            <span className="section-label">{t.eyebrow}</span>
            <h1 className="section-title mt-3">{t.title}</h1>
            <p className="text-slate-500 max-w-xl mx-auto mt-4">{t.subtitle}</p>
          </div>

          {/* ── Folio card ──────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_-8px_rgba(15,23,42,0.08)] p-7 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {t.folioLabel}
                </p>
                <p
                  className="font-mono text-2xl sm:text-3xl font-bold text-slate-900 mt-2 break-all"
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  {folio}
                </p>
              </div>
              <CopyButton value={folio} label={t.copyLabel} copiedLabel={t.copiedLabel} />
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ring-1 ${TIPO_BADGE[tipo]}`}
              >
                {TIPO_LABEL[tipo][language]}
              </span>
              {monto !== null && (
                <span className="text-sm text-slate-600">
                  <span className="font-mono font-semibold text-slate-900">{formatMxn(monto)}</span>{" "}
                  {t.amountSuffix}
                </span>
              )}
            </div>
          </div>

          {/* ── Next steps card (mirrors landing's payment-steps pattern) */}
          <div className="mt-8 p-6 sm:p-8 rounded-2xl bg-blue-50 border border-blue-200">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
              {t.nextStepsLabel}
            </span>
            <h2 className="font-oswald text-2xl font-bold text-slate-900 mt-2 mb-5">
              {t.nextStepsTitle}
            </h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {t.steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 bg-white rounded-xl p-4 border border-blue-100"
                >
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{step.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Event day card ──────────────────────────────────────────── */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              {t.eventDay}
            </span>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" aria-hidden="true" />
                <span>{t.eventDate}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" aria-hidden="true" />
                <span>{t.eventVenue}</span>
              </li>
            </ul>
          </div>

          {/* ── Contact card ────────────────────────────────────────────── */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
            <p className="text-sm font-bold text-slate-800">{t.contactTitle}</p>
            <p className="text-sm text-slate-600 mt-2">
              {t.contactPrefix}{" "}
              <a
                href="mailto:hola@scsecuritysummit.com.mx"
                className="text-blue-600 hover:underline font-medium"
              >
                hola@scsecuritysummit.com.mx
              </a>{" "}
              {t.contactOr}{" "}
              <a href="tel:+19565158070" className="text-blue-600 hover:underline font-medium">
                +1 (956) 515-8070
              </a>
            </p>
          </div>

          {/* ── Action buttons ──────────────────────────────────────────── */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href={calendarUrl(folio, language)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.6)] hover:bg-blue-500 hover:shadow-[0_12px_28px_-8px_rgba(37,99,235,0.75)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span>{t.addToCalendar}</span>
            </a>
            <a
              href={whatsappUrl(folio, language)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-green-500 bg-green-50 px-5 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-green-700 hover:bg-green-100 transition-colors"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              <span>{t.shareWhatsApp}</span>
            </a>
            <Link
              href={language === "en" ? "/?lang=en" : "/"}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span>{t.backHome}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
