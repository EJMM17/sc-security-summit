import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle, CreditCard, FileText, Landmark, Store } from "lucide-react";

import CopyButton from "@/components/CopyButton";
import { crearOrdenPago, type MetodoPago } from "@/app/actions/crear-orden-pago";
import { supabaseAdmin } from "@/lib/supabase";
import { features } from "@/env";

export const metadata: Metadata = {
  title: "Pago · SC Security Summit 2026",
  robots: { index: false, follow: false },
};

const METODO_LABEL: Record<MetodoPago, string> = {
  spei: "SPEI",
  oxxo: "OXXO",
  tarjeta: "Tarjeta crédito/débito",
  transferencia_manual: "Transferencia manual",
};

const formatMxn = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(n);

const formatDateTime = (iso: string | null | undefined) =>
  iso
    ? new Intl.DateTimeFormat("es-MX", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "America/Monterrey",
      }).format(new Date(iso))
    : "—";

type SearchParams = { folio?: string; error?: string };

export default async function PagoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { folio, error } = await searchParams;
  if (!folio) notFound();

  const { data: registro } = await supabaseAdmin
    .from("registros")
    .select("*")
    .eq("folio", folio)
    .single();

  if (!registro) notFound();

  if (registro.estado_pago === "pagado") {
    redirect(`/registro-exitoso?folio=${encodeURIComponent(folio)}`);
  }

  const metodo: MetodoPago | null = (registro.metodo_pago as MetodoPago) ?? null;

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">
            SC Security Summit 2026
          </p>
          <h1 className="mt-2 font-oswald text-3xl font-bold text-slate-900 sm:text-4xl">
            Completa tu pago
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Folio{" "}
            <span className="font-mono font-semibold text-slate-900">{registro.folio}</span> ·{" "}
            {registro.nombre} {registro.apellido}
          </p>
        </header>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
            <AlertTriangle className="h-5 w-5 mt-0.5" aria-hidden="true" />
            <p className="text-sm">
              No pudimos completar el pago. Intenta otro método o contáctanos.
            </p>
          </div>
        )}

        {/* Resumen */}
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-slate-500">Tipo de acceso</dt>
            <dd className="text-right font-semibold text-slate-900">
              {String(registro.tipo_acceso).toUpperCase()}
            </dd>
            <dt className="text-slate-500">Monto</dt>
            <dd className="text-right font-semibold text-slate-900">
              {formatMxn(Number(registro.monto_mxn))}
            </dd>
            <dt className="text-slate-500">Estado</dt>
            <dd className="text-right">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-800">
                {registro.estado_pago}
              </span>
            </dd>
          </dl>
        </section>

        {/* Bloque por método */}
        {metodo === "spei" && registro.spei_clabe ? (
          <section className="mb-8 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Landmark className="h-5 w-5 text-cyan-600" aria-hidden="true" />
              Transferencia SPEI
            </h2>
            <p className="text-sm text-slate-600">
              Realiza la transferencia desde tu app bancaria con los siguientes datos.
              El pago se confirma automáticamente en minutos.
            </p>
            <div className="space-y-3 rounded-lg bg-slate-50 p-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  CLABE
                </div>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <code className="font-mono text-base font-semibold text-slate-900">
                    {registro.spei_clabe}
                  </code>
                  <CopyButton value={registro.spei_clabe} />
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Referencia
                </div>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <code className="font-mono text-base font-semibold text-slate-900">
                    {registro.spei_reference ?? "—"}
                  </code>
                  {registro.spei_reference && <CopyButton value={registro.spei_reference} />}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Beneficiario
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">STP / Conekta</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Importe exacto
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {formatMxn(Number(registro.monto_mxn))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {metodo === "oxxo" && registro.oxxo_barcode_url ? (
          <section className="mb-8 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Store className="h-5 w-5 text-rose-600" aria-hidden="true" />
              Pago en OXXO
            </h2>
            <p className="text-sm text-slate-600">
              Presenta este código en cualquier tienda OXXO. El pago se confirma en
              24-48 horas.
            </p>
            <div className="flex justify-center rounded-lg bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={registro.oxxo_barcode_url}
                alt="Código de barras OXXO"
                className="h-24 w-auto"
              />
            </div>
            {registro.oxxo_expires_at && (
              <p className="text-center text-xs text-slate-500">
                Vence: {formatDateTime(registro.oxxo_expires_at)}
              </p>
            )}
          </section>
        ) : null}

        {metodo === "tarjeta" && registro.conekta_checkout_url ? (
          <section className="mb-8 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <CreditCard className="h-5 w-5 text-blue-600" aria-hidden="true" />
              Pago con tarjeta
            </h2>
            <p className="text-sm text-slate-600">
              Continúa al checkout seguro de Conekta para completar el pago.
            </p>
            <a
              href={registro.conekta_checkout_url}
              className="block w-full rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-blue-700"
            >
              Ir al pago seguro →
            </a>
          </section>
        ) : null}

        {metodo === "transferencia_manual" || !features.conekta ? (
          <section className="mb-8 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <FileText className="h-5 w-5 text-slate-600" aria-hidden="true" />
              Transferencia manual
            </h2>
            <p className="text-sm text-slate-600">
              Un representante te contactará en 24-48 horas hábiles con las
              instrucciones de pago. También puedes escribirnos directamente.
            </p>
            <a
              href={`mailto:hola@scsecuritysummit.com.mx?subject=Pago folio ${registro.folio}`}
              className="block w-full rounded-lg border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Contactar al organizador
            </a>
          </section>
        ) : null}

        {/* Selector / cambio de método */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">
            {metodo ? "Cambiar método de pago" : "Elige un método de pago"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Selecciona la opción que prefieras. Procesamiento seguro vía Conekta.
          </p>
          <form action={crearOrdenPago} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="folio" value={registro.folio} />
            <MetodoOption
              value="spei"
              icon={<Landmark className="h-5 w-5" aria-hidden="true" />}
              title={METODO_LABEL.spei}
              hint="Transferencia · confirmación en minutos"
              disabled={!features.conekta}
            />
            <MetodoOption
              value="tarjeta"
              icon={<CreditCard className="h-5 w-5" aria-hidden="true" />}
              title={METODO_LABEL.tarjeta}
              hint="Crédito o débito · checkout seguro"
              disabled={!features.conekta}
            />
            <MetodoOption
              value="oxxo"
              icon={<Store className="h-5 w-5" aria-hidden="true" />}
              title={METODO_LABEL.oxxo}
              hint="Efectivo en tienda · 24–48h"
              disabled={!features.conekta}
            />
            <MetodoOption
              value="transferencia_manual"
              icon={<FileText className="h-5 w-5" aria-hidden="true" />}
              title={METODO_LABEL.transferencia_manual}
              hint="El organizador te contactará"
            />
          </form>
        </section>

        <div className="mt-8 text-center text-sm text-slate-500">
          <Link href="/" className="text-blue-600 hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}

function MetodoOption({
  value,
  icon,
  title,
  hint,
  disabled,
}: {
  value: MetodoPago;
  icon: React.ReactNode;
  title: string;
  hint: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      name="metodo_pago"
      value={value}
      disabled={disabled}
      className="group flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left transition-all hover:border-blue-400 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-semibold text-slate-900">{title}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>
      </span>
    </button>
  );
}
