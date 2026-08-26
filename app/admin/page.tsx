import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import { redirect } from "next/navigation";
import { logout } from "@/app/admin/actions";
import { hasAdminSession } from "@/lib/admin/auth";
import {
  formatDateTime,
  KIND_LABELS,
  NOTIFICATION_LABELS,
  NOTIFICATION_STYLES,
  STATUS_LABELS,
  STATUS_STYLES,
} from "@/lib/admin/labels";
import {
  INQUIRY_STATUSES,
  type InquiryKind,
  type InquiryStatus,
} from "@/lib/admin/types";
import {
  countInquiries,
  listInquiries,
} from "@/server/repositories/admin-inquiry-repository";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

function statusFilter(value: string): InquiryStatus | "all" {
  return (INQUIRY_STATUSES as readonly string[]).includes(value)
    ? (value as InquiryStatus)
    : "all";
}

function kindFilter(value: string): InquiryKind | "all" {
  return value === "corporate" || value === "sponsor" ? value : "all";
}

function filterHref(
  base: { status: string; kind: string; q: string },
  patch: Partial<{ status: string; kind: string; q: string }>,
): string {
  const next = { ...base, ...patch };
  const params = new URLSearchParams();
  if (next.status && next.status !== "all") params.set("status", next.status);
  if (next.kind && next.kind !== "all") params.set("kind", next.kind);
  if (next.q) params.set("q", next.q);
  const query = params.toString();
  return query ? `/admin?${query}` : "/admin";
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!(await hasAdminSession())) redirect("/admin/login");

  const params = await searchParams;
  const status = statusFilter(readParam(params, "status"));
  const kind = kindFilter(readParam(params, "kind"));
  const search = readParam(params, "q").slice(0, 120);
  const active = { status, kind, q: search };

  const [counts, inquiries] = await Promise.all([
    countInquiries(),
    listInquiries({ status, kind, search }),
  ]);

  const summary = [
    { label: "Solicitudes", value: counts.total },
    { label: "Nuevas", value: counts.byStatus.new },
    { label: "En seguimiento", value: counts.byStatus.contacted + counts.byStatus.qualified + counts.byStatus.proposal_sent },
    { label: "Correos pendientes", value: counts.notificationsPending },
    { label: "Correos fallidos", value: counts.notificationsDead },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            SC Security Summit 2026
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Solicitudes recibidas
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pases corporativos y patrocinios enviados desde los formularios del
            sitio. Las compras de accesos individuales están en Órdenes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminNav current="/admin" />
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
            {INQUIRY_STATUSES.map((value) => (
              <Link
                key={value}
                href={filterHref(active, { status: value })}
                className={`rounded-full px-3 py-1 text-sm transition ${
                  status === value
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {STATUS_LABELS[value]}
              </Link>
            ))}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {(["all", "corporate", "sponsor"] as const).map((value) => (
              <Link
                key={value}
                href={filterHref(active, { kind: value })}
                className={`rounded-full px-3 py-1 text-sm transition ${
                  kind === value
                    ? "bg-blue-700 text-white"
                    : "bg-blue-50 text-blue-800 hover:bg-blue-100"
                }`}
              >
                {value === "all" ? "Ambos tipos" : KIND_LABELS[value]}
              </Link>
            ))}
            <form action="/admin" method="get" className="flex items-center gap-2">
              {status !== "all" ? (
                <input type="hidden" name="status" value={status} />
              ) : null}
              {kind !== "all" ? (
                <input type="hidden" name="kind" value={kind} />
              ) : null}
              <input
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Empresa, nombre o correo"
                aria-label="Buscar solicitudes"
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

        {inquiries.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No hay solicitudes que coincidan con este filtro.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Recibida</th>
                  <th scope="col" className="px-4 py-3 font-medium">Empresa</th>
                  <th scope="col" className="px-4 py-3 font-medium">Contacto</th>
                  <th scope="col" className="px-4 py-3 font-medium">Tipo</th>
                  <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                  <th scope="col" className="px-4 py-3 font-medium">Correo</th>
                  <th scope="col" className="px-4 py-3 font-medium">Responsable</th>
                  <th scope="col" className="px-4 py-3 font-medium">Seguimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {formatDateTime(inquiry.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <Link
                        href={`/admin/${inquiry.id}`}
                        className="text-blue-700 underline-offset-2 hover:underline"
                      >
                        {inquiry.company}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="block">{inquiry.contact_name}</span>
                      <span className="block text-xs text-slate-500">
                        {inquiry.email}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {KIND_LABELS[inquiry.kind]}
                      {inquiry.requested_seats
                        ? ` · ${inquiry.requested_seats} accesos`
                        : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[inquiry.status]}`}
                      >
                        {STATUS_LABELS[inquiry.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {inquiry.notification ? (
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${NOTIFICATION_STYLES[inquiry.notification.status]}`}
                        >
                          {NOTIFICATION_LABELS[inquiry.notification.status]}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {inquiry.owner ?? "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {formatDateTime(inquiry.next_follow_up_at)}
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
