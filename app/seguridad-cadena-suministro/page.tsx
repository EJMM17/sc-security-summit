import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import PageShell from "@/components/PageShell";
import { getRequestLanguage, resolveRequestLanguage } from "@/lib/language";
import { BASE_URL } from "@/lib/content";

const PATH = "/seguridad-cadena-suministro";

const COPY = {
  es: {
    title: "Seguridad en la Cadena de Suministro | SC Security Summit 2026",
    description:
      "Guía de seguridad en la cadena de suministro: riesgos, trazabilidad, monitoreo y cumplimiento para la industria del norte de México. Conferencias el 24 de septiembre en Reynosa.",
    eyebrow: "CADENA DE SUMINISTRO",
    h1: "Seguridad en la cadena de suministro: blinda tu operación",
    lead: "Robos en tránsito, contaminación de carga, fraudes documentales y ciberataques: la cadena de suministro enfrenta riesgos que impactan directamente tu rentabilidad. La seguridad dejó de ser un costo para convertirse en ventaja competitiva.",
    sections: [
      {
        h: "Los riesgos más comunes",
        p: "Desvío y robo de mercancía en ruta, manipulación de unidades, suplantación de transportistas y vulnerabilidades en los sistemas de información. Cada eslabón sin control es una puerta abierta.",
      },
      {
        h: "Trazabilidad y monitoreo en tiempo real",
        p: "La telemetría GPS, los sellos electrónicos y el monitoreo inteligente permiten anticipar incidentes antes de que escalen. La visibilidad de extremo a extremo es la base de una cadena resiliente.",
      },
      {
        h: "Cumplimiento como diferenciador",
        p: "Certificaciones como CTPAT y OEA, junto con políticas internas robustas, abren mercados, reducen inspecciones y generan confianza con clientes binacionales.",
      },
    ],
    bulletsTitle: "Lo que aprenderás en el Summit",
    bullets: [
      "Gestión de riesgos a lo largo de la cadena",
      "Tecnologías de trazabilidad y videovigilancia",
      "Ciberseguridad para operaciones logísticas",
      "Vinculación B2B con proveedores especializados",
    ],
    ctaTitle: "Fortalece tu cadena de suministro",
    ctaText:
      "Únete al 1er Summit de Seguridad en la Cadena de Suministros. 24 de septiembre, 2026 · Reynosa.",
    cta: "Registrarme ahora",
  },
  en: {
    title: "Supply Chain Security | SC Security Summit 2026",
    description:
      "Supply chain security guide: risks, traceability, monitoring and compliance for northern Mexico's industry. Conferences on September 24 in Reynosa.",
    eyebrow: "SUPPLY CHAIN",
    h1: "Supply chain security: protect your operation",
    lead: "In-transit theft, cargo contamination, document fraud and cyberattacks: the supply chain faces risks that hit your profitability directly. Security is no longer a cost — it's a competitive advantage.",
    sections: [
      {
        h: "The most common risks",
        p: "Diversion and theft of goods en route, unit tampering, carrier impersonation and information-system vulnerabilities. Every uncontrolled link is an open door.",
      },
      {
        h: "Traceability and real-time monitoring",
        p: "GPS telemetry, electronic seals and intelligent monitoring let you anticipate incidents before they escalate. End-to-end visibility is the foundation of a resilient chain.",
      },
      {
        h: "Compliance as a differentiator",
        p: "Certifications like CTPAT and AEO, together with strong internal policies, open markets, reduce inspections and build trust with binational customers.",
      },
    ],
    bulletsTitle: "What you'll learn at the Summit",
    bullets: [
      "Risk management across the chain",
      "Traceability and video-surveillance technologies",
      "Cybersecurity for logistics operations",
      "B2B networking with specialized providers",
    ],
    ctaTitle: "Strengthen your supply chain",
    ctaText:
      "Join the 1st Supply Chain Security Summit. September 24, 2026 · Reynosa.",
    cta: "Register now",
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
      type: "article",
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

export default async function SeguridadCadenaPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = searchParams ? await searchParams : undefined;
  const language = await getRequestLanguage(params?.lang ?? null);
  const c = COPY[language];
  const registroHref = language === "en" ? "/?lang=en#registro" : "/#registro";

  return (
    <PageShell language={language}>
      <article className="px-4 sm:px-6 pt-16 pb-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <span className="section-label">{c.eyebrow}</span>
          <h1 className="section-title mt-3">{c.h1}</h1>
          <p className="text-slate-500 mt-4 text-lg leading-relaxed">{c.lead}</p>

          <div className="mt-10 space-y-8">
            {c.sections.map((s) => (
              <section key={s.h}>
                <h2 className="font-oswald text-2xl font-bold text-slate-900">{s.h}</h2>
                <p className="text-slate-600 mt-2 leading-relaxed">{s.p}</p>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-2xl bg-slate-50 border border-slate-200 p-6">
            <h2 className="font-oswald text-xl font-bold text-slate-900 mb-4">
              {c.bulletsTitle}
            </h2>
            <ul className="space-y-2.5">
              {c.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" aria-hidden="true" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </article>

      <section className="px-4 sm:px-6 py-16 bg-blue-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-oswald text-2xl sm:text-3xl font-bold text-slate-900">
            {c.ctaTitle}
          </h2>
          <p className="text-slate-600 mt-3">{c.ctaText}</p>
          <div className="mt-6">
            <a href={registroHref} className="btn-primary px-8 py-4 text-base">
              {c.cta} <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
