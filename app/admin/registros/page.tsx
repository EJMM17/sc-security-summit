import { LogOut, Download, Users, Shield, Ticket, ClipboardList, ArrowUpDown } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase";
import { adminLogout } from "@/app/actions/admin";
import Pagination from "./Pagination";
import RegistrosTableClient from "./RegistrosTableClient";

export const dynamic = "force-dynamic";

type SearchParams = {
  estado?: string;
  tipo?: string;
  q?: string;
  page?: string;
  per_page?: string;
  from?: string;
  to?: string;
  sort?: string;
  dir?: string;
};

const ESTADO_OPTS = [
  { value: "", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "pagado", label: "Pagado" },
  { value: "cancelado", label: "Cancelado" },
];

const TIPO_OPTS = [
  { value: "", label: "Todos" },
  { value: "estudiante", label: "Estudiante" },
  { value: "general", label: "General" },
  { value: "vip", label: "VIP" },
];

const PAGE_SIZE_OPTS = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 25;

const SORT_COLS = ["created_at", "nombre", "empresa", "monto_mxn", "estado_pago", "pagado_en"] as const;
type SortCol = (typeof SORT_COLS)[number];

export type RegistroRow = {
  folio: string;
  nombre: string;
  apellido: string;
  email: string;
  empresa: string;
  cargo: string;
  telefono: string | null;
  tipo_acceso: "estudiante" | "general" | "vip";
  monto_mxn: number;
  estado_pago: "pendiente" | "pagado" | "cancelado";
  metodo_pago: string | null;
  requiere_cfdi: boolean;
  rfc: string | null;
  razon_social: string | null;
  codigo_postal_fiscal: string | null;
  created_at: string;
  ip_registro: string | null;
  user_agent: string | null;
  referer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  pagado_en: string | null;
  pagado_por: string | null;
  pago_nota: string | null;
  cancelado_en: string | null;
  cancelado_por: string | null;
  cancelacion_nota: string | null;
};

