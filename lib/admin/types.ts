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

export const TICKET_TIER_VALUES = [
  "plus",
  "general",
  "estudiante",
  "corporativo",
] as const;

export type AdminTicketTier = (typeof TICKET_TIER_VALUES)[number];

export type AdminTicketOrder = {
  id: string;
  status: AdminTicketOrderStatus;
  tier: AdminTicketTier;
  quantity: number;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  tax_rate_basis_points: number;
  buyer_name: string;
  email: string;
  phone: string;
  company: string | null;
  referral_source: string | null;
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

/** One named participant of a paid corporate block. */
export type AdminTicketOrderAttendee = {
  seat_number: number;
  full_name: string;
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

// ---------------------------------------------------------------------------
// Sold accesses and sales tracking
// ---------------------------------------------------------------------------

/**
 * One purchased access. Derived from an order and its roster rather than
 * stored: `ticket_code` and `amount_cents` are computed in
 * `lib/admin/tickets.ts` and exist only for the panel.
 */
export type AdminSoldTicket = {
  order_id: string;
  ticket_code: string;
  seat_number: number;
  seats_in_order: number;
  tier: AdminTicketTier;
  attendee_name: string | null;
  buyer_name: string;
  email: string;
  phone: string;
  company: string | null;
  referral_source: string | null;
  language: "es" | "en";
  status: AdminTicketOrderStatus;
  invoice_status: AdminInvoiceStatus;
  amount_cents: number;
  paid_at: string | null;
  created_at: string;
};

export type AdminSalesTierRow = {
  tier: AdminTicketTier;
  seats: number;
  orders: number;
  grossCents: number;
};

export type AdminSalesDayRow = {
  day: string;
  seats: number;
  grossCents: number;
};

export type AdminSalesReferralRow = {
  source: string;
  seats: number;
  orders: number;
};

export type AdminSalesTracking = {
  soldSeats: number;
  paidOrders: number;
  /** Seats of orders still in checkout: held, not sold. */
  heldSeats: number;
  heldOrders: number;
  /** Rejected, cancelled, refunded or charged back after a payment attempt. */
  lostOrders: number;
  /** Checkouts abandoned before any payment, cancelled by the sweep. */
  abandonedOrders: number;
  grossCents: number;
  taxCents: number;
  netCents: number;
  averageOrderCents: number;
  averageSeatCents: number;
  invoicesRequested: number;
  invoicesIssued: number;
  seatsLast7Days: number;
  lastSaleAt: string | null;
  /** Paid over resolved checkouts, or null while none has resolved. */
  conversionRate: number | null;
  byTier: AdminSalesTierRow[];
  byDay: AdminSalesDayRow[];
  byReferral: AdminSalesReferralRow[];
};
