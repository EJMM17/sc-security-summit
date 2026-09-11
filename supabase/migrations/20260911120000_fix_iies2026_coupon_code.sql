-- SC Security Summit 2026
-- The convenio del IIES se sembró con una "I" de más: IIIES2026 por IIES2026.
--
-- Product change:
--   El código impreso en el convenio es IIES2026. El cupón sembrado por
--   20260827120000_discount_codes.sql quedó como IIIES2026, así que quien
--   escribe el código correcto paga el precio publicado. Se corrige el código
--   del cupón existente: a partir de aquí IIES2026 compra el 20% y el typo
--   IIIES2026 deja de ser un código (quien lo escriba recibe el aviso de
--   siempre y puede pagar igual, al precio publicado).
--
-- Design notes:
--   * Es un `update` sobre la fila existente, no un alta con baja de la
--     anterior: `public.coupon_uses` y `public.ticket_orders` referencian el
--     cupón por `coupons.id`, de modo que las reservas y las órdenes ya
--     vendidas siguen apuntando al mismo convenio. `ticket_orders.coupon_code`
--     guarda el texto tal como se cobró y no se toca: es el registro de lo que
--     el comprador escribió ese día.
--   * `coupons_code_check` exige mayúsculas sin espacios y
--     `coupons_code_key` la unicidad; IIES2026 cumple ambas y no existe.
--   * El trigger `coupons_touch_updated_at` mueve `updated_at` solo.
--
-- Data only. No schema, no function and no grant is touched, so this migration
-- is additive and independent of the application deploy.
--
-- Operational rollback:
--   update public.coupons set code = 'IIIES2026', notes = 'Convenio IIIES'
--   where code = 'IIES2026';

begin;

update public.coupons
set code = 'IIES2026',
    notes = 'Convenio IIES'
where code = 'IIIES2026';

commit;
