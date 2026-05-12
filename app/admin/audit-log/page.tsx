import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type AuditRow = {
  id: string;
  evento: string;
  folio: string | null;
  usuario_email: string | null;
  detalles: Record<string, unknown> | null;
  created_at: string;
};

const EVENTO_TONE: Record<string, string> = {
  pago_confirmado: "text-emerald-400",
  registro_cancelado: "text-red-400",
  pago_revertido: "text-amber-400",
  email_reenviado: "text-blue-400",
  registro_editado: "text-violet-400",
};

const PAGE_SIZE = 50;

type SearchParams = { page?: string; evento?: string; folio?: string };

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createAdminClient();

  let query = supabase
    .from("audit_log")
    .select("id,evento,folio,usuario_email,detalles,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.evento) query = query.eq("evento", params.evento);
  if (params.folio) query = query.ilike("folio", `%${params.folio}%`);

  const { data: rows, error, count } = await query.returns<AuditRow[]>();

  // Event type options — fetch distinct values
  const { data: eventoRows } = await supabase
    .from("audit_log")
    .select("evento")
    .order("evento");
  const eventoOpts = Array.from(new Set((eventoRows ?? []).map((r) => r.evento))).sort();

  const totalItems = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  return (
    <main className="px-4 sm:px-8 py-8 max-w-screen-xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <a
          href="/admin/registros"
          className="inline-flex items-center justify-center w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
          aria-label="Volver a registros"
        >
          <ArrowLeft className="w-4 h-4" />
        </a>
        <div>
          <h1 className="text-xl font-semibold">Registro de Auditoría</h1>
          <p className="text-xs text-slate-400">{totalItems} evento(s) en total</p>
        </div>
      </header>

      {/* Filters */}
      <form method="get" className="flex flex-wrap items-end gap-3 mb-6 p-3 bg-slate-900/50 border border-slate-800 rounded-md">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Folio</label>
          <input
            name="folio"
            defaultValue={params.folio ?? ""}
            placeholder="SCSS2026-…"
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Tipo de evento</label>
          <select
            name="evento"
            defaultValue={params.evento ?? ""}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-100 focus:outline-none focus:border-blue-500"
          >
            <option value="">Todos</option>
            {eventoOpts.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-xs font-medium">
          Filtrar
        </button>
        {(params.evento || params.folio) && (
          <a href="/admin/audit-log" className="text-xs text-slate-400 hover:text-slate-200">
            Limpiar
          </a>
        )}
      </form>

      {error && (
        <div role="alert" className="mb-6 p-3 border border-red-700 bg-red-950/40 rounded-md text-sm text-red-300">
          Error al cargar el log: {error.message}
        </div>
      )}

      <div className="overflow-x-auto border border-slate-800 rounded-md">
        <table className="w-full text-xs">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Fecha</th>
              <th className="text-left px-3 py-2 font-medium">Evento</th>
              <th className="text-left px-3 py-2 font-medium">Folio</th>
              <th className="text-left px-3 py-2 font-medium">Usuario</th>
              <th className="text-left px-3 py-2 font-medium">Detalles</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r) => (
              <tr key={r.id} className="border-t border-slate-800 hover:bg-slate-900/50">
                <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                  {new Date(r.created_at).toLocaleString("es-MX", {
                    timeZone: "America/Monterrey",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </td>
                <td className={`px-3 py-2 font-medium ${EVENTO_TONE[r.evento] ?? "text-slate-300"}`}>
                  {r.evento}
                </td>
                <td className="px-3 py-2 font-mono text-[11px] text-slate-300">
                  {r.folio ? (
                    <a
                      href={`/admin/registros?q=${encodeURIComponent(r.folio)}`}
                      className="hover:text-blue-300"
                    >
                      {r.folio}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2 text-slate-400">{r.usuario_email ?? "—"}</td>
                <td className="px-3 py-2 text-slate-500 font-mono text-[10px]">
                  {r.detalles ? JSON.stringify(r.detalles) : "—"}
                </td>
              </tr>
            ))}
            {rows && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                  Sin eventos que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
          <span>
            Página {page} de {totalPages} · {totalItems} evento(s)
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/admin/audit-log?${buildParams(params, page - 1)}`}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md"
              >
                ← Anterior
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/admin/audit-log?${buildParams(params, page + 1)}`}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md"
              >
                Siguiente →
              </a>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function buildParams(params: SearchParams, page: number): string {
  const sp = new URLSearchParams();
  if (params.evento) sp.set("evento", params.evento);
  if (params.folio) sp.set("folio", params.folio);
  sp.set("page", String(page));
  return sp.toString();
}
