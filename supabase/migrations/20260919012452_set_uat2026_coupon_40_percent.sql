-- SC Security Summit 2026
-- UAT2026 moves from 20% to 40%.
--
-- Product change:
--   The UAT convenio is renegotiated: its code now takes 40% off the unit
--   price instead of the 20% seeded by 20260910120000. Only that coupon
--   changes; the other convenios keep their own rate, which is the point of
--   storing the percentage per coupon rather than per "being a convenio".
--   Nothing else about the coupon contract changes: the code lives here and
--   only here, the browser never receives the list, the discount is applied to
--   the *unit* price so the line total stays an exact multiple of it, and it
--   composes with the volume discount exactly like every other coupon.
--
-- Orders already sold at 20% keep their stored audit trail
-- (`coupon_discount_cents`, `coupon_discount_basis_points` and the row in
-- `public.coupon_uses` are per order): this migration re-prices future
-- checkouts only.
--
-- Data only. No schema, no function and no grant is touched, so this migration
-- is additive and independent of the application deploy.
--
-- Operational rollback:
--   update public.coupons set discount_basis_points = 2000
--   where code = 'UAT2026';

begin;

update public.coupons
set discount_basis_points = 4000,
    discount_type = 'percentage',
    discount_amount_cents = null,
    active = true
where code = 'UAT2026';

commit;
