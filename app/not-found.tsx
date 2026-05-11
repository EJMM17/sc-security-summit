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
        <div className="mt-6">
          <Link
            href="/"
            className="inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-blue-700"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
