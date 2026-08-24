"use client";

import { useActionState } from "react";
import { updateTicketOrder, type OrderUpdateState } from "@/app/admin/ordenes/actions";
import type { AdminTicketOrder } from "@/lib/admin/types";

const INITIAL_STATE: OrderUpdateState = {};

const ERROR_MESSAGES: Record<NonNullable<OrderUpdateState["error"]>, string> = {
  unauthorized: "Tu sesión expiró. Vuelve a iniciar sesión.",
  invalid:
    "Revisa los campos. Para marcar la factura como emitida necesitas el UUID fiscal completo.",
  not_found: "La orden ya no existe.",
  unavailable: "No pudimos guardar los cambios. Inténtalo de nuevo.",
};

/**
 * The panel's entire write surface for an order. Amounts, buyer data, fiscal
 * identifiers and payment state are submitted evidence and stay read-only.
 */
export default function TicketOrderOperationsForm({
  order,
}: {
  order: AdminTicketOrder;
}) {
  const [state, formAction, isPending] = useActionState(
    updateTicketOrder,
    INITIAL_STATE,
  );

  if (!order.requires_invoice) {
    return (
      <p className="text-sm text-slate-600">
        El comprador no solicitó CFDI para esta orden, así que no hay flujo de
        facturación que operar.
      </p>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="id" value={order.id} />

      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">Estado de la factura</span>
        <select
          name="invoiceStatus"
          defaultValue={
            order.invoice_status === "not_requested"
              ? "requested"
              : order.invoice_status
          }
          className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
        >
          <option value="requested">Solicitada</option>
          <option value="issued">Emitida</option>
          <option value="cancelled">Cancelada</option>
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">UUID fiscal del CFDI</span>
        <input
          type="text"
          name="cfdiUuid"
          defaultValue={order.cfdi_uuid ?? ""}
          placeholder="A1B2C3D4-E5F6-7890-ABCD-EF1234567890"
          spellCheck={false}
          className="rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
        />
        <span className="text-xs text-slate-500">
          Requerido para marcar la factura como emitida.
        </span>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">Responsable</span>
        <input
          type="text"
          name="owner"
          defaultValue={order.owner ?? ""}
          placeholder="nombre.apellido"
          className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">Notas internas</span>
        <textarea
          name="internalNotes"
          rows={4}
          defaultValue={order.internal_notes ?? ""}
          className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {isPending ? "Guardando..." : "Guardar"}
        </button>
        {state.saved ? (
          <p className="text-sm font-medium text-emerald-700" role="status">
            Cambios guardados.
          </p>
        ) : null}
        {state.error ? (
          <p className="text-sm font-medium text-red-700" role="alert">
            {ERROR_MESSAGES[state.error]}
          </p>
        ) : null}
      </div>
    </form>
  );
}
