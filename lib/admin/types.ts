/**
 * Shapes shared between the panel's server data layer and its client
 * components. This module stays free of `server-only` and of any Supabase
 * import so a client component can type its props without pulling the
 * repository — and the elevated key — into the browser bundle.
 */
export const INQUIRY_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "won",
  "lost",
  "archived",
] as const;

export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];
export type InquiryKind = "corporate" | "sponsor";
export type NotificationStatus =
  | "pending"
  | "processing"
  | "sent"
  | "retry"
  | "dead";

export type AdminNotification = {
  inquiry_id: string;
  status: NotificationStatus;
  attempt_count: number;
  provider_message_id: string | null;
  last_error_code: string | null;
  last_error_at: string | null;
  sent_at: string | null;
  next_attempt_at: string | null;
};

export type AdminInquiry = {
  id: string;
  kind: InquiryKind;
  status: InquiryStatus;
  contact_name: string;
  email: string;
  phone: string;
  company: string;
  job_title: string | null;
  requested_seats: number | null;
  interest: string | null;
  /** Named participants of a corporate block, in seat order. */
  attendees: string[];
  language: "es" | "en";
  owner: string | null;
  internal_notes: string | null;
  next_follow_up_at: string | null;
  created_at: string;
  updated_at: string;
  consent_version: string;
  consented_at: string;
  retention_until: string;
  notification: AdminNotification | null;
};

// ---------------------------------------------------------------------------
// Ticket orders
// ---------------------------------------------------------------------------

export const TICKET_ORDER_STATUS_VALUES = [
  "pending",
  "in_process",
  "paid",
  "rejected",
  "cancelled",
  "refunded",
  "charged_back",
] as const;

export type AdminTicketOrderStatus =
  (typeof TICKET_ORDER_STATUS_VALUES)[number];

export const INVOICE_STATUS_VALUES = [
  "not_requested",
  "requested",
  "issued",
  "cancelled",
] as const;

export type AdminInvoiceStatus = (typeof INVOICE_STATUS_VALUES)[number];

export type AdminTicketOrder = {
  id: string;
  status: AdminTicketOrderStatus;
  tier: "plus" | "general" | "estudiante";
  quantity: number;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  tax_rate_basis_points: number;
  buyer_name: string;
  email: string;
  phone: string;
  company: string | null;
  language: "es" | "en";
  requires_invoice: boolean;
  invoice_status: AdminInvoiceStatus;
  invoiced_at: string | null;
  cfdi_uuid: string | null;
  provider_payment_id: string | null;
  provider_status: string | null;
  paid_at: string | null;
  owner: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  retention_until: string;
};

/**
 * Fiscal data is a separate shape so a list view can never accidentally
 * render it: only the order detail page requests it.
 */
export type AdminInvoiceDetails = {
  order_id: string;
  rfc: string;
  person_type: "fisica" | "moral";
  legal_name: string;
  tax_regime: string;
  cfdi_use: string;
  postal_code: string;
  billing_email: string | null;
};

export type AdminTicketOrderNotification = {
  id: string;
  template: string;
  status: NotificationStatus;
  attempt_count: number;
  last_error_code: string | null;
  sent_at: string | null;
  next_attempt_at: string | null;
};

export type AdminTicketCapacity = {
  scope: string;
  total_seats: number;
  hold_minutes: number;
  committed_seats: number;
  remaining_seats: number;
};
