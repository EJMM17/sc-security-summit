import type {
  InquiryKind,
  InquiryStatus,
  NotificationStatus,
} from "@/lib/admin/types";

export const STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "Nueva",
  contacted: "Contactada",
  qualified: "Calificada",
  proposal_sent: "Propuesta enviada",
  won: "Ganada",
  lost: "Perdida",
  archived: "Archivada",
};

export const STATUS_STYLES: Record<InquiryStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-sky-100 text-sky-800",
  qualified: "bg-indigo-100 text-indigo-800",
  proposal_sent: "bg-amber-100 text-amber-800",
  won: "bg-emerald-100 text-emerald-800",
  lost: "bg-slate-200 text-slate-700",
  archived: "bg-slate-100 text-slate-500",
};

export const KIND_LABELS: Record<InquiryKind, string> = {
  corporate: "Pase corporativo",
  sponsor: "Patrocinio",
};

export const NOTIFICATION_LABELS: Record<NotificationStatus, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  sent: "Enviada",
  retry: "Reintentando",
  dead: "Fallida",
};

export const NOTIFICATION_STYLES: Record<NotificationStatus, string> = {
  pending: "bg-slate-100 text-slate-600",
  processing: "bg-sky-100 text-sky-700",
  sent: "bg-emerald-100 text-emerald-800",
  retry: "bg-amber-100 text-amber-800",
  dead: "bg-red-100 text-red-800",
};

const DATE_FORMAT = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Monterrey",
});

export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? "—" : DATE_FORMAT.format(parsed);
}

/**
 * `datetime-local` inputs need a zone-less `YYYY-MM-DDTHH:mm`, so render the
 * stored instant in the event's timezone rather than the server's UTC clock.
 */
export function toDateTimeLocalValue(value: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Monterrey",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(parsed);

  const value_ = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value_("year")}-${value_("month")}-${value_("day")}T${value_("hour")}:${value_("minute")}`;
}

import type {
  AdminInvoiceStatus,
  AdminTicketOrderStatus,
} from "@/lib/admin/types";

export const ORDER_STATUS_LABELS: Record<AdminTicketOrderStatus, string> = {
  pending: "Pendiente",
  in_process: "En proceso",
  paid: "Pagada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
  refunded: "Reembolsada",
  charged_back: "Contracargo",
};

export const ORDER_STATUS_STYLES: Record<AdminTicketOrderStatus, string> = {
  pending: "bg-slate-100 text-slate-600",
  in_process: "bg-sky-100 text-sky-800",
  paid: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-slate-200 text-slate-700",
  refunded: "bg-amber-100 text-amber-800",
  charged_back: "bg-red-200 text-red-900",
};

export const INVOICE_STATUS_LABELS: Record<AdminInvoiceStatus, string> = {
  not_requested: "No solicitada",
  requested: "Solicitada",
  issued: "Emitida",
  cancelled: "Cancelada",
};

export const INVOICE_STATUS_STYLES: Record<AdminInvoiceStatus, string> = {
  not_requested: "bg-slate-100 text-slate-500",
  requested: "bg-amber-100 text-amber-800",
  issued: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-200 text-slate-700",
};

export const TIER_LABELS: Record<"plus" | "general" | "estudiante", string> = {
  plus: "Acceso Plus",
  general: "Acceso General",
  estudiante: "Acceso Estudiante",
};
