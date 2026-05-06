import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Compass
          className="mx-auto h-14 w-14 text-slate-400"
          aria-hidden="true"
          strokeWidth={1.5}
        />
        <p className="mt-4 font-mono text-xs font-bold uppercase tracking-widest text-slate-400">
          404
        </p>
        <h1 className="mt-2 font-oswald text-2xl font-bold text-slate-900 sm:text-3xl">
          Página no encontrada
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          La página que buscas no existe o fue movida.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="flex-1 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-blue-700"
          >
            Ir al inicio
          </Link>
          <Link
            href="/recuperar-folio"
            className="flex-1 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Recuperar folio
          </Link>
        </div>
      </div>
    </main>
  );
}
