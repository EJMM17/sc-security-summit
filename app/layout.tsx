import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import WhatsAppButton from "@/components/WhatsAppButton";
import PointerSpotlight from "@/components/PointerSpotlight";
import { BASE_URL } from "@/lib/content";
import { getRequestLanguage } from "@/lib/language";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import CookieConsent from "@/components/CookieConsent";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import Analytics from "@/components/Analytics";
import MarketingConsentGate from "@/components/MarketingConsentGate";
import MetaPixel from "@/components/MetaPixel";
import LinkedInInsight from "@/components/LinkedInInsight";
import AttributionCapture from "@/components/AttributionCapture";
import InteractionTracker from "@/components/InteractionTracker";
import ConsentMode from "@/components/ConsentMode";
import {
  isVercelProductionDeployment,
  isVisualOnlyVercelDeployment,
} from "@/lib/deployment-environment";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
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
  // Canonical/hreflang live on each page (app/page.tsx renders the homepage
  // set manually — Next's metadata resolver strips search params from
  // root-path alternates). Declaring them here would leak the homepage
  // canonical onto every page without its own alternates.
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
  // The internal operations panel renders operator-facing data. It never mounts
  // marketing chrome, analytics, pixels or attribution capture.
  const isAdminRoute = (headersList.get("x-pathname") ?? "").startsWith("/admin");
  const marketingDataEnabled = !isVisualOnlyVercelDeployment() && !isAdminRoute;
  const productionTelemetryEnabled =
    isVercelProductionDeployment() && !isAdminRoute;

  if (isAdminRoute) {
    return (
      <html lang="es" className="scroll-smooth">
        <body
          className={`${inter.variable} font-sans bg-slate-100 text-[#0F172A] antialiased`}
        >
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang={language} className="scroll-smooth">
      <body
        className={`${inter.variable} ${oswald.variable} font-sans bg-white text-[#0F172A] antialiased`}
      >
        {/* Consent Mode v2 defaults — must run before GTM / GA / pixels */}
        <ConsentMode nonce={nonce} />
        {/* Keep the undecided privacy choice ahead of streamed page content so
            it is available and paintable without waiting for the landing page. */}
        <CookieConsent
          language={language}
          marketingEnabled={marketingDataEnabled}
        />
        {children}
        {/* Pointer-tracked card edges. Renders nothing; stays inert on touch
            devices and under prefers-reduced-motion. */}
        <PointerSpotlight />
        <WhatsAppButton />
        <ServiceWorkerRegister />
        <Toaster theme="light" position="bottom-right" richColors />
        {/* Analytics, pixels and interaction tracking use basic consent mode. */}
        <MarketingConsentGate>
          {productionTelemetryEnabled && <SpeedInsights />}
          {productionTelemetryEnabled && <VercelAnalytics />}
          <Analytics nonce={nonce} />
          <MetaPixel nonce={nonce} />
          <LinkedInInsight nonce={nonce} />
          {marketingDataEnabled && <InteractionTracker />}
        </MarketingConsentGate>
        {/* Attribution is mounted only in Production and stays empty until explicit consent. */}
        {marketingDataEnabled && <AttributionCapture />}
        {/* JSON-LD structured data is rendered in page.tsx for language-aware schemas */}
      </body>
    </html>
  );
}
