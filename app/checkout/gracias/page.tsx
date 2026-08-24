import type { Metadata } from "next";
import CheckoutOutcome from "@/app/checkout/_components/CheckoutOutcome";
import { getRequestLanguage } from "@/lib/language";

// A payment return page must never be indexed or cached: it renders the state
// of one specific order.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ lang?: string; order?: string }>;

export default async function CheckoutOutcomePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = searchParams ? await searchParams : undefined;
  const language = await getRequestLanguage(params?.lang ?? null);

  return (
    <CheckoutOutcome
      kind="success"
      language={language}
      orderId={params?.order}
    />
  );
}
