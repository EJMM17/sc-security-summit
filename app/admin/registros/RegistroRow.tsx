"use client";

import { useState } from "react";
import { Check, X, Eye, RotateCcw, Pencil, Square, CheckSquare } from "lucide-react";
import {
  markRegistroCancelled,
  markRegistroPaid,
  revertRegistroPendiente,
} from "@/app/actions/admin";
import type { RegistroRow as RegistroRowData } from "./page";
import RegistroDetail from "./RegistroDetail";
import EditRegistroModal from "./EditRegistroModal";

const TIER_LABEL: Record<RegistroRowData["tipo_acceso"], string> = {
  estudiante: "Estudiante",
  general: "General",
  vip: "VIP",
};

const ESTADO_TONE: Record<RegistroRowData["estado_pago"], string> = {
  pendiente: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  pagado: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  cancelado: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

const formatMxn = (n: number): string =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(n);

const formatDate = (iso: string | null): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX", {
    timeZone: "America/Monterrey",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateShort = (iso: string | null): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    timeZone: "America/Monterrey",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

type ActionMode = "paid" | "cancelled" | "revert" | null;

export default function RegistroRow({
  row,
  selected,
  onToggleSelect,
}: {
  row: RegistroRowData;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [paidNote, setPaidNote] = useState("");
  const [cancelledNote, setCancelledNote] = useState("");
  const [revertNote, setRevertNote] = useState("");

  function cancelAction() {
    setActionMode(null);
    setPaidNote("");
    setCancelledNote("");
    setRevertNote("");
  }

  const handleMarkPaid = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm(`¿Confirmar el pago del folio ${row.folio} por ${formatMxn(row.monto_mxn)}?`)) {
      e.preventDefault();
    }
  };

  const handleMarkCancelled = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm(`¿Cancelar el folio ${row.folio}? Esta acción se registrará en auditoría.`)) {
      e.preventDefault();
    }
  };

  const handleRevert = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm(`¿Revertir el folio ${row.folio} a "pendiente"? Se borrará la información de pago.`)) {
      e.preventDefault();
    }
  };

  return (
    <>
      <tr className="border-t border-slate-800 hover:bg-slate-900/50">
        {/* Checkbox */}
        <td className="px-3 py-2">
          <button
            type="button"
            onClick={onToggleSelect}
            className="text-slate-500 hover:text-slate-300"
          >
            {selected ? (
              <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
          </button>
        </td>

        <td className="px-3 py-2 font-mono text-[11px]">{row.folio}</td>

        {/* Nombre */}
        <td className="px-3 py-2">
          {row.nombre} {row.apellido}
        </td>

        {/* Empresa */}
        <td className="px-3 py-2 text-slate-300">
          <div>{row.empresa}</div>
          <div className="text-[10px] text-slate-500">{row.cargo}</div>
        </td>

        {/* Monto */}
        <td className="px-3 py-2 text-right tabular-nums">{formatMxn(row.monto_mxn)}</td>

        {/* Estado */}
        <td className="px-3 py-2">
          <span
            className={`inline-block px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border rounded ${ESTADO_TONE[row.estado_pago]}`}
          >
            {row.estado_pago}
          </span>
        </td>

        {/* Pagado en */}
        <td className="px-3 py-2 text-slate-400 text-[11px]">{formatDateShort(row.pagado_en)}</td>

        {/* Creado */}
        <td className="px-3 py-2 text-slate-400 text-[11px]">{formatDate(row.created_at)}</td>

        {/* Email */}
        <td className="px-3 py-2 text-slate-300">
          <a className="hover:text-blue-300" href={`mailto:${row.email}`}>
            {row.email}
          </a>
        </td>

        {/* Tier */}
        <td className="px-3 py-2">{TIER_LABEL[row.tipo_acceso]}</td>

        {/* CFDI */}
        <td className="px-3 py-2 text-slate-300">
          {row.requiere_cfdi ? <span title={row.rfc ?? ""}>Sí · {row.rfc ?? "—"}</span> : "—"}
        </td>

        {/* Actions */}
        <td className="px-3 py-2">
          <div className="flex items-center gap-1 flex-wrap">
            {/* View detail */}
            <button
              type="button"
              onClick={() => setShowDetail(true)}
              title="Ver detalle"
              className="inline-flex items-center justify-center w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <Eye className="w-3.5 h-3.5" aria-label="Ver detalle" />
            </button>

            {/* Edit */}
            <button
              type="button"
              onClick={() => setShowEdit(true)}
              title="Editar"
              className="inline-flex items-center justify-center w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <Pencil className="w-3.5 h-3.5" aria-label="Editar" />
            </button>

            {/* Mark paid — only for pendiente */}
            {row.estado_pago === "pendiente" && (
              <>
                {actionMode === "paid" ? (
                  <form action={markRegistroPaid} onSubmit={handleMarkPaid} className="flex items-center gap-1">
                    <input type="hidden" name="folio" value={row.folio} />
                    <input type="hidden" name="note" value={paidNote} />
                    <input
                      type="text"
                      value={paidNote}
                      onChange={(e) => setPaidNote(e.target.value)}
                      placeholder="Nota (opcional)"
                      maxLength={500}
                      className="w-24 px-2 py-1 text-[10px] bg-slate-900 border border-slate-700 rounded text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      title="Confirmar pagado"
                      className="inline-flex items-center justify-center w-7 h-7 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={cancelAction} className="inline-flex items-center justify-center w-7 h-7 rounded bg-slate-700/40 hover:bg-slate-700 text-slate-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActionMode("paid")}
                    title="Marcar pagado"
                    className="inline-flex items-center justify-center w-7 h-7 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300"
                  >
                    <Check className="w-3.5 h-3.5" aria-label="Marcar pagado" />
                  </button>
                )}
              </>
            )}

            {/* Cancel — for pendiente AND pagado */}
            {(row.estado_pago === "pendiente" || row.estado_pago === "pagado") && (
              <>
                {actionMode === "cancelled" ? (
                  <form action={markRegistroCancelled} onSubmit={handleMarkCancelled} className="flex items-center gap-1">
                    <input type="hidden" name="folio" value={row.folio} />
                    <input type="hidden" name="note" value={cancelledNote} />
                    <input
                      type="text"
                      value={cancelledNote}
                      onChange={(e) => setCancelledNote(e.target.value)}
                      placeholder="Nota (opcional)"
                      maxLength={500}
                      className="w-24 px-2 py-1 text-[10px] bg-slate-900 border border-slate-700 rounded text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                    <button type="submit" title="Confirmar cancelar" className="inline-flex items-center justify-center w-7 h-7 rounded bg-red-600/20 hover:bg-red-600/40 text-red-300">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={cancelAction} className="inline-flex items-center justify-center w-7 h-7 rounded bg-slate-700/40 hover:bg-slate-700 text-slate-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActionMode("cancelled")}
                    title="Cancelar"
                    className="inline-flex items-center justify-center w-7 h-7 rounded bg-slate-700/40 hover:bg-slate-700 text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" aria-label="Cancelar" />
                  </button>
                )}
              </>
            )}

            {/* Revert paid → pendiente */}
            {row.estado_pago === "pagado" && (
              <>
                {actionMode === "revert" ? (
                  <form action={revertRegistroPendiente} onSubmit={handleRevert} className="flex items-center gap-1">
                    <input type="hidden" name="folio" value={row.folio} />
                    <input type="hidden" name="note" value={revertNote} />
                    <input
                      type="text"
                      value={revertNote}
                      onChange={(e) => setRevertNote(e.target.value)}
                      placeholder="Motivo (opcional)"
                      maxLength={500}
                      className="w-24 px-2 py-1 text-[10px] bg-slate-900 border border-slate-700 rounded text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                    <button type="submit" title="Confirmar revertir" className="inline-flex items-center justify-center w-7 h-7 rounded bg-amber-600/20 hover:bg-amber-600/40 text-amber-300">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={cancelAction} className="inline-flex items-center justify-center w-7 h-7 rounded bg-slate-700/40 hover:bg-slate-700 text-slate-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActionMode("revert")}
                    title="Revertir a pendiente"
                    className="inline-flex items-center justify-center w-7 h-7 rounded bg-amber-600/20 hover:bg-amber-600/40 text-amber-300"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-label="Revertir a pendiente" />
                  </button>
                )}
              </>
            )}
          </div>
        </td>
      </tr>

      {showDetail && (
        <RegistroDetail row={row} onClose={() => setShowDetail(false)} />
      )}
      {showEdit && (
        <EditRegistroModal row={row} onClose={() => setShowEdit(false)} />
      )}
    </>
  );
}
