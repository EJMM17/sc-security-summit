"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <AlertTriangle
          className="mx-auto h-14 w-14 text-amber-500"
          aria-hidden="true"
          strokeWidth={1.5}
        />
        <h1 className="mt-4 font-oswald text-2xl font-bold text-slate-900 sm:text-3xl">
          Algo salió mal
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Ocurrió un error inesperado. Nuestro equipo fue notificado automáticamente.
          Intenta de nuevo en unos segundos.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-slate-400">ref: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="flex-1 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-blue-700"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="flex-1 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
