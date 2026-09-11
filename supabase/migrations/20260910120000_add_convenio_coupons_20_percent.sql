-- SC Security Summit 2026
-- Five more convenio codes, all at 20%: UT2026, ITCC2026, UAT2026,
-- ATLANTICO2026 and UMAN2026.
--
-- Product change:
--   Five more partners hand out a code that takes 20% off the unit price, the
--   same rate as the convenios seeded with 20260827120000_discount_codes.sql
--   (AAARAC2026 stays at 25%: the rate belongs to each coupon, not to "being a
--   convenio"). Nothing else about the coupon contract changes: the codes live
--   here and only here, the browser never receives the list, the discount is
--   applied to the *unit* price so the line total stays an exact multiple of
--   it, and it composes with the volume discount exactly like every other
--   coupon.
--
-- Data only. No schema, no function and no grant is touched, so this migration
-- is additive and independent of the application deploy: applying it early
-- simply makes the codes start working, and rolling the application back
-- leaves rows nothing reads.
--
-- Operational rollback:
--   update public.coupons set active = false
--   where code in ('UT2026', 'ITCC2026', 'UAT2026', 'ATLANTICO2026', 'UMAN2026');
--   Deactivate rather than delete: public.coupon_uses references the coupon
--   with `on delete restrict`, and the orders already sold under a convenio
--   are the record of it.

begin;

insert into public.coupons (code, discount_type, discount_basis_points, active, notes)
values
  ('UT2026', 'percentage', 2000, true, 'Convenio UT'),
  ('ITCC2026', 'percentage', 2000, true, 'Convenio ITCC'),
  ('UAT2026', 'percentage', 2000, true, 'Convenio UAT'),
  ('ATLANTICO2026', 'percentage', 2000, true, 'Convenio Atlántico'),
  ('UMAN2026', 'percentage', 2000, true, 'Convenio UMAN')
on conflict on constraint coupons_code_key do nothing;

commit;
