"use client";

import { useActionState } from "react";
import { Loader2, Plus, TicketPercent } from "lucide-react";
import { createCodigo, type CodigoCrudState } from "@/app/actions/codigos";

const initialState: CodigoCrudState = { ok: false, message: "" };

const inputClass =
  "w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500";

const labelClass = "block text-[10px] uppercase tracking-wider text-slate-500 mb-1";

export default function CodigoForm() {
  const [state, action, isPending] = useActionState(createCodigo, initialState);

  return (
    <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-md h-fit">
      <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <TicketPercent className="w-4 h-4 text-blue-400" />
        Nuevo código de descuento
      </h2>

      <form action={action} className="space-y-3">
        <div>
          <label htmlFor="codigo-nuevo" className={labelClass}>
            Código
          </label>
          <input
            id="codigo-nuevo"
            name="codigo"
            type="text"
            required
            minLength={4}
            maxLength={32}
            pattern="[A-Za-z0-9_\-]{4,32}"
            placeholder="SUMMIT-2026"
            autoComplete="off"
            className={`${inputClass} uppercase placeholder:normal-case`}
          />
          <p className="text-[10px] text-slate-600 mt-1">
            4–32 caracteres: letras, números, guion y guion bajo.
          </p>
        </div>

        <div>
          <label htmlFor="codigo-descripcion" className={labelClass}>
            Descripción (interna)
          </label>
          <input
            id="codigo-descripcion"
            name="descripcion"
            type="text"
            maxLength={300}
            placeholder="Ej. Cortesía patrocinadores"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="codigo-tipo" className={labelClass}>
              Tipo
            </label>
            <select id="codigo-tipo" name="tipo_descuento" className={inputClass} defaultValue="porcentaje">
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="monto_fijo">Monto fijo (MXN)</option>
            </select>
          </div>
          <div>
            <label htmlFor="codigo-valor" className={labelClass}>
              Valor
            </label>
            <input
              id="codigo-valor"
              name="valor"
              type="number"
              required
              min={1}
              step="0.01"
              placeholder="20"
              className={inputClass}
            />
          </div>
        </div>

        <fieldset>
          <legend className={labelClass}>Aplica a (ninguno = todos)</legend>
          <div className="flex gap-4">
            {(
              [
                ["estudiante", "Estudiante"],
                ["general", "General"],
                ["vip", "VIP"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-1.5 text-xs text-slate-300">
                <input
                  type="checkbox"
                  name={`aplica_${value}`}
                  className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-950 text-blue-600"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="codigo-max-usos" className={labelClass}>
              Máx. usos (vacío = ∞)
            </label>
            <input
              id="codigo-max-usos"
              name="max_usos"
              type="number"
              min={1}
              step={1}
              placeholder="50"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="codigo-vigencia" className={labelClass}>
              Vence (vacío = nunca)
            </label>
            <input id="codigo-vigencia" name="valido_hasta" type="date" className={inputClass} />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-2 rounded-md text-xs font-medium transition-colors"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Creando...
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              Crear código
            </>
          )}
        </button>

        {state.message && (
          <p role="status" className={`text-xs ${state.ok ? "text-emerald-400" : "text-red-400"}`}>
            {state.message}
          </p>
        )}
      </form>
    </div>
  );
}
