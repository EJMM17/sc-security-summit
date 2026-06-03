import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import PageShell from "@/components/PageShell";
import { getRequestLanguage, resolveRequestLanguage } from "@/lib/language";
import { BASE_URL, CONTENT } from "@/lib/content";

const PATH = "/media-kit";

const COPY = {
  es: {
    title: "Media Kit y Paquetes de Patrocinio | SC Security Summit 2026",
    description:
      "Descarga el media kit del SC Security Summit 2026: audiencia, alcance y paquetes de patrocinio Platino, Oro, Plata y Proveedor de Soluciones de Seguridad.",
    eyebrow: "MEDIA KIT",
    h1: "Paquetes de patrocinio y media kit",
    lead: "Todo lo que tu equipo de marketing necesita para evaluar el evento: perfil de audiencia, alcance estimado y beneficios por nivel. Solicita el documento completo en PDF.",
    request: "Solicitar media kit completo",
    audienceTitle: "Audiencia esperada",
    audience: [
      "300+ profesionales de la cadena de suministro",
      "Directores y gerentes de operaciones, logística y compliance",
      "Industria maquiladora, transporte, aduanas y comercio exterior",
      "Frontera norte: Reynosa, Tamaulipas y región binacional",
    ],
    tiersTitle: "Niveles de patrocinio",
    standLabel: "Stand",
    slotsLabel: "cupos",
    benefitsMore: (n: number) => `+${n} beneficios adicionales`,
  },
  en: {
    title: "Media Kit & Sponsorship Packages | SC Security Summit 2026",
    description:
      "Download the SC Security Summit 2026 media kit: audience, reach and Platinum, Gold, Silver and Security Solutions Provider sponsorship packages.",
    eyebrow: "MEDIA KIT",
    h1: "Sponsorship packages & media kit",
    lead: "Everything your marketing team needs to evaluate the event: audience profile, estimated reach and benefits per tier. Request the full PDF document.",
    request: "Request the full media kit",
    audienceTitle: "Expected audience",
    audience: [
      "300+ supply chain professionals",
      "Operations, logistics and compliance directors and managers",
      "Maquiladora industry, transport, customs and foreign trade",
      "Northern border: Reynosa, Tamaulipas and binational region",
    ],
    tiersTitle: "Sponsorship tiers",
    standLabel: "Booth",
    slotsLabel: "slots",
    benefitsMore: (n: number) => `+${n} additional benefits`,
  },
} as const;

type SearchParams = Promise<{ lang?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: SearchParams;
}): Promise<Metadata> {
  const params = searchParams ? await searchParams : undefined;
  const lang = resolveRequestLanguage(params?.lang);
  const c = COPY[lang];
  return {
    title: c.title,
    description: c.description,
    alternates: {
      canonical: `${BASE_URL}${PATH}`,
      languages: {
        "es-MX": `${BASE_URL}${PATH}?lang=es`,
        "en-US": `${BASE_URL}${PATH}?lang=en`,
        "x-default": `${BASE_URL}${PATH}`,
      },
    },
    openGraph: {
      title: c.title,
      description: c.description,
      url: `${BASE_URL}${PATH}`,
      siteName: "SC Security Summit 2026",
      locale: lang === "en" ? "en_US" : "es_MX",
      type: "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, type: "image/png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: c.title,
      description: c.description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function MediaKitPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = searchParams ? await searchParams : undefined;
  const language = await getRequestLanguage(params?.lang ?? null);
  const c = COPY[language];
  const { sponsors, sponsorTierMeta } = CONTENT[language];

  const requestMailto =
    "mailto:hola@scsecuritysummit.com?subject=" +
    encodeURIComponent("Solicitud de media kit – SC Security Summit 2026");

  return (
    <PageShell language={language}>
      <section className="px-4 sm:px-6 pt-16 pb-10 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <span className="section-label justify-center">{c.eyebrow}</span>
          <h1 className="section-title mt-3">{c.h1}</h1>
          <p className="text-slate-500 max-w-2xl mx-auto mt-4">{c.lead}</p>
          <div className="mt-8">
            <a href={requestMailto} className="btn-primary px-7 py-3.5 text-sm">
              {c.request} <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-12 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-oswald text-2xl font-bold text-slate-900 mb-5">
            {c.audienceTitle}
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {c.audience.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 rounded-xl bg-white border border-slate-200 p-4 text-sm text-slate-600"
              >
                <Check className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-14 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-oswald text-2xl font-bold text-slate-900 mb-6">
            {c.tiersTitle}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sponsors.map((sponsor, index) => {
              const meta = sponsorTierMeta[index];
              const preview = sponsor.benefits.slice(0, 3);
              const remaining = sponsor.benefits.length - preview.length;
              return (
                <div
                  key={sponsor.tier}
                  className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col"
                >
                  <div className={`h-1.5 -mx-5 -mt-5 mb-4 rounded-t-2xl ${meta.stripe}`} aria-hidden="true" />
                  <h3 className="font-oswald text-lg font-bold text-slate-900 leading-tight">
                    {sponsor.tier}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {c.standLabel}: {meta.stand} · {meta.slotsTotal} {c.slotsLabel}
                  </p>
                  <ul className="mt-4 space-y-2 flex-1">
                    {preview.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-[13px] text-slate-600 leading-snug">
                        <Check className="w-3.5 h-3.5 mt-0.5 text-blue-600 flex-shrink-0" aria-hidden="true" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  {remaining > 0 && (
                    <p className="mt-3 text-xs font-semibold text-blue-600">
                      {c.benefitsMore(remaining)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <a href={requestMailto} className="btn-primary px-7 py-3.5 text-sm">
              {c.request} <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