export default async function RegistrosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;

  const requestedPerPage = parseInt(params.per_page ?? "", 10);
  const perPage = (PAGE_SIZE_OPTS as readonly number[]).includes(requestedPerPage)
    ? requestedPerPage
    : DEFAULT_PAGE_SIZE;

  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const sortCol: SortCol = (SORT_COLS as readonly string[]).includes(params.sort ?? "")
    ? (params.sort as SortCol)
    : "created_at";
  const sortAsc = params.dir === "asc";

  const supabase = createAdminClient();

  let rowsQuery = supabase
    .from("registros")
    .select(
      "folio,nombre,apellido,email,empresa,cargo,telefono,tipo_acceso,monto_mxn,estado_pago,metodo_pago,requiere_cfdi,rfc,razon_social,codigo_postal_fiscal,created_at,ip_registro,user_agent,referer,utm_source,utm_medium,utm_campaign,pagado_en,pagado_por,pago_nota,cancelado_en,cancelado_por,cancelacion_nota",
      { count: "exact" },
    )
    .order(sortCol, { ascending: sortAsc })
    .range(from, to);

  if (params.estado) rowsQuery = rowsQuery.eq("estado_pago", params.estado);
  if (params.tipo) rowsQuery = rowsQuery.eq("tipo_acceso", params.tipo);
  if (params.from) {
    const fromIso = parseDateBoundary(params.from, "start");
    if (fromIso) rowsQuery = rowsQuery.gte("created_at", fromIso);
  }
  if (params.to) {
    const toIso = parseDateBoundary(params.to, "end");
    if (toIso) rowsQuery = rowsQuery.lte("created_at", toIso);
  }
  if (params.q) {
    const q = params.q.trim();
    if (q.length > 0) {
      rowsQuery = rowsQuery.or(
        `folio.ilike.%${q}%,email.ilike.%${q}%,nombre.ilike.%${q}%,apellido.ilike.%${q}%,empresa.ilike.%${q}%`,
      );
    }
  }

  // Parallel fetches: rows + stats + cupos + chart data
  const [
    { data: rows, error, count },
    stats,
    cuposRes,
    chartRes,
  ] = await Promise.all([
    rowsQuery.returns<RegistroRow[]>(),
    loadStats(supabase),
    supabase.rpc("get_cupos_disponibles"),
    supabase
      .from("registros")
      .select("created_at")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const cuposDisponibles =
    typeof cuposRes.data === "number" ? cuposRes.data : null;
  const totalItems = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  const chartData = buildChartData(chartRes.data ?? []);

  const exportHref =
    "/admin/registros/export.csv?" +
    new URLSearchParams(
      Object.entries(params).filter(([k, v]) => Boolean(v) && v !== "1" && k !== "page") as [
        string,
        string,
      ][],
    ).toString();

  return (
    <main className="px-4 sm:px-8 py-8 max-w-screen-2xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold">Registros</h1>
          <p className="text-xs text-slate-400">
            Sesión: {admin.nombre || admin.email} · {totalItems} registro(s) en total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {cuposDisponibles !== null && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border ${
                cuposDisponibles <= 0
                  ? "bg-red-500/10 border-red-500/30 text-red-300"
                  : cuposDisponibles < 50
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              }`}
              title="Cupos disponibles"
            >
              <Ticket className="w-3.5 h-3.5" aria-hidden="true" />
              {cuposDisponibles} cupo(s)
            </span>
          )}
          <a
            href="/admin/audit-log"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-xs"
          >
            <ClipboardList className="w-3.5 h-3.5" aria-hidden="true" /> Auditoría
          </a>
          <a
            href="/admin/admins"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-xs"
          >
            <Shield className="w-3.5 h-3.5" aria-hidden="true" /> Admins
          </a>
          <a
            href={exportHref}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-xs"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" /> Export CSV
          </a>
          <form action={adminLogout}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-xs"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" /> Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      {/* Stats + mini chart */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-4 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <StatCard label="Total" value={String(stats.total)} icon={<Users className="w-3.5 h-3.5" />} />
          <StatCard label="Pagados" value={String(stats.pagado)} tone="emerald" />
          <StatCard label="Pendientes" value={String(stats.pendiente)} tone="amber" />
          <StatCard label="Cancelados" value={String(stats.cancelado)} tone="slate" />
          <StatCard label="Ingresos" value={stats.ingresos} tone="emerald" />
        </div>
        {chartData.length > 0 && (
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-md min-w-[220px]">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Registros (30 días)</p>
            <MiniBarChart data={chartData} />
          </div>
        )}
      </div>

      {/* Filters */}
      <form
        method="get"
        className="flex flex-wrap items-end gap-3 mb-6 p-3 bg-slate-900/50 border border-slate-800 rounded-md"
      >
        {/* Preserve sort/dir */}
        {sortCol !== "created_at" && <input type="hidden" name="sort" value={sortCol} />}
        {params.dir && <input type="hidden" name="dir" value={params.dir} />}
        <Field name="q" label="Búsqueda" defaultValue={params.q ?? ""} placeholder="folio, email, nombre, empresa..." />
        <Select name="estado" label="Estado de pago" defaultValue={params.estado ?? ""} options={ESTADO_OPTS} />
        <Select name="tipo" label="Tipo de acceso" defaultValue={params.tipo ?? ""} options={TIPO_OPTS} />
        <Field name="from" label="Desde" type="date" defaultValue={params.from ?? ""} />
        <Field name="to" label="Hasta" type="date" defaultValue={params.to ?? ""} />
        <Select
          name="per_page"
          label="Por página"
          defaultValue={String(perPage)}
          options={PAGE_SIZE_OPTS.map((n) => ({ value: String(n), label: String(n) }))}
        />
        <button
          type="submit"
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-xs font-medium"
        >
          Aplicar
        </button>
        {(params.q || params.estado || params.tipo || params.from || params.to) && (
          <a href="/admin/registros" className="text-xs text-slate-400 hover:text-slate-200">
            Limpiar
          </a>
        )}
      </form>

      {error && (
        <div role="alert" className="mb-6 p-3 border border-red-700 bg-red-950/40 rounded-md text-sm text-red-300">
          Error al cargar registros: {error.message}
        </div>
      )}

      <RegistrosTableClient
        rows={rows ?? []}
        sortCol={sortCol}
        sortAsc={sortAsc}
        currentParams={params}
      />

      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} perPage={perPage} />
    </main>
  );
}

// =============================================================
// Stats — parallel queries, then aggregate ingresos in JS
// =============================================================

async function loadStats(supabase: ReturnType<typeof createAdminClient>) {
  const [totalRes, pagadoRes, pendienteRes, canceladoRes, ingresosRes] = await Promise.all([
    supabase.from("registros").select("*", { count: "exact", head: true }),
    supabase.from("registros").select("*", { count: "exact", head: true }).eq("estado_pago", "pagado"),
    supabase.from("registros").select("*", { count: "exact", head: true }).eq("estado_pago", "pendiente"),
    supabase.from("registros").select("*", { count: "exact", head: true }).eq("estado_pago", "cancelado"),
    supabase.from("registros").select("monto_mxn").eq("estado_pago", "pagado"),
  ]);

  const ingresos = (ingresosRes.data ?? []).reduce((sum, r) => sum + (r.monto_mxn ?? 0), 0);

  return {
    total: totalRes.count ?? 0,
    pagado: pagadoRes.count ?? 0,
    pendiente: pendienteRes.count ?? 0,
    cancelado: canceladoRes.count ?? 0,
    ingresos: new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(ingresos),
  };
}

// =============================================================
// Chart helpers
// =============================================================

type DayCount = { label: string; count: number };

function buildChartData(rows: { created_at: string }[]): DayCount[] {
  const counts = new Map<string, number>();
  const now = new Date();
  // Initialize last 14 days
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("es-MX", {
      timeZone: "America/Monterrey",
      month: "2-digit",
      day: "2-digit",
    });
    counts.set(key, 0);
  }
  for (const r of rows) {
    const key = new Date(r.created_at).toLocaleDateString("es-MX", {
      timeZone: "America/Monterrey",
      month: "2-digit",
      day: "2-digit",
    });
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
}

function MiniBarChart({ data }: { data: DayCount[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const W = 200;
  const H = 48;
  const barW = Math.floor(W / data.length) - 1;

  return (
    <svg width={W} height={H} aria-label="Registros por día (últimos 14 días)">
      {data.map((d, i) => {
        const barH = Math.max(2, Math.round((d.count / max) * (H - 12)));
        const x = i * (barW + 1);
        const y = H - barH - 10;
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              fill={d.count > 0 ? "#3b82f6" : "#1e293b"}
              rx={1}
            />
            {d.count > 0 && (
              <text x={x + barW / 2} y={y - 2} textAnchor="middle" fontSize={8} fill="#94a3b8">
                {d.count}
              </text>
            )}
          </g>
        );
      })}
      {/* X axis labels: first, middle, last */}
      {[0, Math.floor(data.length / 2), data.length - 1].map((i) => (
        <text
          key={i}
          x={i * (barW + 1) + barW / 2}
          y={H}
          textAnchor="middle"
          fontSize={7}
          fill="#475569"
        >
          {data[i]?.label}
        </text>
      ))}
    </svg>
  );
}

// =============================================================
// Sort link helper — exported so RegistrosTableClient can use it
// =============================================================

export function sortHref(
  col: SortCol,
  currentCol: SortCol,
  currentAsc: boolean,
  params: SearchParams,
): string {
  const nextAsc = col === currentCol ? !currentAsc : false;
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.estado) sp.set("estado", params.estado);
  if (params.tipo) sp.set("tipo", params.tipo);
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  if (params.per_page) sp.set("per_page", params.per_page);
  sp.set("sort", col);
  sp.set("dir", nextAsc ? "asc" : "desc");
  return `/admin/registros?${sp.toString()}`;
}

// =============================================================
// UI components
// =============================================================

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: "emerald" | "amber" | "slate";
}) {
  const toneClasses = {
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    slate: "text-slate-400",
  };

  return (
    <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-md">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 mb-1">
        {icon}
        {label}
      </div>
      <div
        className={`text-lg font-semibold tabular-nums ${tone ? toneClasses[tone] : "text-slate-100"}`}
      >
        {value}
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
      />
    </div>
  );
}

function parseDateBoundary(value: string, edge: "start" | "end"): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const suffix = edge === "start" ? "T00:00:00-06:00" : "T23:59:59-06:00";
  return new Date(`${value}${suffix}`).toISOString();
}

function Select({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-100 focus:outline-none focus:border-blue-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
