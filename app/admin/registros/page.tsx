import { LogOut, Download } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase";
import { adminLogout } from "@/app/actions/admin";
import RegistroRow from "./RegistroRow";

export const dynamic = "force-dynamic";

type SearchParams = {
  estado?: string;
  tipo?: string;
  q?: string;
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
  created_at: string;
};

export default async function RegistrosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const adminEmail = await requireAdmin();
  const params = await searchParams;

  const supabase = createAdminClient();
  let query = supabase
    .from("registros")
    .select(
      "folio,nombre,apellido,email,empresa,cargo,telefono,tipo_acceso,monto_mxn,estado_pago,requiere_cfdi,rfc,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);

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

  const { data: rows, error } = await query.returns<RegistroRow[]>();

  const counts = await loadCounts(supabase);

  const exportHref =
    "/admin/registros/export.csv?" +
    new URLSearchParams(
      Object.entries(params).filter(([, v]) => Boolean(v)) as [string, string][],
    ).toString();

  return (
    <main className="px-4 sm:px-8 py-8 max-w-screen-2xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold">Registros</h1>
          <p className="text-xs text-slate-400">
            Sesión: {adminEmail} · {rows?.length ?? 0} resultado(s) · Total{" "}
            {counts.total} · Pagados {counts.pagado} · Pendientes {counts.pendiente}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
    </main>
  );
}

async function loadCounts(supabase: ReturnType<typeof createAdminClient>) {
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
  return { total: total ?? 0, pagado: pagado ?? 0, pendiente: pendiente ?? 0 };
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
