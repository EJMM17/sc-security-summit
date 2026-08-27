-- SC Security Summit 2026
-- An abandoned checkout stops being pending forever.
--
-- Problem:
--   A buyer who closes the tab on MercadoPago never produces a payment, so
--   there is nothing for the webhook to deliver and nothing for the
--   reconciliation sweep to apply. The order stays 'pending' for as long as the
--   row exists. Three costs follow: /admin cannot tell an abandoned checkout
--   from a buyer who is paying right now, the conversion figures count
--   abandonments as live orders, and the cron keeps asking MercadoPago about
--   every abandonment on every run — for a batch capped at twenty, that is how
--   a real pending order ends up at the back of the queue.
--
-- Design notes:
--   * The caller names the orders. Only an order MercadoPago has just been
--     asked about, and answered that it holds no payment for, may be passed
--     in: age alone is not evidence of abandonment, because a payment can sit
--     in a non-terminal state the site has not recorded yet.
--   * The conditions are re-checked here anyway — still pending, no payment
--     recorded, older than the preference — inside the same statement that
--     writes the change, so a payment landing at that exact moment cannot be
--     expired out from under the buyer.
--   * The floor of 30 minutes is the preference expiry (CHECKOUT_EXPIRY_MINUTES
--     in create-ticket-checkout). Expiring earlier than the window the buyer
--     was given would cancel a checkout that is still legitimately open, so the
--     parameter is clamped rather than trusted.
--   * `for update skip locked` steps around a row that
--     record_ticket_order_payment is holding: a payment being recorded right
--     now wins, and the order is simply considered on the next run.
--   * Expiry is never terminal for the money. record_ticket_order_payment
--     still moves a 'cancelled' order to 'paid' if a real payment shows up
--     late through the webhook, and the receipt trigger fires there as usual.
--   * provider_status is set to 'expired'. MercadoPago has no payment status
--     by that name, so it cannot collide with a provider value, and it is what
--     lets an operator tell an abandonment from a buyer who actively cancelled.
--
-- Operational rollback:
--   Drop the function and restore the previous event-type constraint. Orders
--   already expired stay 'cancelled'; move one back with a targeted update if
--   an expiry is ever found to be wrong.

begin;

-- ---------------------------------------------------------------------------
-- Event vocabulary
-- ---------------------------------------------------------------------------

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
      'order_expired',
      'invoice_requested',
      'invoice_issued'
    )
  );

-- ---------------------------------------------------------------------------
-- Expiry
-- ---------------------------------------------------------------------------

/**
 * Cancels the named pending orders whose checkout window closed without a
 * payment.
 *
 * Returns the ids it actually expired, which may be fewer than were named:
 * anything that stopped qualifying in the meantime is left alone.
 */
create or replace function public.expire_stale_ticket_orders(
  p_order_ids uuid[],
  p_expiry_minutes integer default 60
)
returns table (order_id uuid)
language plpgsql
volatile
security invoker
set search_path = ''
as $function$
declare
  -- Never below the preference expiry: an order younger than that is a
  -- checkout still legitimately in progress, whatever the caller passes.
  v_expiry_minutes integer := greatest(coalesce(p_expiry_minutes, 60), 30);
begin
  if p_order_ids is null or pg_catalog.cardinality(p_order_ids) = 0 then
    return;
  end if;

  return query
  with candidates as (
    select o.id
    from public.ticket_orders as o
    where o.id = any(p_order_ids)
      and o.status = 'pending'
      -- A recorded payment id means the provider already answered for this
      -- order. That is never an abandonment, whatever its age.
      and o.provider_payment_id is null
      and o.created_at
        < pg_catalog.clock_timestamp()
          - (v_expiry_minutes * interval '1 minute')
    order by o.created_at
    for update skip locked
  ),
  expired as (
    update public.ticket_orders as o
    set status = 'cancelled',
        provider_status = 'expired'
    from candidates as c
    where o.id = c.id
    returning o.id
  ),
  logged as (
    insert into public.ticket_order_events (order_id, event_type, metadata)
    select
      e.id,
      'order_expired',
      pg_catalog.jsonb_build_object(
        'previous_status', 'pending',
        'order_status', 'cancelled',
        'reason', 'checkout_expired',
        'source', 'sweep'
      )
    from expired as e
    returning ticket_order_events.order_id
  )
  select l.order_id from logged as l;
end;
$function$;

comment on function public.expire_stale_ticket_orders(uuid[], integer) is
  'Cancels the named pending orders abandoned before payment. Never touches an order that carries a provider payment id.';

revoke all on function public.expire_stale_ticket_orders(uuid[], integer)
  from anon, authenticated, public;

grant execute on function public.expire_stale_ticket_orders(uuid[], integer)
  to service_role;

commit;
