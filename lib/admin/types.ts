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
