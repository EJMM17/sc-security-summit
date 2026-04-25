"use client";

import { useActionState } from "react";
import { Loader2, Mail } from "lucide-react";
import { requestAdminLogin, type LoginState } from "@/app/actions/admin";

const initialState: LoginState = { ok: false, message: "" };

export default function AdminLoginForm() {
  const [state, action, isPending] = useActionState(requestAdminLogin, initialState);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="admin-email" className="block text-xs font-medium text-slate-400 mb-1.5">
          Correo del operador
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="operador@empresa.com"
          className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-2.5 rounded-md text-sm font-medium transition-colors"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Enviando...
          </>
        ) : (
          <>
            <Mail className="w-4 h-4" aria-hidden="true" />
            Enviar link de acceso
          </>
        )}
      </button>

      {state.message && (
        <p
          role="status"
          className={`text-sm ${state.ok ? "text-emerald-400" : "text-red-400"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
