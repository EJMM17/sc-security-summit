import { LogOut, Download, Users, Shield } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase";
import { adminLogout } from "@/app/actions/admin";
import RegistroRow from "./RegistroRow";
import Pagination from "./Pagination";

export const dynamic = "force-dynamic";

type SearchParams = {
  estado?: string;
  tipo?: string;
  q?: string;
  page?: string;
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

const PAGE_SIZE = 50;

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
  const adminEmail = await requireAdmin();
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createAdminClient();

  let query = supabase
    .from("registros")
    .select(
      "folio,nombre,apellido,email,empresa,cargo,telefono,tipo_acceso,monto_mxn,estado_pago,requiere_cfdi,rfc,razon_social,codigo_postal_fiscal,created_at,ip_registro,user_agent,referer,utm_source,utm_medium,utm_campaign,pagado_en,pagado_por,pago_nota,cancelado_en,cancelado_por,cancelacion_nota",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.estado) query = query.eq("estado_pago", params.estado);
  if (params.tipo) query = query.eq("tipo_acceso", params.tipo);
  if (params.q) {
    const q = params.q.trim();
    if (q.length > 0) {
      query = query.or(
        `folio.ilike.%${q}%,email.ilike.%${q}%,nombre.ilike.%${q}%,apellido.ilike.%${q}%,empresa.ilike.%${q}%`,
      );
    }
  }

  const { data: rows, error, count } = await query.returns<RegistroRow[]>();

  const stats = await loadStats(supabase);
  const totalItems = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const exportHref =
    "/admin/registros/export.csv?" +
    new URLSearchParams(
      Object.entries(params).filter(([, v]) => Boolean(v) && v !== "1") as [string, string][],
    ).toString();

  return (
    <main className="px-4 sm:px-8 py-8 max-w-screen-2xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold">Registros</h1>
          <p className="text-xs text-slate-400">
            Sesión: {adminEmail} · {totalItems} registro(s) en total
          </p>
        </div>
        <div className="flex items-center gap-2">
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
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" /> Salir
            </button>
          </form>
        </div>
      </header>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total" value={String(stats.total)} icon={<Users className="w-3.5 h-3.5" />} />
        <StatCard label="Pagados" value={String(stats.pagado)} tone="emerald" />
        <StatCard label="Pendientes" value={String(stats.pendiente)} tone="amber" />
        <StatCard label="Cancelados" value={String(stats.cancelado)} tone="slate" />
        <StatCard label="Ingresos" value={stats.ingresos} tone="emerald" />
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 mb-6 p-3 bg-slate-900/50 border border-slate-800 rounded-md"
      >
        <Field name="q" label="Búsqueda" defaultValue={params.q ?? ""} placeholder="folio, email, nombre, empresa..." />
        <Select name="estado" label="Estado de pago" defaultValue={params.estado ?? ""} options={ESTADO_OPTS} />
        <Select name="tipo" label="Tipo de acceso" defaultValue={params.tipo ?? ""} options={TIPO_OPTS} />
        <button
          type="submit"
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-xs font-medium"
        >
          Aplicar
        </button>
        {(params.q || params.estado || params.tipo) && (
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

      <div className="overflow-x-auto border border-slate-800 rounded-md">
        <table className="w-full text-xs">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Folio</th>
              <th className="text-left px-3 py-2 font-medium">Nombre</th>
              <th className="text-left px-3 py-2 font-medium">Email</th>
              <th className="text-left px-3 py-2 font-medium">Empresa</th>
              <th className="text-left px-3 py-2 font-medium">Tier</th>
              <th className="text-right px-3 py-2 font-medium">Monto</th>
              <th className="text-left px-3 py-2 font-medium">Estado</th>
              <th className="text-left px-3 py-2 font-medium">CFDI</th>
              <th className="text-left px-3 py-2 font-medium">Creado</th>
              <th className="text-left px-3 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r) => (
              <RegistroRow key={r.folio} row={r} />
            ))}
            {rows && rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-slate-500">
                  Sin registros que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} />
    </main>
  );
}

async function loadStats(supabase: ReturnType<typeof createAdminClient>) {
  const { count: total } = await supabase
    .from("registros")
    .select("*", { count: "exact", head: true });
  const { count: pagado } = await supabase
    .from("registros")
    .select("*", { count: "exact", head: true })
    .eq("estado_pago", "pagado");
  const { count: pendiente } = await supabase
    .from("registros")
    .select("*", { count: "exact", head: true })
    .eq("estado_pago", "pendiente");
  const { count: cancelado } = await supabase
    .from("registros")
    .select("*", { count: "exact", head: true })
    .eq("estado_pago", "cancelado");

  const { data: ingresosData } = await supabase
    .from("registros")
    .select("monto_mxn")
    .eq("estado_pago", "pagado");

  const ingresos = (ingresosData ?? []).reduce((sum, r) => sum + (r.monto_mxn ?? 0), 0);

  return {
    total: total ?? 0,
    pagado: pagado ?? 0,
    pendiente: pendiente ?? 0,
    cancelado: cancelado ?? 0,
    ingresos: new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(ingresos),
  };
}

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
      <div className={`text-lg font-semibold tabular-nums ${tone ? toneClasses[tone] : "text-slate-100"}`}>
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
}: {
  name: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </label>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
      />
    </div>
  );
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
