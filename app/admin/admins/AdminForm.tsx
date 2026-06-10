"use client";

import { useActionState } from "react";
import { Loader2, Plus, UserPlus } from "lucide-react";
import { createAdmin, type AdminCrudState } from "@/app/actions/admin";

const initialState: AdminCrudState = { ok: false, message: "" };

export default function AdminForm() {
  const [state, action, isPending] = useActionState(createAdmin, initialState);

  return (
    <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-md h-fit">
      <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-blue-400" />
        Nuevo administrador
      </h2>

      <form action={action} className="space-y-3">
        <div>
          <label htmlFor="admin-nombre" className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
            Nombre
          </label>
          <input
            id="admin-nombre"
            name="nombre"
            type="text"
            required
            placeholder="Juan Pérez"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="admin-email-new" className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
            Correo
          </label>
          <input
            id="admin-email-new"
            name="email"
            type="email"
            required
            placeholder="admin@empresa.com"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="admin-password-new" className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
            Contraseña
          </label>
          <input
            id="admin-password-new"
            name="password"
            type="password"
            required
            minLength={12}
            placeholder="Mínimo 12 caracteres"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
          />
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
              Crear administrador
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
