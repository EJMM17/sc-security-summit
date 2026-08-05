"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/actions";

const MESSAGES: Record<NonNullable<LoginState["error"]>, string> = {
  invalid: "Contraseña incorrecta.",
  rate_limited: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
  unavailable: "El panel no está disponible en este momento.",
};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="admin-password"
          className="block text-sm font-medium text-slate-700"
        >
          Contraseña de operación
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {MESSAGES[state.error]}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
