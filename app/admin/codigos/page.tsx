import { ArrowLeft, Power, PowerOff } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { listCodigos, toggleCodigo, type CodigoRow } from "@/app/actions/codigos";
import CodigoForm from "./CodigoForm";

export const dynamic = "force-dynamic";

const formatMxn = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(n);

function descuentoLabel(row: CodigoRow): string {
  return row.tipo_descuento === "porcentaje"
    ? `${Number(row.valor)}%`
    : `−${formatMxn(Number(row.valor))}`;
}

function vigenciaLabel(row: CodigoRow): string {
  if (!row.valido_hasta) return "Sin caducidad";
  return new Date(row.valido_hasta).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "America/Monterrey",
  });
}

function estaVencido(row: CodigoRow): boolean {
  return row.valido_hasta !== null && new Date(row.valido_hasta).getTime() < Date.now();
}

function estaAgotado(row: CodigoRow): boolean {
  return row.max_usos !== null && row.usos >= row.max_usos;
}

function EstadoBadge({ row }: { row: CodigoRow }) {
  if (!row.activo) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/30">
        Inactivo
      </span>
    );
  }
  if (estaVencido(row)) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
        Vencido
      </span>
    );
  }
  if (estaAgotado(row)) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
        Agotado
      </span>
    );
  }
  return (
    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
      Activo
    </span>
  );
}

export default async function CodigosPage() {
  await requireAdmin();
  const codigos = await listCodigos();

  const activos = codigos.filter((c) => c.activo && !estaVencido(c) && !estaAgotado(c)).length;
  const usosTotales = codigos.reduce((sum, c) => sum + c.usos, 0);

  return (
    <main className="px-4 sm:px-8 py-8 max-w-screen-xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold">Códigos de descuento</h1>
          <p className="text-xs text-slate-400">
            {codigos.length} código(s) · {activos} vigente(s) · {usosTotales} uso(s) en total
          </p>
        </div>
        <a
          href="/admin/registros"
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Volver a registros
        </a>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6 items-start">
        {/* ── Listado ─────────────────────────────────────────────────── */}
        <div className="overflow-x-auto border border-slate-800 rounded-md">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-900 text-left text-slate-400">
                <th className="px-3 py-2 font-medium">Código</th>
                <th className="px-3 py-2 font-medium">Descuento</th>
                <th className="px-3 py-2 font-medium">Aplica a</th>
                <th className="px-3 py-2 font-medium">Usos</th>
                <th className="px-3 py-2 font-medium">Vigencia</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium sr-only">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {codigos.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                    Aún no hay códigos. Crea el primero con el formulario.
                  </td>
                </tr>
              )}
              {codigos.map((row) => (
                <tr key={row.id} className="hover:bg-slate-900/40">
                  <td className="px-3 py-2.5">
                    <span className="font-mono font-semibold text-slate-100">{row.codigo}</span>
                    {row.descripcion && (
                      <p className="text-[10px] text-slate-500 mt-0.5">{row.descripcion}</p>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-slate-200">{descuentoLabel(row)}</td>
                  <td className="px-3 py-2.5 text-slate-300">
                    {row.aplica_a?.length ? row.aplica_a.join(", ") : "Todos"}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-slate-200">
                    {row.usos}
                    <span className="text-slate-500"> / {row.max_usos ?? "∞"}</span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-300">{vigenciaLabel(row)}</td>
                  <td className="px-3 py-2.5">
                    <EstadoBadge row={row} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <form action={toggleCodigo}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="activo" value={String(!row.activo)} />
                      <button
                        type="submit"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] border transition-colors ${
                          row.activo
                            ? "border-red-500/30 text-red-300 hover:bg-red-500/10"
                            : "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                        }`}
                      >
                        {row.activo ? (
                          <>
                            <PowerOff className="w-3 h-3" aria-hidden="true" /> Desactivar
                          </>
                        ) : (
                          <>
                            <Power className="w-3 h-3" aria-hidden="true" /> Activar
                          </>
                        )}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Alta ────────────────────────────────────────────────────── */}
        <CodigoForm />
      </div>

      <p className="text-[11px] text-slate-600 mt-4">
        Los códigos no se eliminan para conservar el histórico de usos; desactívalos cuando ya no
        deban aceptarse. La redención descuenta sobre el precio de lista y queda registrada en cada
        registro (columnas codigo_descuento / descuento_mxn).
      </p>
    </main>
  );
}
