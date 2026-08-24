import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/admin/auth";
import {
  formatDateTime,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_STYLES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  TIER_LABELS,
} from "@/lib/admin/labels";
import {
  INVOICE_STATUS_VALUES,
  TICKET_ORDER_STATUS_VALUES,
  type AdminInvoiceStatus,
  type AdminTicketOrderStatus,
} from "@/lib/admin/types";
import { formatMxn } from "@/lib/payments/tax";
import {
  countTicketOrders,
  listCapacity,
  listTicketOrders,
} from "@/server/repositories/admin-ticket-order-repository";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

function statusFilter(value: string): AdminTicketOrderStatus | "all" {
  return (TICKET_ORDER_STATUS_VALUES as readonly string[]).includes(value)
    ? (value as AdminTicketOrderStatus)
    : "all";
}

function invoiceFilter(value: string): AdminInvoiceStatus | "all" {
  return (INVOICE_STATUS_VALUES as readonly string[]).includes(value)
    ? (value as AdminInvoiceStatus)
    : "all";
}

function filterHref(
  base: { status: string; invoice: string; q: string },
  patch: Partial<{ status: string; invoice: string; q: string }>,
): string {
  const next = { ...base, ...patch };
  const params = new URLSearchParams();
  if (next.status && next.status !== "all") params.set("status", next.status);
  if (next.invoice && next.invoice !== "all") params.set("invoice", next.invoice);
  if (next.q) params.set("q", next.q);
  const query = params.toString();
  return query ? `/admin/ordenes?${query}` : "/admin/ordenes";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!(await hasAdminSession())) redirect("/admin/login");

  const params = await searchParams;
  const status = statusFilter(readParam(params, "status"));
  const invoice = invoiceFilter(readParam(params, "invoice"));
  const search = readParam(params, "q").slice(0, 120);
  const active = { status, invoice, q: search };

  const [counts, orders, capacity] = await Promise.all([
    countTicketOrders(),
    listTicketOrders({ status, invoice, search }),
    listCapacity(),
  ]);

  const summary = [
    { label: "Órdenes", value: String(counts.total) },
    { label: "Pagadas", value: String(counts.paid) },
    { label: "En proceso", value: String(counts.pending) },
    { label: "CFDI pendientes", value: String(counts.invoicesPending) },
    {
      label: "Cobrado (con IVA)",
      value: formatMxn(counts.paidRevenueCents, "es"),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            SC Security Summit 2026
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Órdenes de accesos
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Compras cobradas con MercadoPago. Los importes incluyen IVA
            desglosado; los datos fiscales se ven en el detalle de cada orden.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Ver solicitudes
        </Link>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {summary.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {item.label}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Cupo
        </h2>
        {capacity.length === 0 ? (
          <p className="mt-1 text-sm text-slate-600">
            Sin cupo configurado: la venta es ilimitada. Para activarlo, inserta
            filas en <code className="font-mono">public.ticket_capacity</code>{" "}
            desde Supabase Studio.
          </p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-4 text-sm text-slate-700">
            {capacity.map((row) => (
              <li key={row.scope}>
                <span className="font-medium">{row.scope}</span>:{" "}
                <span className="tabular-nums">
                  {row.remaining_seats} / {row.total_seats}
                </span>{" "}
                <span className="text-slate-500">disponibles</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-4">
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={filterHref(active, { status: "all" })}
              className={`rounded-full px-3 py-1 text-sm transition ${
                status === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Todas
            </Link>
            {TICKET_ORDER_STATUS_VALUES.map((value) => (
              <Link
                key={value}
                href={filterHref(active, { status: value })}
                className={`rounded-full px-3 py-1 text-sm transition ${
                  status === value
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {ORDER_STATUS_LABELS[value]}
              </Link>
            ))}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Link
              href={filterHref(active, { invoice: "requested" })}
              className={`rounded-full px-3 py-1 text-sm transition ${
                invoice === "requested"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              CFDI pendiente
            </Link>
            <Link
              href={filterHref(active, { invoice: "all" })}
              className={`rounded-full px-3 py-1 text-sm transition ${
                invoice === "all"
                  ? "bg-blue-700 text-white"
                  : "bg-blue-50 text-blue-800 hover:bg-blue-100"
              }`}
            >
              Todas las facturas
            </Link>
            <form
              action="/admin/ordenes"
              method="get"
              className="flex items-center gap-2"
            >
              {status !== "all" ? (
                <input type="hidden" name="status" value={status} />
              ) : null}
              {invoice !== "all" ? (
                <input type="hidden" name="invoice" value={invoice} />
              ) : null}
              <input
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Comprador, correo o empresa"
                aria-label="Buscar órdenes"
                className="w-56 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>

        {orders.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No hay órdenes que coincidan con este filtro.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Fecha</th>
                  <th scope="col" className="px-4 py-3 font-medium">Comprador</th>
                  <th scope="col" className="px-4 py-3 font-medium">Acceso</th>
                  <th scope="col" className="px-4 py-3 font-medium">Cant.</th>
                  <th scope="col" className="px-4 py-3 font-medium">IVA</th>
                  <th scope="col" className="px-4 py-3 font-medium">Total</th>
                  <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                  <th scope="col" className="px-4 py-3 font-medium">CFDI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDateTime(order.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <Link
                        href={`/admin/ordenes/${order.id}`}
                        className="text-blue-700 underline-offset-2 hover:underline"
                      >
                        {order.buyer_name}
                      </Link>
                      <span className="block text-xs font-normal text-slate-500">
                        {order.email}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {TIER_LABELS[order.tier]}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-700">
                      {order.quantity}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">
                      {formatMxn(order.tax_cents, "es")}
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums text-slate-900">
                      {formatMxn(order.total_cents, "es")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_STYLES[order.status]}`}
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${INVOICE_STATUS_STYLES[order.invoice_status]}`}
                      >
                        {INVOICE_STATUS_LABELS[order.invoice_status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
