import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import TicketOrderOperationsForm from "@/components/admin/TicketOrderOperationsForm";
import { hasAdminSession } from "@/lib/admin/auth";
import {
  formatDateTime,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_STYLES,
  NOTIFICATION_LABELS,
  NOTIFICATION_STYLES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  TIER_LABELS,
} from "@/lib/admin/labels";
import { formatMxn, formatTaxRate } from "@/lib/payments/tax";
import {
  getInvoiceDetails,
  getTicketOrder,
  listOrderNotifications,
} from "@/server/repositories/admin-ticket-order-repository";

export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value}</dd>
    </div>
  );
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await hasAdminSession())) redirect("/admin/login");

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  const order = await getTicketOrder(id);
  if (!order) notFound();

  const [invoice, notifications] = await Promise.all([
    order.requires_invoice ? getInvoiceDetails(id) : Promise.resolve(null),
    listOrderNotifications(id),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/admin/ordenes"
        className="text-sm text-blue-700 underline-offset-2 hover:underline"
      >
        ← Todas las órdenes
      </Link>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {order.buyer_name}
          </h1>
          <p className="mt-1 font-mono text-xs text-slate-500">{order.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${ORDER_STATUS_STYLES[order.status]}`}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${INVOICE_STATUS_STYLES[order.invoice_status]}`}
          >
            CFDI: {INVOICE_STATUS_LABELS[order.invoice_status]}
          </span>
        </div>
      </header>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Compra</h2>
        <dl className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label="Acceso" value={TIER_LABELS[order.tier]} />
          <Field label="Cantidad" value={String(order.quantity)} />
          <Field label="Idioma" value={order.language.toUpperCase()} />
          <Field
            label="Subtotal"
            value={formatMxn(order.subtotal_cents, "es")}
          />
          <Field
            label={`IVA ${formatTaxRate(order.tax_rate_basis_points)}`}
            value={formatMxn(order.tax_cents, "es")}
          />
          <Field
            label="Total cobrado"
            value={`${formatMxn(order.total_cents, "es")} MXN`}
          />
        </dl>
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Comprador</h2>
        <dl className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label="Correo" value={order.email} />
          <Field label="Teléfono" value={order.phone} />
          <Field label="Empresa" value={order.company ?? "—"} />
        </dl>
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Pago</h2>
        <dl className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label="Proveedor" value="MercadoPago" />
          <Field label="ID de pago" value={order.provider_payment_id ?? "—"} />
          <Field label="Estado del proveedor" value={order.provider_status ?? "—"} />
          <Field label="Pagada" value={formatDateTime(order.paid_at)} />
          <Field label="Creada" value={formatDateTime(order.created_at)} />
          <Field label="Retención hasta" value={order.retention_until} />
        </dl>
      </section>

      {order.requires_invoice ? (
        <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Datos fiscales
          </h2>
          {invoice ? (
            <dl className="mt-3 grid gap-4 sm:grid-cols-3">
              <Field label="RFC" value={invoice.rfc} />
              <Field
                label="Tipo de persona"
                value={invoice.person_type === "moral" ? "Moral" : "Física"}
              />
              <Field label="Razón social" value={invoice.legal_name} />
              <Field label="Régimen fiscal" value={invoice.tax_regime} />
              <Field label="Uso del CFDI" value={invoice.cfdi_use} />
              <Field label="Código postal" value={invoice.postal_code} />
              <Field
                label="Correo de facturación"
                value={invoice.billing_email ?? order.email}
              />
              <Field label="UUID del CFDI" value={order.cfdi_uuid ?? "—"} />
              <Field label="Emitida" value={formatDateTime(order.invoiced_at)} />
            </dl>
          ) : (
            <p className="mt-2 text-sm text-slate-700">
              La orden pide CFDI pero no tiene datos fiscales almacenados.
              Escala esto: es una inconsistencia, no un caso normal.
            </p>
          )}
        </section>
      ) : null}

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Correos</h2>
        {notifications.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            Sin correos en cola. Sólo se generan cuando la orden queda pagada.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className="flex flex-wrap items-center gap-3 text-sm"
              >
                <span className="font-mono text-xs text-slate-600">
                  {notification.template}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${NOTIFICATION_STYLES[notification.status]}`}
                >
                  {NOTIFICATION_LABELS[notification.status]}
                </span>
                <span className="text-xs text-slate-500">
                  Intentos: {notification.attempt_count}
                </span>
                {notification.sent_at ? (
                  <span className="text-xs text-slate-500">
                    Enviado {formatDateTime(notification.sent_at)}
                  </span>
                ) : null}
                {notification.last_error_code ? (
                  <span className="font-mono text-xs text-red-700">
                    {notification.last_error_code}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Operación</h2>
        <div className="mt-3">
          <TicketOrderOperationsForm order={order} />
        </div>
      </section>
    </div>
  );
}
