import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import PageShell from "@/components/PageShell";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import { formatMxn } from "@/lib/payments/tax";
import { reconcileTicketOrder } from "@/server/use-cases/reconcile-ticket-order";

export type CheckoutOutcomeKind = "success" | "pending" | "failure";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Return page shared by the three MercadoPago back_urls.
 *
 * The rendered order summary contains no buyer identity and no fiscal data:
 * the order id travels in a URL that ends up in browser history, referrers and
 * the buyer's clipboard, so it must not unlock anything personal.
 *
 * The status shown is the stored one, not the one MercadoPago put in the query
 * string. A buyer who edits `?status=approved` sees whatever the webhook
 * actually recorded.
 *
 * An order still `pending` is reconciled against MercadoPago first, so a buyer
 * whose webhook never arrived is not shown a stale status forever.
 */
export default async function CheckoutOutcome({
  kind,
  language,
  orderId,
}: {
  kind: CheckoutOutcomeKind;
  language: Language;
  orderId: string | undefined;
}) {
  const copy = CONTENT[language].checkout;

  const summary =
    orderId && UUID_PATTERN.test(orderId)
      ? await reconcileTicketOrder(orderId).catch(() => null)
      : null;

  const presentation = {
    success: {
      icon: <CheckCircle2 className="h-12 w-12 text-emerald-600" aria-hidden="true" />,
      title: copy.successTitle,
      desc: copy.successDesc,
    },
    pending: {
      icon: <Clock className="h-12 w-12 text-amber-500" aria-hidden="true" />,
      title: copy.pendingTitle,
      desc: copy.pendingDesc,
    },
    failure: {
      icon: <XCircle className="h-12 w-12 text-red-600" aria-hidden="true" />,
      title: copy.failureTitle,
      desc: copy.failureDesc,
    },
  }[kind];

  const checkoutHref = language === "en" ? "/checkout?lang=en" : "/checkout";
  const homeHref = language === "en" ? "/?lang=en" : "/";

  return (
    <PageShell language={language}>
      <section className="bg-white px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <div className="flex justify-center">{presentation.icon}</div>
          <h1 className="section-title mt-5">{presentation.title}</h1>
          <p className="mt-4 text-slate-500">{presentation.desc}</p>

          {kind === "success" && summary?.requires_invoice && (
            <p className="mt-4 text-sm font-semibold text-slate-700">
              {copy.successInvoice}
            </p>
          )}

          {summary ? (
            <div className="checkout-summary mt-8 text-left">
              <h2>{copy.summaryTitle}</h2>
              <dl>
                <div>
                  <dt>{copy.summarySubtotal}</dt>
                  <dd>{formatMxn(summary.subtotal_cents, language)}</dd>
                </div>
                <div>
                  <dt>{copy.summaryTax}</dt>
                  <dd>{formatMxn(summary.tax_cents, language)}</dd>
                </div>
                <div className="checkout-summary-total">
                  <dt>{copy.summaryTotal}</dt>
                  <dd>{formatMxn(summary.total_cents, language)} MXN</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-slate-500">
                {copy.orderReference}:{" "}
                <span className="font-mono">{summary.id}</span>
              </p>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">{copy.statusUnknown}</p>
          )}

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {kind === "success" ? (
              <Link href={homeHref} className="btn-primary px-7 py-3.5 text-sm">
                {copy.backToHome}
              </Link>
            ) : (
              <>
                <Link href={checkoutHref} className="btn-primary px-7 py-3.5 text-sm">
                  {copy.backToCheckout}
                </Link>
                <Link href={homeHref} className="btn-outline px-7 py-3.5 text-sm">
                  {copy.backToHome}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
