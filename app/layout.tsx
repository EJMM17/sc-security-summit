import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter, Oswald } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "sonner";
import WhatsAppButton from "@/components/WhatsAppButton";
import { BASE_URL } from "@/lib/content";
import { getRequestLanguage } from "@/lib/language";
import { SpeedInsights } from "@vercel/speed-insights/next";
import AmbientCanvasLazy from "@/components/AmbientCanvasLazy";
import CookieConsent from "@/components/CookieConsent";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import Analytics from "@/components/Analytics";
import MetaPixel from "@/components/MetaPixel";
import LinkedInInsight from "@/components/LinkedInInsight";
import LeadCapture from "@/components/LeadCapture";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const enableSpeedInsights = process.env.VERCEL === "1";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.scsecuritysummit.com"),
  title: {
    default: "SC Security Summit 2026 | Reynosa",
    template: "%s | SC Security Summit 2026",
  },
  description:
    "24 de septiembre, Reynosa. Actualización normativa CTPAT/OEA, vinculación B2B y soluciones tecnológicas para la industria maquiladora del norte de México.",
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
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      "es-MX": `${BASE_URL}/?lang=es`,
      "en-US": `${BASE_URL}/?lang=en`,
      "x-default": BASE_URL,
    },
  },
  other: {
    "geo.region": "MX-TAM",
    "geo.placename": "Reynosa",
    "geo.position": "26.0806;-98.2883",
    ICBM: "26.0806, -98.2883",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "icon", url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" }],
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
  const language = await getRequestLanguage();

  return (
    <html lang={language} className="scroll-smooth">
      <body
        className={`${inter.variable} ${oswald.variable} font-sans bg-white text-[#0F172A] antialiased`}
      >
        <AmbientCanvasLazy />
        {children}
        <WhatsAppButton />
        <LeadCapture language={language} />
        <CookieConsent language={language} />
        <ServiceWorkerRegister />
        <Toaster theme="light" position="bottom-right" richColors />
        {enableSpeedInsights && <SpeedInsights />}
        {/* ── Analytics & Marketing ── */}
        <Analytics nonce={nonce} />
        <MetaPixel nonce={nonce} />
        <LinkedInInsight nonce={nonce} />
        {/* Turnstile loaded here so the browser has it ready before the form hydrates */}
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="lazyOnload"
        />
        {/* JSON-LD structured data is rendered in page.tsx for language-aware schemas */}
      </body>
    </html>
  );
}
