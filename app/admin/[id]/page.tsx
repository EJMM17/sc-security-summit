import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import InquiryOperationsForm from "@/components/admin/InquiryOperationsForm";
import { hasAdminSession } from "@/lib/admin/auth";
import {
  formatDateTime,
  KIND_LABELS,
  NOTIFICATION_LABELS,
  NOTIFICATION_STYLES,
  STATUS_LABELS,
  STATUS_STYLES,
} from "@/lib/admin/labels";
import { getInquiry } from "@/server/repositories/admin-inquiry-repository";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm break-words text-slate-900 sm:col-span-2 sm:mt-0">
        {children}
      </dd>
    </div>
  );
}

export default async function AdminInquiryDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await hasAdminSession())) redirect("/admin/login");

  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const inquiry = await getInquiry(id);
  if (!inquiry) notFound();

  const notification = inquiry.notification;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/admin"
        className="text-sm text-blue-700 underline-offset-2 hover:underline"
      >
        ← Volver a solicitudes
      </Link>

      <header className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{inquiry.company}</h1>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[inquiry.status]}`}
        >
          {STATUS_LABELS[inquiry.status]}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
          {KIND_LABELS[inquiry.kind]}
        </span>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Datos enviados
          </h2>
          <dl className="mt-2">
            <Field label="Contacto">{inquiry.contact_name}</Field>
            <Field label="Correo">
              <a
                href={`mailto:${inquiry.email}`}
                className="text-blue-700 underline-offset-2 hover:underline"
              >
                {inquiry.email}
              </a>
            </Field>
            <Field label="Teléfono">
              <a
                href={`tel:${inquiry.phone.replace(/\s/g, "")}`}
                className="text-blue-700 underline-offset-2 hover:underline"
              >
                {inquiry.phone}
              </a>
            </Field>
            {inquiry.kind === "corporate" ? (
              <>
                <Field label="Cargo">{inquiry.job_title ?? "—"}</Field>
                <Field label="Accesos solicitados">
                  {inquiry.requested_seats ?? "—"}
                </Field>
                <Field label="Participantes">
                  {inquiry.attendees.length > 0 ? (
                    <ol className="list-decimal space-y-0.5 pl-4">
                      {inquiry.attendees.map((name, index) => (
                        <li key={`${index}-${name}`}>{name}</li>
                      ))}
                    </ol>
                  ) : (
                    "—"
                  )}
                </Field>
              </>
            ) : (
              <Field label="Interés">{inquiry.interest ?? "—"}</Field>
            )}
            <Field label="Idioma">{inquiry.language.toUpperCase()}</Field>
            <Field label="Recibida">{formatDateTime(inquiry.created_at)}</Field>
            <Field label="Consentimiento">
              {inquiry.consent_version} · {formatDateTime(inquiry.consented_at)}
            </Field>
            <Field label="Retención hasta">{inquiry.retention_until}</Field>
          </dl>
          <p className="mt-4 text-xs text-slate-500">
            Los datos enviados por la persona no se editan. Si un dato de
            contacto es incorrecto, documéntalo en las notas internas y conserva
            el original.
          </p>
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Gestión
            </h2>
            <div className="mt-4">
              <InquiryOperationsForm inquiry={inquiry} />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Notificación por correo
            </h2>
            {notification ? (
              <dl className="mt-2">
                <Field label="Estado">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${NOTIFICATION_STYLES[notification.status]}`}
                  >
                    {NOTIFICATION_LABELS[notification.status]}
                  </span>
                </Field>
                <Field label="Intentos">{notification.attempt_count}</Field>
                <Field label="Enviada">
                  {formatDateTime(notification.sent_at)}
                </Field>
                {notification.provider_message_id ? (
                  <Field label="ID en Resend">
                    <code className="text-xs">
                      {notification.provider_message_id}
                    </code>
                  </Field>
                ) : null}
                {notification.last_error_code ? (
                  <Field label="Último error">
                    <code className="text-xs">
                      {notification.last_error_code}
                    </code>{" "}
                    · {formatDateTime(notification.last_error_at)}
                  </Field>
                ) : null}
                {notification.status === "retry" ||
                notification.status === "pending" ? (
                  <Field label="Próximo intento">
                    {formatDateTime(notification.next_attempt_at)}
                  </Field>
                ) : null}
              </dl>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                Sin registro de notificación.
              </p>
            )}
            <p className="mt-4 text-xs text-slate-500">
              El worker gestiona los reintentos automáticamente. No edites este
              estado a mano; una notificación fallida se escala según el
              runbook.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
