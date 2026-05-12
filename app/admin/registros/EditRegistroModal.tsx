"use client";

import { useActionState } from "react";
import { X } from "lucide-react";
import { updateRegistro, type UpdateRegistroState } from "@/app/actions/admin";
import type { RegistroRow } from "./page";

const init: UpdateRegistroState = { ok: false, message: "" };

export default function EditRegistroModal({
  row,
  onClose,
}: {
  row: RegistroRow;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(updateRegistro, init);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h2 className="text-sm font-semibold">Editar registro</h2>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-slate-800 text-slate-400"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form action={action} className="p-4 space-y-3">
          <input type="hidden" name="folio" value={row.folio} />

          <p className="text-[10px] text-slate-500 font-mono">
            {row.folio}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre" name="nombre" defaultValue={row.nombre} required />
            <Field label="Apellido" name="apellido" defaultValue={row.apellido} required />
          </div>
          <Field label="Empresa" name="empresa" defaultValue={row.empresa} required />
          <Field label="Cargo" name="cargo" defaultValue={row.cargo} required />
          <Field label="Teléfono" name="telefono" defaultValue={row.telefono ?? ""} />
          <Field label="Método de pago" name="metodo_pago" defaultValue={row.metodo_pago ?? ""} />

          {state.message && (
            <p
              className={`text-xs px-3 py-2 rounded-md border ${
                state.ok
                  ? "bg-emerald-950/40 border-emerald-700/40 text-emerald-300"
                  : "bg-red-950/40 border-red-700/40 text-red-300"
              }`}
            >
              {state.message}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-md text-xs font-medium"
            >
              {pending ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </label>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
      />
    </div>
  );
}
