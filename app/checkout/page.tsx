import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import TicketCheckoutForm from "@/components/TicketCheckoutForm";
import { BASE_URL, CONTENT } from "@/lib/content";
import { isVisualOnlyVercelDeployment } from "@/lib/deployment-environment";
import { getRequestLanguage, resolveRequestLanguage } from "@/lib/language";
import { isTicketTierId } from "@/lib/payments/catalog";

const PATH = "/checkout";

const SEO = {
  es: {
    title: "Comprar acceso | SC Security Summit 2026 Reynosa",
    description:
      "Compra tu acceso al 1er Summit de Seguridad en la Cadena de Suministros. Pago seguro con MercadoPago, IVA desglosado y CFDI a solicitud.",
  },
  en: {
    title: "Buy your pass | SC Security Summit 2026 Reynosa",
    description:
      "Buy your pass to the 1st Supply Chain Security Summit. Secure MercadoPago payment, itemized VAT and CFDI on request.",
  },
} as const;

type SearchParams = Promise<{ lang?: string; tier?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: SearchParams;
}): Promise<Metadata> {
  const params = searchParams ? await searchParams : undefined;
  const language = resolveRequestLanguage(params?.lang);
  const seo = SEO[language];

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: `${BASE_URL}${PATH}`,
      languages: {
        "es-MX": `${BASE_URL}${PATH}?lang=es`,
        "en-US": `${BASE_URL}${PATH}?lang=en`,
        "x-default": `${BASE_URL}${PATH}`,
      },
    },
    // A transactional page has nothing to offer a crawler and must never be
    // indexed with a half-filled form in the snippet.
    robots: { index: false, follow: true },
  };
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = searchParams ? await searchParams : undefined;
  const language = await getRequestLanguage(params?.lang ?? null);
  const copy = CONTENT[language].checkout;
  const previewDisabled = isVisualOnlyVercelDeployment();

  return (
    <PageShell language={language}>
      <section className="checkout-page">
        <div className="checkout-page-inner">
          <div className="checkout-page-head">
            <span className="section-label">{copy.label}</span>
            <h1 className="section-title">{copy.title}</h1>
          </div>

          <div className="checkout-panel">
            <TicketCheckoutForm
              language={language}
              previewDisabled={previewDisabled}
              initialTier={isTicketTierId(params?.tier) ? params.tier : undefined}
            />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
