"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error.tsx]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-slate-50">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Algo salió mal</h1>
        <p className="text-slate-600 mb-6">
          Intenta recargar la página. Si el problema persiste, escríbenos a{" "}
          <a href="mailto:Contacto@LanzLogistics.com" className="text-blue-600 hover:underline">
            Contacto@LanzLogistics.com
          </a>.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
