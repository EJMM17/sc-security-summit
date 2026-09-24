import Link from "next/link";
import { Compass } from "lucide-react";
import { getRequestLanguage } from "@/lib/language";

const COPY = {
  es: {
    title: "Página no encontrada",
    body: "La página que buscas no existe o fue movida.",
    home: "Ir al inicio",
    href: "/",
  },
  en: {
    title: "Page not found",
    body: "The page you are looking for does not exist or has moved.",
    home: "Go to home",
    href: "/?lang=en",
  },
} as const;

export default async function NotFound() {
  // Same language the root layout declared, so the page and the cookie notice
  // above it never disagree.
  const t = COPY[await getRequestLanguage()];

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
          {t.title}
        </h1>
        <p className="mt-3 text-sm text-slate-600">{t.body}</p>
        <div className="mt-6">
          <Link
            href={t.href}
            className="inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-blue-700"
          >
            {t.home}
          </Link>
        </div>
      </div>
    </main>
  );
}
