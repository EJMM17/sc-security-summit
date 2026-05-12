"use client";

import { useState, useTransition, useActionState } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown, CheckSquare, Square, CheckCheck, XCircle } from "lucide-react";
import { bulkMarkPaid, bulkMarkCancelled, type BulkActionState } from "@/app/actions/admin";
import RegistroRow from "./RegistroRow";
import type { RegistroRow as RegistroRowData } from "./page";

type SortCol = "created_at" | "nombre" | "empresa" | "monto_mxn" | "estado_pago" | "pagado_en";

type CurrentParams = {
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

const COLS: { key: SortCol; label: string; align?: "right" }[] = [
  { key: "nombre", label: "Nombre" },
  { key: "empresa", label: "Empresa" },
  { key: "monto_mxn", label: "Monto", align: "right" },
  { key: "estado_pago", label: "Estado" },
  { key: "pagado_en", label: "Pagado" },
  { key: "created_at", label: "Creado" },
];

function sortHref(
  col: SortCol,
  currentCol: SortCol,
  currentAsc: boolean,
  params: CurrentParams,
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

const initBulk: BulkActionState = { ok: false, message: "" };

export default function RegistrosTableClient({
  rows,
  sortCol,
  sortAsc,
  currentParams,
}: {
  rows: RegistroRowData[];
  sortCol: SortCol;
  sortAsc: boolean;
  currentParams: CurrentParams;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const [paidState, paidAction] = useActionState(bulkMarkPaid, initBulk);
  const [cancelledState, cancelledAction] = useActionState(bulkMarkCancelled, initBulk);

  const allFolios = rows.map((r) => r.folio);
  const allSelected = allFolios.length > 0 && allFolios.every((f) => selected.has(f));
  const someSelected = selected.size > 0;

  function toggle(folio: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(folio)) {
        next.delete(folio);
      } else {
        next.add(folio);
      }
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allFolios));
    }
  }

  function handleBulkPaid() {
    if (!confirm(`¿Marcar ${selected.size} registro(s) como pagado?`)) return;
    const fd = new FormData();
    fd.set("folios", Array.from(selected).join(","));
    startTransition(() => {
      paidAction(fd);
      setSelected(new Set());
    });
  }

  function handleBulkCancelled() {
    if (!confirm(`¿Cancelar ${selected.size} registro(s)?`)) return;
    const fd = new FormData();
    fd.set("folios", Array.from(selected).join(","));
    startTransition(() => {
      cancelledAction(fd);
      setSelected(new Set());
    });
  }

  return (
    <div>
      {/* Bulk action toolbar */}
      {someSelected && (
        <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-blue-950/40 border border-blue-700/40 rounded-md text-xs">
          <span className="text-blue-300 font-medium">{selected.size} seleccionado(s)</span>
          <button
            type="button"
            onClick={handleBulkPaid}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-600/30 text-emerald-300 rounded"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Marcar pagado
          </button>
          <button
            type="button"
            onClick={handleBulkCancelled}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-600/10 hover:bg-red-600/30 border border-red-600/30 text-red-300 rounded"
          >
            <XCircle className="w-3.5 h-3.5" /> Cancelar
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto text-slate-500 hover:text-slate-300"
          >
            Limpiar selección
          </button>
        </div>
      )}

      {/* Bulk action feedback */}
      {paidState.message && (
        <div
          className={`mb-3 px-3 py-2 rounded-md text-xs border ${
            paidState.ok
              ? "bg-emerald-950/40 border-emerald-700/40 text-emerald-300"
              : "bg-red-950/40 border-red-700/40 text-red-300"
          }`}
        >
          {paidState.message}
        </div>
      )}
      {cancelledState.message && (
        <div
          className={`mb-3 px-3 py-2 rounded-md text-xs border ${
            cancelledState.ok
              ? "bg-emerald-950/40 border-emerald-700/40 text-emerald-300"
              : "bg-red-950/40 border-red-700/40 text-red-300"
          }`}
        >
          {cancelledState.message}
        </div>
      )}

      <div className="overflow-x-auto border border-slate-800 rounded-md">
        <table className="w-full text-xs">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              {/* Select-all checkbox */}
              <th className="px-3 py-2 w-8">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-slate-400 hover:text-slate-200"
                  title={allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
                >
                  {allSelected ? (
                    <CheckSquare className="w-3.5 h-3.5" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                </button>
              </th>
              <th className="text-left px-3 py-2 font-medium">Folio</th>
              {COLS.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2 font-medium ${col.align === "right" ? "text-right" : "text-left"}`}
                >
                  <a
                    href={sortHref(col.key, sortCol, sortAsc, currentParams)}
                    className="inline-flex items-center gap-1 hover:text-slate-200"
                  >
                    {col.label}
                    {sortCol === col.key ? (
                      sortAsc ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </a>
                </th>
              ))}
              <th className="text-left px-3 py-2 font-medium">Email</th>
              <th className="text-left px-3 py-2 font-medium">Tier</th>
              <th className="text-left px-3 py-2 font-medium">CFDI</th>
              <th className="text-left px-3 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <RegistroRow
                key={r.folio}
                row={r}
                selected={selected.has(r.folio)}
                onToggleSelect={() => toggle(r.folio)}
              />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={13} className="px-3 py-8 text-center text-slate-500">
                  Sin registros que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
