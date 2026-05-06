"use client";

import { useState, useTransition } from "react";
import { Check, X, Eye, ExternalLink, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { markRegistroCancelled, markRegistroPaid } from "@/app/actions/admin";
import { reenviarInstrucciones } from "@/app/actions/reenviar-instrucciones";
import type { RegistroRow as RegistroRowData } from "./page";
import RegistroDetail from "./RegistroDetail";

const METODO_LABEL: Record<NonNullable<RegistroRowData["metodo_pago"]>, string> = {
  spei: "SPEI",
  tarjeta: "Tarjeta",
  oxxo: "OXXO",
  transferencia_manual: "Manual",
};

const CONEKTA_TONE: Record<
  NonNullable<RegistroRowData["conekta_payment_status"]>,
  string
> = {
  pending: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  paid: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  expired: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  canceled: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  failed: "bg-red-500/10 text-red-300 border-red-500/30",
};

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
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleString("es-MX", {
    timeZone: "America/Monterrey",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function RegistroRow({ row }: { row: RegistroRowData }) {
  const [showDetail, setShowDetail] = useState(false);
  const [showNote, setShowNote] = useState<"paid" | "cancelled" | null>(null);
  const [note, setNote] = useState("");
  const [pendingResend, startResend] = useTransition();

  const conektaUrl = row.conekta_order_id
    ? `https://panel.conekta.com/dashboard/order/${row.conekta_order_id}`
    : null;

  const handleResend = () => {
    if (!confirm(`¿Reenviar instrucciones de pago a ${row.email}?`)) return;
    startResend(async () => {
      const result = await reenviarInstrucciones(row.folio);
      if (result.ok) {
        toast.success("Reenviado", { description: result.message });
      } else {
        toast.error("Error", { description: result.message });
      }
    });
  };

  const handleMarkPaid = (e: React.FormEvent<HTMLFormElement>) => {
    if (
      !confirm(
        `¿Confirmar el pago del folio ${row.folio} por ${formatMxn(row.monto_mxn)}?`,
      )
    ) {
      e.preventDefault();
    }
  };

  return (
    <>
      <tr className="border-t border-slate-800 hover:bg-slate-900/50">
        <td className="px-3 py-2 font-mono text-[11px]">{row.folio}</td>
        <td className="px-3 py-2">
          {row.nombre} {row.apellido}
        </td>
        <td className="px-3 py-2 text-slate-300">
          <a className="hover:text-blue-300" href={`mailto:${row.email}`}>
            {row.email}
          </a>
        </td>
        <td className="px-3 py-2 text-slate-300">
          <div>{row.empresa}</div>
          <div className="text-[10px] text-slate-500">{row.cargo}</div>
        </td>
        <td className="px-3 py-2">{TIER_LABEL[row.tipo_acceso]}</td>
        <td className="px-3 py-2 text-right tabular-nums">{formatMxn(row.monto_mxn)}</td>
        <td className="px-3 py-2">
          <span
            className={`inline-block px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border rounded ${ESTADO_TONE[row.estado_pago]}`}
          >
            {row.estado_pago}
          </span>
        </td>
        <td className="px-3 py-2 text-slate-300">
          {row.metodo_pago ? METODO_LABEL[row.metodo_pago] : "—"}
        </td>
        <td className="px-3 py-2 text-slate-300">
          {row.conekta_payment_status ? (
            <span
              className={`inline-block px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border rounded ${CONEKTA_TONE[row.conekta_payment_status]}`}
            >
              {row.conekta_payment_status}
            </span>
          ) : (
            <span className="text-slate-600">—</span>
          )}
          {conektaUrl && (
            <a
              href={conektaUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir en Conekta"
              className="inline-flex items-center ml-1.5 text-slate-400 hover:text-blue-300"
            >
              <ExternalLink className="w-3 h-3" aria-label="Abrir en Conekta" />
            </a>
          )}
        </td>
        <td className="px-3 py-2 text-slate-300">
          {row.requiere_cfdi ? <span title={row.rfc ?? ""}>Sí · {row.rfc ?? "—"}</span> : "—"}
        </td>
        <td className="px-3 py-2 text-slate-400 text-[11px]">{formatDate(row.created_at)}</td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowDetail(true)}
              title="Ver detalle"
              className="inline-flex items-center justify-center w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <Eye className="w-3.5 h-3.5" aria-label="Ver detalle" />
            </button>

            {row.estado_pago === "pendiente" && (
              <>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={pendingResend}
                  title="Reenviar instrucciones de pago"
                  className="inline-flex items-center justify-center w-7 h-7 rounded bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 disabled:opacity-50"
                >
                  {pendingResend ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mail className="w-3.5 h-3.5" aria-label="Reenviar instrucciones" />
                  )}
                </button>
                {showNote === "paid" ? (
                  <form action={markRegistroPaid} onSubmit={handleMarkPaid} className="flex items-center gap-1">
                    <input type="hidden" name="folio" value={row.folio} />
                    <input type="hidden" name="note" value={note} />
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Nota (opcional)"
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
                    <button
                      type="button"
                      onClick={() => { setShowNote(null); setNote(""); }}
                      className="inline-flex items-center justify-center w-7 h-7 rounded bg-slate-700/40 hover:bg-slate-700 text-slate-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNote("paid")}
                    title="Marcar pagado"
                    className="inline-flex items-center justify-center w-7 h-7 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300"
                  >
                    <Check className="w-3.5 h-3.5" aria-label="Marcar pagado" />
                  </button>
                )}

                {showNote === "cancelled" ? (
                  <form action={markRegistroCancelled} className="flex items-center gap-1">
                    <input type="hidden" name="folio" value={row.folio} />
                    <input type="hidden" name="note" value={note} />
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Nota (opcional)"
                      className="w-24 px-2 py-1 text-[10px] bg-slate-900 border border-slate-700 rounded text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      title="Confirmar cancelar"
                      className="inline-flex items-center justify-center w-7 h-7 rounded bg-red-600/20 hover:bg-red-600/40 text-red-300"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowNote(null); setNote(""); }}
                      className="inline-flex items-center justify-center w-7 h-7 rounded bg-slate-700/40 hover:bg-slate-700 text-slate-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNote("cancelled")}
                    title="Cancelar"
                    className="inline-flex items-center justify-center w-7 h-7 rounded bg-slate-700/40 hover:bg-slate-700 text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" aria-label="Cancelar" />
                  </button>
                )}
              </>
            )}
          </div>
        </td>
      </tr>

      {showDetail && <RegistroDetail row={row} onClose={() => setShowDetail(false)} />}
    </>
  );
}
