import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import PageShell from "@/components/PageShell";
import { getRequestLanguage, resolveRequestLanguage } from "@/lib/language";
import { BASE_URL } from "@/lib/content";

const PATH = "/ctpat-oea";

const COPY = {
  es: {
    title: "CTPAT y OEA: certificación y cumplimiento | SC Security Summit 2026",
    description:
      "Actualización normativa CTPAT y OEA para la industria maquiladora del norte de México. Aprende validaciones, requisitos y mejores prácticas en el SC Security Summit 2026.",
    eyebrow: "CTPAT · OEA",
    h1: "CTPAT y OEA: qué necesita saber tu cadena de suministro",
    lead: "CTPAT (Customs-Trade Partnership Against Terrorism) y OEA (Operador Económico Autorizado) son los programas que definen el comercio seguro entre México y Estados Unidos. Mantener tu certificación al día protege tus tiempos de cruce y tu competitividad.",
    sections: [
      {
        h: "¿Qué es CTPAT?",
        p: "CTPAT es el programa voluntario de la Aduana estadounidense (CBP) que reconoce a empresas con controles de seguridad robustos en su cadena de suministro. Participar reduce inspecciones, agiliza cruces y fortalece la confianza comercial.",
      },
      {
        h: "¿Qué es OEA?",
        p: "OEA es la figura equivalente en México, administrada por el SAT. Certifica que importadores, exportadores y operadores cumplen estándares de seguridad y cumplimiento aduanero, con beneficios en facilitación y reconocimiento mutuo.",
      },
      {
        h: "Por qué importa la actualización constante",
        p: "Los criterios mínimos de seguridad evolucionan: ciberseguridad, control de acceso, trazabilidad y gestión de socios comerciales. Una validación fallida puede suspender beneficios y frenar tu operación.",
      },
    ],
    bulletsTitle: "En el Summit cubrimos",
    bullets: [
      "Criterios mínimos de seguridad actualizados",
      "Preparación para validaciones y revalidaciones",
      "Gestión de riesgos con socios comerciales",
      "Ciberseguridad aplicada a la cadena de suministro",
    ],
    ctaTitle: "Actualízate con los especialistas",
    ctaText:
      "Reserva tu lugar en el 1er Summit de Seguridad en la Cadena de Suministros. 24 de septiembre, 2026 · Reynosa.",
    cta: "Registrarme ahora",
  },
  en: {
    title: "CTPAT & AEO: certification and compliance | SC Security Summit 2026",
    description:
      "CTPAT and AEO regulatory updates for northern Mexico's maquiladora industry. Learn validations, requirements and best practices at the SC Security Summit 2026.",
    eyebrow: "CTPAT · AEO",
    h1: "CTPAT & AEO: what your supply chain needs to know",
    lead: "CTPAT (Customs-Trade Partnership Against Terrorism) and AEO (Authorized Economic Operator) define secure trade between Mexico and the United States. Keeping your certification current protects your crossing times and competitiveness.",
    sections: [
      {
        h: "What is CTPAT?",
        p: "CTPAT is the voluntary U.S. Customs (CBP) program that recognizes companies with strong supply chain security controls. Participating reduces inspections, speeds up crossings and strengthens commercial trust.",
      },
      {
        h: "What is AEO?",
        p: "AEO is the equivalent figure in Mexico, administered by the SAT. It certifies that importers, exporters and operators meet security and customs-compliance standards, with facilitation benefits and mutual recognition.",
      },
      {
        h: "Why continuous updates matter",
        p: "Minimum security criteria evolve: cybersecurity, access control, traceability and business-partner management. A failed validation can suspend benefits and stall your operation.",
      },
    ],
    bulletsTitle: "At the Summit we cover",
    bullets: [
      "Updated minimum security criteria",
      "Preparing for validations and revalidations",
      "Risk management with business partners",
      "Cybersecurity applied to the supply chain",
    ],
    ctaTitle: "Get up to date with the specialists",
    ctaText:
      "Reserve your spot at the 1st Supply Chain Security Summit. September 24, 2026 · Reynosa.",
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
      images: [{ url: "/images/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: c.title,
      description: c.description,
      images: ["/images/og-image.png"],
    },
  };
}

export default async function CtpatOeaPage({
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
