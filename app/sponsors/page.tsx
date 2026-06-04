import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import PageShell from "@/components/PageShell";
import Sponsors from "@/app/(marketing)/_components/Sponsors";
import { getRequestLanguage, resolveRequestLanguage } from "@/lib/language";
import { BASE_URL } from "@/lib/content";

const PATH = "/sponsors";

const COPY = {
  es: {
    title: "Patrocinios | SC Security Summit 2026 Reynosa",
    description:
      "Posiciona tu marca ante más de 300 profesionales de la cadena de suministro, comercio exterior y logística en el norte de México. Patrocinio exclusivo.",
    eyebrow: "PATROCINADORES",
    h1: "Conecta tu marca con la cadena de suministro del norte de México",
    lead: "El 1er Summit de Seguridad en la Cadena de Suministros reúne a tomadores de decisión de la industria maquiladora, transporte, aduanas y compliance. Patrocinar es la vía más directa para generar negocio cualificado.",
    ctaPrimary: "Solicitar media kit",
    ctaSecondary: "Hablar con un asesor",
    closingTitle: "¿Listo para ser parte?",
    closingText:
      "Cuéntanos tus objetivos comerciales y te mostramos cómo el patrocinio puede impulsar tu marca.",
  },
  en: {
    title: "Sponsorships | SC Security Summit 2026 Reynosa",
    description:
      "Put your brand in front of 300+ supply chain, foreign trade and logistics professionals in northern Mexico. Exclusive sponsorship opportunity.",
    eyebrow: "SPONSORS",
    h1: "Connect your brand with northern Mexico's supply chain",
    lead: "The 1st Supply Chain Security Summit gathers decision makers from the maquiladora industry, transport, customs and compliance. Sponsoring is the most direct path to qualified business.",
    ctaPrimary: "Request media kit",
    ctaSecondary: "Talk to an advisor",
    closingTitle: "Ready to take part?",
    closingText:
      "Tell us your commercial goals and we'll show you how sponsorship can boost your brand.",
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

const MEDIA_KIT_HREF = (lang: "es" | "en") =>
  lang === "en" ? "/media-kit?lang=en" : "/media-kit";

const SPONSOR_MAILTO =
  "mailto:hola@scsecuritysummit.com?subject=" +
  encodeURIComponent("Patrocinio – SC Security Summit 2026");

export default async function SponsorsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = searchParams ? await searchParams : undefined;
  const language = await getRequestLanguage(params?.lang ?? null);
  const c = COPY[language];

  return (
    <PageShell language={language}>
      <section className="px-4 sm:px-6 pt-16 pb-10 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <span className="section-label justify-center">{c.eyebrow}</span>
          <h1 className="section-title mt-3">{c.h1}</h1>
          <p className="text-slate-500 max-w-2xl mx-auto mt-4">{c.lead}</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href={MEDIA_KIT_HREF(language)} className="btn-primary px-7 py-3.5 text-sm">
              {c.ctaPrimary} <ArrowRight className="w-4 h-4" />
            </a>
            <a href={SPONSOR_MAILTO} className="btn-outline px-7 py-3.5 text-sm">
              {c.ctaSecondary}
            </a>
          </div>
        </div>
      </section>

      {/* Full tier breakdown — reuses the approved marketing component */}
      <Sponsors language={language} />

      <section className="px-4 sm:px-6 py-16 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-oswald text-2xl sm:text-3xl font-bold text-slate-900">
            {c.closingTitle}
          </h2>
          <p className="text-slate-500 mt-3">{c.closingText}</p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href={MEDIA_KIT_HREF(language)} className="btn-primary px-7 py-3.5 text-sm">
              {c.ctaPrimary} <ArrowRight className="w-4 h-4" />
            </a>
            <a href={SPONSOR_MAILTO} className="btn-outline px-7 py-3.5 text-sm">
              {c.ctaSecondary}
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
