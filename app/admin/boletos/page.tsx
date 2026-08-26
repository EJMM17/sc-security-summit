import Link from "next/link";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { logout } from "@/app/admin/actions";
import { hasAdminSession } from "@/lib/admin/auth";
import {
  formatDateTime,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_STYLES,
  TIER_LABELS,
} from "@/lib/admin/labels";
import {
  TICKET_TIER_VALUES,
  type AdminTicketTier,
} from "@/lib/admin/types";
import { formatMxn } from "@/lib/payments/tax";
import {
  getSalesTracking,
  listCapacity,
  listSoldTickets,
} from "@/server/repositories/admin-ticket-order-repository";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const DAYS_IN_CHART = 14;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

function tierFilter(value: string): AdminTicketTier | "all" {
  return (TICKET_TIER_VALUES as readonly string[]).includes(value)
    ? (value as AdminTicketTier)
    : "all";
}

function filterHref(
  base: { tier: string; q: string },
  patch: Partial<{ tier: string; q: string }>,
  path = "/admin/boletos",
): string {
  const next = { ...base, ...patch };
  const params = new URLSearchParams();
  if (next.tier && next.tier !== "all") params.set("tier", next.tier);
  if (next.q) params.set("q", next.q);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

const DAY_LABEL = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

function dayLabel(day: string): string {
  const parsed = Date.parse(`${day}T00:00:00Z`);
  return Number.isNaN(parsed) ? day : DAY_LABEL.format(parsed);
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!(await hasAdminSession())) redirect("/admin/login");

  const params = await searchParams;
  const tier = tierFilter(readParam(params, "tier"));
  const search = readParam(params, "q").slice(0, 120);
  const active = { tier, q: search };

  const [tracking, tickets, capacity] = await Promise.all([
    getSalesTracking(),
    listSoldTickets({ tier, search }),
    listCapacity(),
  ]);

  const summary = [
    { label: "Boletos vendidos", value: String(tracking.soldSeats) },
    { label: "Órdenes pagadas", value: String(tracking.paidOrders) },
    {
      label: "Cobrado (con IVA)",
      value: formatMxn(tracking.grossCents, "es"),
    },
    { label: "IVA incluido", value: formatMxn(tracking.taxCents, "es") },
    {
      label: "Promedio por boleto",
      value: formatMxn(tracking.averageSeatCents, "es"),
    },
    { label: "Últimos 7 días", value: `${tracking.seatsLast7Days} boletos` },
    {
      label: "En proceso",
      value: `${tracking.heldSeats} boletos`,
    },
    {
      label: "Conversión",
      value:
        tracking.conversionRate === null
          ? "—"
          : percent(tracking.conversionRate),
    },
    {
      label: "Abandonadas",
      value: String(tracking.abandonedOrders),
    },
  ];

  const chartDays = tracking.byDay.slice(-DAYS_IN_CHART);
  const peakDay = chartDays.reduce((max, row) => Math.max(max, row.seats), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            SC Security Summit 2026
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Boletos vendidos
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Un renglón por acceso pagado. Los bloques corporativos aparecen con
            el nombre de cada participante; los accesos individuales, a nombre
            de quien compró. Última venta:{" "}
            {formatDateTime(tracking.lastSaleAt)}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminNav current="/admin/boletos" />
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <section
        aria-label="Resumen de ventas"
        className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
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

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Por tipo de acceso
          </h2>
          {tracking.byTier.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Aún no hay ventas.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {tracking.byTier.map((row) => (
                <li key={row.tier}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium text-slate-800">
                      {TIER_LABELS[row.tier]}
                    </span>
                    <span className="tabular-nums text-slate-600">
                      {row.seats} · {formatMxn(row.grossCents, "es")}
                    </span>
                  </div>
                  <div
                    className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"
                    aria-hidden
                  >
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{
                        width: `${
                          tracking.soldSeats === 0
                            ? 0
                            : Math.round((row.seats / tracking.soldSeats) * 100)
                        }%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Ventas por día (últimos {DAYS_IN_CHART} con actividad)
          </h2>
          {chartDays.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Aún no hay ventas.</p>
          ) : (
            <ol className="mt-3 flex h-32 items-end gap-2">
              {chartDays.map((row) => (
                <li
                  key={row.day}
                  className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
                  title={`${dayLabel(row.day)}: ${row.seats} boletos · ${formatMxn(row.grossCents, "es")}`}
                >
                  <span className="text-[11px] tabular-nums text-slate-600">
                    {row.seats}
                  </span>
                  <span
                    className="w-full rounded-t bg-blue-600"
                    style={{
                      height: `${peakDay === 0 ? 0 : Math.max(4, Math.round((row.seats / peakDay) * 88))}px`,
                    }}
                    aria-hidden
                  />
                  <span className="truncate text-[11px] text-slate-500">
                    {dayLabel(row.day)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Cómo nos encontraron
          </h2>
          {tracking.byReferral.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Aún no hay ventas.</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {tracking.byReferral.slice(0, 8).map((row) => (
                <li
                  key={row.source}
                  className="flex items-baseline justify-between gap-3 py-1.5"
                >
                  <span className="truncate text-slate-700">{row.source}</span>
                  <span className="shrink-0 tabular-nums text-slate-500">
                    {row.seats} boletos · {row.orders} órdenes
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Cupo
          </h2>
          {capacity.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">
              Sin cupo configurado: la venta es ilimitada.
            </p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {capacity.map((row) => (
                <li key={row.scope}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-slate-800">
                      {row.scope}
                    </span>
                    <span className="tabular-nums text-slate-600">
                      {row.remaining_seats} / {row.total_seats} disponibles
                    </span>
                  </div>
                  <div
                    className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"
                    aria-hidden
                  >
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{
                        width: `${
                          row.total_seats === 0
                            ? 0
                            : Math.round(
                                (row.committed_seats / row.total_seats) * 100,
                              )
                        }%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-slate-500">
            El cupo se configura en Supabase Studio; aquí solo se consulta.
          </p>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-4">
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={filterHref(active, { tier: "all" })}
              className={`rounded-full px-3 py-1 text-sm transition ${
                tier === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Todos
            </Link>
            {TICKET_TIER_VALUES.map((value) => (
              <Link
                key={value}
                href={filterHref(active, { tier: value })}
                className={`rounded-full px-3 py-1 text-sm transition ${
                  tier === value
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {TIER_LABELS[value]}
              </Link>
            ))}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <form
              action="/admin/boletos"
              method="get"
              className="flex items-center gap-2"
            >
              {tier !== "all" ? (
                <input type="hidden" name="tier" value={tier} />
              ) : null}
              <input
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Participante, comprador, correo o folio"
                aria-label="Buscar boletos"
                className="w-64 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Buscar
              </button>
            </form>
            <a
              href={filterHref(active, {}, "/admin/boletos/lista.csv")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Descargar CSV
            </a>
          </div>
        </div>

        {tickets.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No hay boletos que coincidan con este filtro.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <caption className="sr-only">
                Accesos pagados, uno por asiento
              </caption>
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Folio</th>
                  <th scope="col" className="px-4 py-3 font-medium">Asistente</th>
                  <th scope="col" className="px-4 py-3 font-medium">Comprador</th>
                  <th scope="col" className="px-4 py-3 font-medium">Acceso</th>
                  <th scope="col" className="px-4 py-3 font-medium">Importe</th>
                  <th scope="col" className="px-4 py-3 font-medium">Pagado</th>
                  <th scope="col" className="px-4 py-3 font-medium">CFDI</th>
                  <th scope="col" className="px-4 py-3 font-medium">Orden</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.ticket_code}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">
                      {ticket.ticket_code}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {ticket.attendee_name ?? ticket.buyer_name}
                      {ticket.attendee_name === null ? (
                        <span className="ml-1 text-xs font-normal text-slate-400">
                          (comprador)
                        </span>
                      ) : null}
                      {ticket.seats_in_order > 1 ? (
                        <span className="block text-xs font-normal text-slate-500">
                          Asiento {ticket.seat_number} de{" "}
                          {ticket.seats_in_order}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {ticket.buyer_name}
                      <span className="block text-xs text-slate-500">
                        {ticket.company ?? ticket.email}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {TIER_LABELS[ticket.tier]}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-900">
                      {formatMxn(ticket.amount_cents, "es")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDateTime(ticket.paid_at ?? ticket.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${INVOICE_STATUS_STYLES[ticket.invoice_status]}`}
                      >
                        {INVOICE_STATUS_LABELS[ticket.invoice_status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/ordenes/${ticket.order_id}`}
                        className="text-blue-700 underline-offset-2 hover:underline"
                      >
                        Ver orden
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-4 text-xs text-slate-500">
        Los importes ya incluyen IVA. El folio es una referencia interna del
        panel: se deriva de la orden y el asiento, y no sustituye al
        comprobante de MercadoPago.
      </p>
    </div>
  );
}
