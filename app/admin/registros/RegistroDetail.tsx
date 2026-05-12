"use client";

import { useState, useActionState } from "react";
import { X, Check, RotateCcw, Mail } from "lucide-react";
import {
  markRegistroPaid,
  markRegistroCancelled,
  revertRegistroPendiente,
  resendConfirmationEmail,
  type ResendEmailState,
} from "@/app/actions/admin";
import type { RegistroRow as RegistroRowData } from "./page";

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

const initResend: ResendEmailState = { ok: false, message: "" };

export default function RegistroDetail({
  row,
  onClose,
}: {
  row: RegistroRowData;
  onClose: () => void;
}) {
  const [resendState, resendAction, resendPending] = useActionState(resendConfirmationEmail, initResend);
  const [paidNote, setPaidNote] = useState("");
  const [cancelNote, setCancelNote] = useState("");
  const [revertNote, setRevertNote] = useState("");

  const handleMarkPaid = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm(`¿Confirmar el pago del folio ${row.folio} por ${formatMxn(row.monto_mxn)}?`)) {
      e.preventDefault();
    }
  };

  const handleMarkCancelled = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm(`¿Cancelar el folio ${row.folio}?`)) {
      e.preventDefault();
    }
  };

  const handleRevert = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm(`¿Revertir el folio ${row.folio} a "pendiente"? Se borrará la información de pago.`)) {
      e.preventDefault();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h2 className="text-sm font-semibold">Detalle del registro</h2>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-slate-800 text-slate-400"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 text-sm max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Folio" value={row.folio} />
            <Field label="Estado" value={row.estado_pago} />
            <Field label="Nombre" value={`${row.nombre} ${row.apellido}`} />
            <Field label="Email" value={row.email} />
            <Field label="Empresa" value={row.empresa} />
            <Field label="Cargo" value={row.cargo} />
            <Field label="Teléfono" value={row.telefono ?? "—"} />
            <Field label="Tipo de acceso" value={row.tipo_acceso} />
            <Field label="Monto" value={formatMxn(row.monto_mxn)} />
            <Field label="Requiere CFDI" value={row.requiere_cfdi ? `Sí · ${row.rfc ?? "—"}` : "No"} />
            <Field label="Creado" value={formatDate(row.created_at)} />
          </div>

          {row.pagado_en && (
            <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-md">
              <p className="text-xs font-medium text-emerald-400 mb-1">Información de pago</p>
              <DetailLine label="Pagado el" value={formatDate(row.pagado_en)} />
              <DetailLine label="Pagado por" value={row.pagado_por} />
              <DetailLine label="Nota" value={row.pago_nota} />
            </div>
          )}

          {row.cancelado_en && (
            <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-md">
              <p className="text-xs font-medium text-red-400 mb-1">Información de cancelación</p>
              <DetailLine label="Cancelado el" value={formatDate(row.cancelado_en)} />
              <DetailLine label="Cancelado por" value={row.cancelado_por} />
              <DetailLine label="Nota" value={row.cancelacion_nota} />
            </div>
          )}

          {row.ip_registro && (
            <div className="pt-2 border-t border-slate-800">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Auditoría</p>
              <DetailLine label="IP" value={row.ip_registro} />
              <DetailLine label="User-Agent" value={row.user_agent} />
              <DetailLine label="Referer" value={row.referer} />
              <DetailLine label="UTM Source" value={row.utm_source} />
              <DetailLine label="UTM Medium" value={row.utm_medium} />
              <DetailLine label="UTM Campaign" value={row.utm_campaign} />
            </div>
          )}

          {/* Actions section */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Acciones</p>

            {/* Resend email */}
            <div className="flex items-center gap-2">
              <form action={resendAction}>
                <input type="hidden" name="folio" value={row.folio} />
                <button
                  type="submit"
                  disabled={resendPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-md text-xs"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {resendPending ? "Enviando…" : "Reenviar email"}
                </button>
              </form>
              {resendState.message && (
                <span className={`text-xs ${resendState.ok ? "text-emerald-400" : "text-red-400"}`}>
                  {resendState.message}
                </span>
              )}
            </div>

            {/* Mark paid — only pendiente */}
            {row.estado_pago === "pendiente" && (
              <form action={markRegistroPaid} onSubmit={handleMarkPaid} className="flex items-center gap-2">
                <input type="hidden" name="folio" value={row.folio} />
                <input
                  type="text"
                  name="note"
                  value={paidNote}
                  onChange={(e) => setPaidNote(e.target.value)}
                  placeholder="Nota (opcional)"
                  maxLength={500}
                  className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-600/30 text-emerald-300 rounded-md text-xs whitespace-nowrap"
                >
                  <Check className="w-3.5 h-3.5" /> Marcar pagado
                </button>
              </form>
            )}

            {/* Cancel — pendiente or pagado */}
            {(row.estado_pago === "pendiente" || row.estado_pago === "pagado") && (
              <form action={markRegistroCancelled} onSubmit={handleMarkCancelled} className="flex items-center gap-2">
                <input type="hidden" name="folio" value={row.folio} />
                <input
                  type="text"
                  name="note"
                  value={cancelNote}
                  onChange={(e) => setCancelNote(e.target.value)}
                  placeholder="Nota (opcional)"
                  maxLength={500}
                  className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/30 border border-red-600/30 text-red-300 rounded-md text-xs whitespace-nowrap"
                >
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
              </form>
            )}

            {/* Revert paid → pendiente */}
            {row.estado_pago === "pagado" && (
              <form action={revertRegistroPendiente} onSubmit={handleRevert} className="flex items-center gap-2">
                <input type="hidden" name="folio" value={row.folio} />
                <input
                  type="text"
                  name="note"
                  value={revertNote}
                  onChange={(e) => setRevertNote(e.target.value)}
                  placeholder="Motivo (opcional)"
                  maxLength={500}
                  className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-600/30 text-amber-300 rounded-md text-xs whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Revertir a pendiente
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="flex justify-end px-4 py-3 border-t border-slate-800 bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-xs font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-slate-200">{value}</p>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string | null }) {
  return (
    <p className="text-xs text-slate-300">
      <span className="text-slate-500">{label}:</span> {value ?? "—"}
    </p>
  );
}
