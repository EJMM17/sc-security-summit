"use client";

import { useActionState } from "react";
import { Loader2, Mail, User } from "lucide-react";
import { recuperarFolioAction, type RecuperarFolioState } from "@/app/actions/recuperar-folio";

const initialState: RecuperarFolioState = { submitted: false };

export default function RecuperarFolioForm() {
  const [state, action, isPending] = useActionState(recuperarFolioAction, initialState);

  if (state.submitted && !state.errors?._form) {
    return (
      <div
        role="status"
        className="rounded-xl border border-green-200 bg-green-50 p-6 text-center"
      >
        <p className="text-base font-semibold text-green-800">Solicitud recibida</p>
        <p className="mt-2 text-sm text-green-700">
          Si existe un registro con esos datos, recibirás un correo electrónico en los próximos
          minutos con tu folio de confirmación.
        </p>
        <p className="mt-3 text-xs text-green-600">
          Revisa también tu carpeta de spam si no ves el correo.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.errors?._form && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {state.errors._form[0]}
        </div>
      )}

      <div>
        <label htmlFor="rf-email" className="block text-sm font-medium text-slate-700 mb-1.5">
          Correo electrónico con el que te registraste
        </label>
        <div className="relative">
          <Mail
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="rf-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="tu@correo.com"
            aria-describedby={state.errors?.email ? "rf-email-error" : undefined}
            aria-invalid={!!state.errors?.email}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent aria-invalid:border-red-400"
          />
        </div>
        {state.errors?.email && (
          <p id="rf-email-error" className="mt-1 text-xs text-red-600">
            {state.errors.email[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="rf-nombre" className="block text-sm font-medium text-slate-700 mb-1.5">
          Nombre (como lo ingresaste al registrarte)
        </label>
        <div className="relative">
          <User
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="rf-nombre"
            name="nombre"
            type="text"
            required
            autoComplete="given-name"
            placeholder="Tu nombre"
            aria-describedby={state.errors?.nombre ? "rf-nombre-error" : undefined}
            aria-invalid={!!state.errors?.nombre}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent aria-invalid:border-red-400"
          />
        </div>
        {state.errors?.nombre && (
          <p id="rf-nombre-error" className="mt-1 text-xs text-red-600">
            {state.errors.nombre[0]}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 text-sm font-semibold transition-colors"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Buscando registro...
          </>
        ) : (
          "Recuperar folio"
        )}
      </button>
    </form>
  );
}
