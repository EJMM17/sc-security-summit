import type { Metadata } from "next";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import PageShell from "@/components/PageShell";
import { getRequestLanguage, resolveRequestLanguage } from "@/lib/language";
import { BASE_URL } from "@/lib/content";

const PATH = "/evento-logistica-reynosa";

const COPY = {
  es: {
    title: "Evento de Logística y Seguridad en Reynosa 2026 | SC Security Summit",
    description:
      "El evento de logística, comercio exterior y seguridad en la cadena de suministro más relevante de Reynosa, Tamaulipas. 24 de septiembre de 2026, Centro de Convenciones.",
    eyebrow: "REYNOSA 2026",
    h1: "El evento de logística y seguridad de Reynosa",
    lead: "Reynosa es uno de los corredores industriales y de comercio exterior más activos de la frontera norte. El 1er Summit de Seguridad en la Cadena de Suministros reúne aquí a la industria maquiladora, transportistas, agencias aduanales y proveedores de soluciones.",
    sections: [
      {
        h: "Por qué Reynosa",
        p: "Su ubicación estratégica frente a McAllen, Texas, la convierte en un punto neurálgico para el cruce de mercancías entre México y Estados Unidos. Aquí, la seguridad y la eficiencia logística son críticas para la competitividad regional.",
      },
      {
        h: "Para quién es el evento",
        p: "Directores de operaciones, gerentes de logística, especialistas en comercio exterior, responsables de compliance y seguridad patrimonial, y proveedores de tecnología y servicios para la cadena de suministro.",
      },
      {
        h: "Qué encontrarás",
        p: "Conferencias especializadas, paneles con expertos, workshops y un Business Hub B2B diseñado para generar alianzas comerciales reales el día del evento.",
      },
    ],
    detailsTitle: "Detalles del evento",
    date: "24 de septiembre, 2026 · 8:00 AM — 7:00 PM",
    venue: "Centro de Convenciones de Reynosa · Tamaulipas, México",
    ctaTitle: "Asegura tu lugar en Reynosa",
    ctaText: "Cupo limitado. Regístrate hoy y forma parte de la primera edición.",
    cta: "Registrarme ahora",
  },
  en: {
    title: "Logistics & Security Event in Reynosa 2026 | SC Security Summit",
    description:
      "The most relevant logistics, foreign trade and supply chain security event in Reynosa, Tamaulipas. September 24, 2026, Convention Center.",
    eyebrow: "REYNOSA 2026",
    h1: "Reynosa's logistics and security event",
    lead: "Reynosa is one of the most active industrial and foreign-trade corridors on the northern border. The 1st Supply Chain Security Summit gathers the maquiladora industry, carriers, customs brokers and solution providers here.",
    sections: [
      {
        h: "Why Reynosa",
        p: "Its strategic location across from McAllen, Texas, makes it a critical hub for the movement of goods between Mexico and the United States. Here, security and logistics efficiency are essential to regional competitiveness.",
      },
      {
        h: "Who the event is for",
        p: "Operations directors, logistics managers, foreign-trade specialists, compliance and asset-security leaders, and technology and service providers for the supply chain.",
      },
      {
        h: "What you'll find",
        p: "Specialized conferences, expert panels, workshops and a B2B Business Hub designed to create real commercial alliances on event day.",
      },
    ],
    detailsTitle: "Event details",
    date: "September 24, 2026 · 8:00 AM — 7:00 PM",
    venue: "Reynosa Convention Center · Tamaulipas, Mexico",
    ctaTitle: "Secure your spot in Reynosa",
    ctaText: "Limited seats. Register today and be part of the first edition.",
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

export default async function EventoLogisticaReynosaPage({
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
              {c.detailsTitle}
            </h2>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" aria-hidden="true" />
                <span>{c.date}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" aria-hidden="true" />
                <span>{c.venue}</span>
              </li>
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
