import type { Metadata } from "next";
import { SpeedInsights } from '@vercel/speed-insights/next';
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.scsecuritysummit.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default:
      "1er Summit de Seguridad en la Cadena de Suministros 2026 | Reynosa, México",
    template: "%s | SC Security Summit 2026",
  },
  description:
    "Evento especializado en CTPAT, OEA, compliance aduanero y seguridad logística. 24 y 25 de septiembre de 2026 — Centro de Convenciones Reynosa, Tamaulipas.",
  keywords: [
    "CTPAT",
    "OEA",
    "seguridad cadena de suministros",
    "maquiladora",
    "aduanas",
    "comercio exterior",
    "logística",
    "Reynosa",
    "Tamaulipas",
    "summit supply chain security",
  ],
  authors: [{ name: "Lanz Logistics" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: siteUrl,
    siteName: "SC Security Summit 2026",
    title:
      "1er Summit de Seguridad en la Cadena de Suministros 2026 | Reynosa",
    description:
      "Actualización normativa CTPAT/OEA, vinculación B2B y soluciones tecnológicas para la industria maquiladora del norte de México.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SC Security Summit 2026 — Reynosa, Tamaulipas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SC Security Summit 2026 — Reynosa",
    description:
      "Evento especializado en seguridad de la cadena de suministros. CTPAT, OEA, logística, aduanas. Sep 24-25, 2026.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <a href="#main-content" className="skip-nav">
          Saltar al contenido principal
        </a>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
