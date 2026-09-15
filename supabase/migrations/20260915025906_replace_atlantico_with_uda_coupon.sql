-- SC Security Summit 2026
-- The Atlántico convenio is re-issued: ATLANTICO2026 is retired and UDA2026
-- takes its place, at 30%.
--
-- Product change:
--   The partner hands out a new code, UDA2026, that takes 30% off the unit
--   price — ten points more than the code it replaces and five more than
--   AAARAC2026, which is only possible because the rate belongs to each
--   coupon and not to "being a convenio". ATLANTICO2026 stops buying a
--   discount: a buyer who types it from here on is told it is not a code and
--   pays the published price, never blocked, exactly like any other unknown
--   string.
--
-- Why a new row instead of renaming the old one:
--   public.coupon_uses points at the coupon by id and public.ticket_orders
--   stores the literal string the buyer typed, so renaming ATLANTICO2026 in
--   place would re-label the sales already made under it and quietly restate
--   their rate. The retired row keeps that record; the new code is a new
--   coupon.
--
-- Data only. No schema, no function and no grant is touched, so this migration
-- is additive and independent of the application deploy.
--
-- Operational rollback (a partner still holding the old code, say):
--   update public.coupons set active = true where code = 'ATLANTICO2026';
--   update public.coupons set active = false where code = 'UDA2026';
--   Deactivate rather than delete: public.coupon_uses references the coupon
--   with `on delete restrict`, and the orders already sold under a convenio
--   are the record of it.

begin;

update public.coupons
   set active = false,
       notes = 'Convenio Atlántico (retirado, reemplazado por UDA2026)'
 where code = 'ATLANTICO2026';

insert into public.coupons (code, discount_type, discount_basis_points, active, notes)
values ('UDA2026', 'percentage', 3000, true, 'Convenio UDA')
on conflict on constraint coupons_code_key do nothing;

commit;
