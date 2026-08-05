"use client";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 text-center">
      <h1 className="text-xl font-bold text-slate-900">
        No se pudo cargar el panel
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        La base de datos no respondió. Las solicitudes recibidas no se pierden
        por esto: se conservan en Supabase y el envío de correos se reintenta
        solo.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mx-auto mt-6 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
      >
        Reintentar
      </button>
    </main>
  );
}
