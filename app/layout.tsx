import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import WhatsAppButton from "@/components/WhatsAppButton";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });

export const metadata: Metadata = {
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
  authors: [
    { name: "Lanz Logistics" },
    { name: "Thynk Unlimited" },
  ],
  openGraph: {
    title: "1er Summit de Seguridad en la Cadena de Suministros 2026",
    description:
      "Actualización normativa, vinculación B2B y soluciones tecnológicas para la industria maquiladora. 24-25 Sept, Reynosa.",
    url: "https://www.scsecuritysummit.com",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`${inter.variable} ${oswald.variable} font-sans bg-white text-[#0F172A] antialiased`}
      >
        {children}
        <WhatsAppButton />
        <Toaster theme="light" position="bottom-right" richColors />

        {/* ── Structured Data (JSON-LD) ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BusinessEvent",
              name: "1er Summit de Seguridad en la Cadena de Suministros 2026",
              description:
                "Actualización normativa CTPAT/OEA, vinculación B2B y soluciones tecnológicas para la industria maquiladora del norte de México.",
              startDate: "2026-09-24",
              endDate: "2026-09-25",
              eventAttendanceMode:
                "https://schema.org/OfflineEventAttendanceMode",
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
                },
                {
                  "@type": "Offer",
                  name: "Acceso General",
                  price: "5800",
                  priceCurrency: "MXN",
                },
                {
                  "@type": "Offer",
                  name: "Acceso VIP",
                  price: "7200",
                  priceCurrency: "MXN",
                },
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}
