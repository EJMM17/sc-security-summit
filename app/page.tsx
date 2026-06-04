import type { Metadata } from "next";
import { headers } from "next/headers";
import ScrollProgress from "@/components/ScrollProgress";
import ScrollRevealObserver from "@/components/ScrollRevealObserver";
import { getRequestLanguage, resolveRequestLanguage } from "@/lib/language";
import { deserializeRegistroFlashState } from "@/lib/registro-form-state";
import { BASE_URL, CONTENT, PRECIOS } from "@/lib/content";
import Audience from "./(marketing)/_components/Audience";
import Faq from "./(marketing)/_components/Faq";
import FinalCTA from "./(marketing)/_components/FinalCTA";
import Footer from "./(marketing)/_components/Footer";
import Gallery from "./(marketing)/_components/Gallery";
import Header from "./(marketing)/_components/Header";
import Hero from "./(marketing)/_components/Hero";
import Location from "./(marketing)/_components/Location";
import NetworkingHub from "./(marketing)/_components/NetworkingHub";
import Pillars from "./(marketing)/_components/Pillars";
import Pricing from "./(marketing)/_components/Pricing";
import Registro from "./(marketing)/_components/Registro";
import Speakers from "./(marketing)/_components/Speakers";
import Sponsors from "./(marketing)/_components/Sponsors";
import Value from "./(marketing)/_components/Value";
import WhyAttend from "./(marketing)/_components/WhyAttend";

// ── Language-aware metadata ────────────────────────────────────────
const META = {
  es: {
    title: "1er Summit de Seguridad en la Cadena de Suministros 2026 | Reynosa",
    description:
      "24 de septiembre, Reynosa. Actualización normativa CTPAT/OEA, vinculación B2B y soluciones tecnológicas para la industria maquiladora del norte de México.",
    ogTitle: "1er Summit de Seguridad en la Cadena de Suministros 2026",
    ogDescription:
      "Actualización normativa, vinculación B2B y soluciones tecnológicas para la industria maquiladora. 24 Sept, Reynosa.",
    twitterDescription:
      "El encuentro de seguridad en cadena de suministros más relevante del norte de México.",
  },
  en: {
    title: "1st Supply Chain Security Summit 2026 | Reynosa, Mexico",
    description:
      "September 24, Reynosa. CTPAT/AEO regulatory updates, B2B networking, and technology solutions for northern Mexico's maquiladora industry.",
    ogTitle: "1st Supply Chain Security Summit 2026",
    ogDescription:
      "Regulatory updates, B2B networking, and technology solutions for the maquiladora industry. Sept 24, Reynosa.",
    twitterDescription:
      "The most relevant supply chain security event in northern Mexico.",
  },
} as const;

type SearchParams = Promise<{
  lang?: string;
  registro?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: SearchParams;
}): Promise<Metadata> {
  const params = searchParams ? await searchParams : undefined;
  const lang = resolveRequestLanguage(params?.lang);
  const m = META[lang];

  return {
    title: m.title,
    description: m.description,
    openGraph: {
      title: m.ogTitle,
      description: m.ogDescription,
      url: BASE_URL,
      siteName: "SC Security Summit 2026",
      locale: lang === "en" ? "en_US" : "es_MX",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: m.ogTitle,
      description: m.twitterDescription,
    },
  };
}

// ── JSON-LD @graph builder (language-aware) ────────────────────────
function buildStructuredData(lang: "es" | "en") {
  const content = CONTENT[lang];

  return {
    "@context": "https://schema.org",
    "@graph": [
      // ── BusinessEvent ──
      {
        "@type": "BusinessEvent",
        name:
          lang === "es"
            ? "1er Summit de Seguridad en la Cadena de Suministros 2026"
            : "1st Supply Chain Security Summit 2026",
        description:
          lang === "es"
            ? "Actualización normativa CTPAT/OEA, vinculación B2B y soluciones tecnológicas para la industria maquiladora del norte de México."
            : "CTPAT/AEO regulatory updates, B2B networking, and technology solutions for northern Mexico's maquiladora industry.",
        startDate: "2026-09-24",
        endDate: "2026-09-24",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        inLanguage: lang === "es" ? "es" : "en",
        location: {
          "@type": "Place",
          name: "Centro de Convenciones de Reynosa",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Libramiento Ote S/N, Azteca",
            addressLocality: "Reynosa",
            addressRegion: "Tamaulipas",
            postalCode: "88680",
            addressCountry: "MX",
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: 26.0806,
            longitude: -98.2883,
          },
        },
        organizer: {
          "@type": "Organization",
          name: "Lanz Logistics",
          url: "https://www.lanzlogistics.com",
        },
        performer: content.speakers.map((s) => ({
          "@type": "Person",
          name: s.name,
          jobTitle: s.role,
          image: `${BASE_URL}${s.image}`,
        })),
        offers: content.pricing.map((plan) => ({
          "@type": "Offer",
          name: plan.label,
          price: String(PRECIOS[plan.id as keyof typeof PRECIOS]),
          priceCurrency: "MXN",
          url: `${BASE_URL}/#registro`,
          availability: "https://schema.org/InStock",
          validFrom: "2026-04-01",
          validThrough: "2026-09-24",
        })),
      },

      // ── FAQPage ──
      {
        "@type": "FAQPage",
        mainEntity: content.faq.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: {
            "@type": "Answer",
            text: answer,
          },
        })),
      },

      // ── Organization ──
      {
        "@type": "Organization",
        name: "Lanz Logistics",
        url: "https://www.lanzlogistics.com",
        contactPoint: {
          "@type": "ContactPoint",
          email: "hola@scsecuritysummit.com",
          telephone: "+52-899-112-8755",
          contactType: "customer service",
          availableLanguage: ["Spanish", "English"],
        },
      },

      // ── WebSite ──
      {
        "@type": "WebSite",
        name: "SC Security Summit 2026",
        url: BASE_URL,
        inLanguage: ["es", "en"],
      },
    ],
  };
}

// ── Page Component ─────────────────────────────────────────────────
export default async function Home({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = searchParams ? await searchParams : undefined;
  const language = await getRequestLanguage(params?.lang ?? null);
  const registroState = deserializeRegistroFlashState(params?.registro);

  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? "";
  const structuredData = buildStructuredData(language);

  return (
    <>
      <ScrollProgress />
      <ScrollRevealObserver />
      <Header language={language} />
      <div className="pt-[62px] sm:pt-[68px]">
        <Hero language={language} />
        <WhyAttend language={language} />
        <Pillars language={language} />
        <NetworkingHub language={language} />
        <Speakers language={language} />
        <Gallery language={language} />
        <Value language={language} />
        <Audience language={language} />
        <Pricing language={language} />
        <Sponsors language={language} />
        <FinalCTA language={language} />
        <Registro language={language} state={registroState} />
        <Location language={language} />
        <Faq language={language} />
        <Footer language={language} />
      </div>

      {/* ── Consolidated Structured Data (JSON-LD @graph) ── */}
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
}
