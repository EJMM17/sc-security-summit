import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter, Oswald } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "sonner";
import WhatsAppButton from "@/components/WhatsAppButton";
import { SPEAKERS, FAQ_SCHEMA_ITEMS, BASE_URL } from "@/lib/site-content";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.scsecuritysummit.com"),
  title: "1er Summit de Seguridad en la Cadena de Suministros 2026 | Reynosa",
  description:
    "24 y 25 de septiembre, Reynosa. Actualización normativa CTPAT/OEA, vinculación B2B y soluciones tecnológicas para la industria maquiladora del norte de México.",
  keywords: [
    "summit seguridad",
    "cadena de suministros",
    "CTPAT",
    "OEA",
    "Reynosa",
    "logística",
    "B2B",
    "maquiladora",
    "trade compliance",
    "seguridad logística",
  ],
  authors: [{ name: "Lanz Logistics" }, { name: "Thynk Unlimited" }],
  openGraph: {
    title: "1er Summit de Seguridad en la Cadena de Suministros 2026",
    description:
      "Actualización normativa, vinculación B2B y soluciones tecnológicas para la industria maquiladora. 24-25 Sept, Reynosa.",
    url: BASE_URL,
    siteName: "SC Security Summit 2026",
    locale: "es_MX",
    type: "website",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "SC Security Summit 2026 - Reynosa, Tamaulipas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SC Security Summit 2026 | Reynosa",
    description:
      "El encuentro de seguridad en cadena de suministros más relevante del norte de México.",
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      "es-MX": BASE_URL,
      "en-US": BASE_URL,
      "x-default": BASE_URL,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0F172A",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? "";

  const businessEventSchema = {
    "@context": "https://schema.org",
    "@type": "BusinessEvent",
    name: "1er Summit de Seguridad en la Cadena de Suministros 2026",
    description:
      "Actualización normativa CTPAT/OEA, vinculación B2B y soluciones tecnológicas para la industria maquiladora del norte de México.",
    startDate: "2026-09-24",
    endDate: "2026-09-25",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: "Centro de Convenciones de Reynosa",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Blvd. Morelos 190, Col. Longoria",
        addressLocality: "Reynosa",
        addressRegion: "Tamaulipas",
        postalCode: "88630",
        addressCountry: "MX",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "Lanz Logistics",
      url: "https://www.lanzlogistics.com",
    },
    offers: [
      {
        "@type": "Offer",
        name: "Acceso Estudiante",
        price: "1200",
        priceCurrency: "MXN",
        url: `${BASE_URL}/#registro`,
        availability: "https://schema.org/InStock",
        validFrom: "2026-04-01",
        validThrough: "2026-09-23",
      },
      {
        "@type": "Offer",
        name: "Acceso General",
        price: "5800",
        priceCurrency: "MXN",
        url: `${BASE_URL}/#registro`,
        availability: "https://schema.org/InStock",
        validFrom: "2026-04-01",
        validThrough: "2026-09-23",
      },
      {
        "@type": "Offer",
        name: "Acceso VIP",
        price: "7200",
        priceCurrency: "MXN",
        url: `${BASE_URL}/#registro`,
        availability: "https://schema.org/InStock",
        validFrom: "2026-04-01",
        validThrough: "2026-09-23",
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_SCHEMA_ITEMS.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };

  const speakersSchema = SPEAKERS.map((s) => ({
    "@context": "https://schema.org",
    "@type": "Person",
    name: s.name,
    jobTitle: s.role,
    worksFor: {
      "@type": "Organization",
      name: s.org,
    },
    description: s.topic,
    image: `${BASE_URL}${s.image}`,
  }));

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Lanz Logistics",
    url: "https://www.lanzlogistics.com",
    contactPoint: {
      "@type": "ContactPoint",
      email: "Contacto@LanzLogistics.com",
      telephone: "+1-956-515-8070",
      contactType: "customer service",
      availableLanguage: ["Spanish", "English"],
    },
    organizes: {
      "@type": "BusinessEvent",
      name: "1er Summit de Seguridad en la Cadena de Suministros 2026",
      url: BASE_URL,
    },
  };

  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`${inter.variable} ${oswald.variable} font-sans bg-white text-[#0F172A] antialiased`}
      >
        {children}
        <WhatsAppButton />
        <Toaster theme="light" position="bottom-right" richColors />
        {/* Turnstile loaded here so the browser has it ready before the form hydrates */}
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="lazyOnload"
        />

        {/* ── Structured Data (JSON-LD) ── */}
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessEventSchema) }}
        />
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(speakersSchema) }}
        />
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </body>
    </html>
  );
}
