import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, CheckCircle2, Clock, MapPin, MessageCircle } from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Registro confirmado · SC Security Summit 2026",
  robots: { index: false, follow: false },
};

const formatMxn = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(n);

// Google Calendar event link (Sept 24 2026, 8:00 AM CT, Reynosa).
function calendarUrl(folio: string): string {
  const base = "https://www.google.com/calendar/render?action=TEMPLATE";
  const params = new URLSearchParams({
    text: "SC Security Summit 2026",
    dates: "20260924T130000Z/20260924T230000Z", // 8AM-6PM CT in UTC
    details: `Folio: ${folio}\nCentro de Convenciones de Reynosa.`,
    location: "Centro de Convenciones de Reynosa, Tamaulipas, México",
  });
  return `${base}&${params.toString()}`;
}

const WHATSAPP_URL =
  "https://wa.me/19565158070?text=" +
  encodeURIComponent("Hola, tengo una pregunta sobre mi registro al SC Security Summit 2026.");

export default async function RegistroExitosoPage({
  searchParams,
}: {
  searchParams: Promise<{ folio?: string }>;
}) {
  const { folio } = await searchParams;
  if (!folio) notFound();

  const { data: registro } = await supabaseAdmin
    .from("registros")
    .select("*")
    .eq("folio", folio)
    .single();

  if (!registro) notFound();

  const isPaid = registro.estado_pago === "pagado";
  const statusLabel = isPaid ? "Pagado" : "Pendiente de pago";
  const statusClass = isPaid
    ? "bg-green-100 text-green-800"
    : "bg-amber-100 text-amber-800";

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-col items-center text-center">
            <CheckCircle2
              className="h-16 w-16 text-green-500"
              aria-hidden="true"
              strokeWidth={1.5}
            />
            <h1 className="mt-4 font-oswald text-3xl font-bold text-slate-900 sm:text-4xl">
              {isPaid ? "¡Pago confirmado!" : "¡Registro confirmado!"}
            </h1>
            <p className="mt-2 max-w-md text-sm text-slate-600">
              {isPaid
                ? "Tu lugar en el SC Security Summit 2026 está asegurado. Te enviamos los detalles a tu correo."
                : "Recibimos tu registro. Completa tu pago para asegurar tu lugar."}
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Folio
              </dt>
              <dd className="mt-1 font-mono text-base font-semibold text-slate-900">
                {registro.folio}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Estado
              </dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${statusClass}`}
                >
                  {statusLabel}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tipo de acceso
              </dt>
              <dd className="mt-1 text-base font-semibold text-slate-900">
                {String(registro.tipo_acceso).toUpperCase()}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Monto
              </dt>
              <dd className="mt-1 text-base font-semibold text-slate-900">
                {formatMxn(Number(registro.monto_mxn))}
              </dd>
            </div>
          </dl>

          <div className="mt-8 space-y-3 border-t border-slate-200 pt-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              El día del evento
            </h2>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 text-slate-400" aria-hidden="true" />
                24 de septiembre, 2026
              </li>
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 text-slate-400" aria-hidden="true" />
                8:00 AM — 5:30 PM
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-slate-400" aria-hidden="true" />
                Centro de Convenciones de Reynosa, Tamaulipas
              </li>
            </ul>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {!isPaid && (
              <Link
                href={`/pago?folio=${encodeURIComponent(registro.folio)}`}
                className="flex-1 rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-blue-700"
              >
                Completar pago
              </Link>
            )}
            <a
              href={calendarUrl(registro.folio)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Agregar al calendario
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-green-500 bg-green-50 px-5 py-3 text-center text-sm font-semibold text-green-700 transition-colors hover:bg-green-100"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="text-blue-600 hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
