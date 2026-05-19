"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function AdminError({
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
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-900/40">
          <AlertTriangle className="h-7 w-7 text-red-400" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Error en el panel</h1>
        <p className="text-sm text-slate-400 mb-6">
          Ocurrió un error inesperado. El equipo fue notificado automáticamente.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-slate-500 mb-5">ref: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Reintentar
          </button>
          <Link
            href="/admin/registros"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
