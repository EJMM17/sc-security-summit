-- SC Security Summit 2026
-- The Atlántico convenio is re-issued: ATLANTICO2026 is retired and UDA2026
-- takes its place, at 30%.
--
-- Data only. No schema, no function and no grant is touched.
--
-- Operational rollback:
--   update public.coupons set active = true where code = 'ATLANTICO2026';
--   update public.coupons set active = false where code = 'UDA2026';

update public.coupons
   set active = false,
       notes = 'Convenio Atlántico (retirado, reemplazado por UDA2026)'
 where code = 'ATLANTICO2026';

insert into public.coupons (code, discount_type, discount_basis_points, active, notes)
values ('UDA2026', 'percentage', 3000, true, 'Convenio UDA')
on conflict on constraint coupons_code_key do nothing;
