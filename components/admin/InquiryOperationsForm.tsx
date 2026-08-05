"use client";

import { useActionState } from "react";
import { updateInquiry, type UpdateState } from "@/app/admin/actions";
import { STATUS_LABELS, toDateTimeLocalValue } from "@/lib/admin/labels";
import {
  INQUIRY_STATUSES,
  type AdminInquiry,
} from "@/lib/admin/types";

const MESSAGES: Record<NonNullable<UpdateState["error"]>, string> = {
  invalid:
    "Revisa los campos. El responsable admite solo minúsculas, números y - _ . :",
  unavailable: "No se pudo guardar. Vuelve a intentarlo.",
};

export default function InquiryOperationsForm({
  inquiry,
}: {
  inquiry: AdminInquiry;
}) {
  const [state, formAction, pending] = useActionState<UpdateState, FormData>(
    updateInquiry,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={inquiry.id} />

      <div>
        <label
          htmlFor="status"
          className="block text-sm font-medium text-slate-700"
        >
          Estado
        </label>
        <select
          id="status"
          name="status"
          defaultValue={inquiry.status}
          className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
        >
          {INQUIRY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="owner"
          className="block text-sm font-medium text-slate-700"
        >
          Responsable
        </label>
        <input
          id="owner"
          name="owner"
          defaultValue={inquiry.owner ?? ""}
          placeholder="ventas-01"
          pattern="[a-z0-9_.:\-]*"
          maxLength={160}
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
        />
        <p className="mt-1 text-xs text-slate-500">
          Identificador corto, sin espacios ni datos de contacto.
        </p>
      </div>

      <div>
        <label
          htmlFor="nextFollowUpAt"
          className="block text-sm font-medium text-slate-700"
        >
          Próximo seguimiento
        </label>
        <input
          id="nextFollowUpAt"
          name="nextFollowUpAt"
          type="datetime-local"
          defaultValue={toDateTimeLocalValue(inquiry.next_follow_up_at)}
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
        />
      </div>

      <div>
        <label
          htmlFor="internalNotes"
          className="block text-sm font-medium text-slate-700"
        >
          Notas internas
        </label>
        <textarea
          id="internalNotes"
          name="internalNotes"
          rows={5}
          maxLength={5000}
          defaultValue={inquiry.internal_notes ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
        />
        <p className="mt-1 text-xs text-slate-500">
          Nota operativa breve. No copies datos personales innecesarios.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
        {state.ok ? (
          <span role="status" className="text-sm text-emerald-700">
            Cambios guardados.
          </span>
        ) : null}
        {state.error ? (
          <span role="alert" className="text-sm text-red-600">
            {MESSAGES[state.error]}
          </span>
        ) : null}
      </div>
    </form>
  );
}
