import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MailSearch } from "lucide-react";
import RecuperarFolioForm from "./RecuperarFolioForm";

export const metadata: Metadata = {
  title: "Recuperar Folio · SC Security Summit 2026",
  description:
    "¿Perdiste tu folio de registro? Ingresa tu correo y nombre para recibirlo por email.",
  robots: { index: false, follow: false },
};

export default function RecuperarFolioPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Volver al inicio
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <MailSearch className="h-6 w-6 text-blue-600" aria-hidden="true" />
            </div>
            <h1 className="font-oswald text-2xl font-bold text-slate-900">Recuperar folio</h1>
            <p className="mt-2 text-sm text-slate-500">
              Ingresa tu correo y nombre para recibir tu folio de registro por email.
            </p>
          </div>

          <RecuperarFolioForm />

          <p className="mt-6 text-center text-xs text-slate-400">
            ¿Necesitas ayuda?{" "}
            <a
              href="mailto:hola@scsecuritysummit.com"
              className="text-blue-600 hover:underline"
            >
              hola@scsecuritysummit.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
