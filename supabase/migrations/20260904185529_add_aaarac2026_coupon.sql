-- SC Security Summit 2026
-- One more convenio code: AAARAC2026, at 25%.
--
-- Product change:
--   AAARAC hands out a code that takes 25% off the unit price, five points
--   more than the convenios seeded with 20260827120000_discount_codes.sql.
--   Nothing else about the coupon contract changes: the code lives here and
--   only here, the browser never receives the list, the discount is applied to
--   the *unit* price so the line total stays an exact multiple of it, and it
--   composes with the volume discount exactly like every other coupon.
--
-- Data only. No schema, no function and no grant is touched, so this migration
-- is additive and independent of the application deploy: applying it early
-- simply makes the code start working, and rolling the application back leaves
-- a row nothing reads.
--
-- Operational rollback:
--   update public.coupons set active = false where code = 'AAARAC2026';
--   Deactivate rather than delete: public.coupon_uses references the coupon
--   with `on delete restrict`, and the orders already sold under the convenio
--   are the record of it.

begin;

insert into public.coupons (code, discount_type, discount_basis_points, active, notes)
values ('AAARAC2026', 'percentage', 2500, true, 'Convenio AAARAC')
on conflict on constraint coupons_code_key do nothing;

commit;
