-- SC Security Summit 2026
-- 'order_expired' belongs in the event vocabulary.
--
-- Problem:
--   The discount-code migration rewrote ticket_order_events_type_check to add
--   'payment_amount_mismatch' and 'coupon_applied', but it was written against
--   the vocabulary as it stood before 20260826140000 and so dropped
--   'order_expired' again. Applied in order the two migrations leave a database
--   whose expiry sweep cannot log what it did: expire_stale_ticket_orders
--   inserts an 'order_expired' event, and the constraint refuses it — taking
--   the whole sweep down with it. On a database that already swept, adding the
--   narrower constraint fails outright against the rows it wrote.
--
-- Fix:
--   Restate the constraint as the union of both vocabularies. Nothing else in
--   either migration changes, and this is the only definition of the check
--   from here on.

begin;

alter table public.ticket_order_events
  drop constraint ticket_order_events_type_check;

alter table public.ticket_order_events
  add constraint ticket_order_events_type_check
  check (
    event_type in (
      'order_created',
      'order_replayed',
      'order_conflict',
      'preference_created',
      'payment_status_changed',
      'payment_duplicate_ignored',
      'payment_amount_mismatch',
      'order_expired',
      'coupon_applied',
      'invoice_requested',
      'invoice_issued'
    )
  );

commit;
