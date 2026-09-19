-- SC Security Summit 2026
-- El convenio del IIES se sembró con una "I" de más: IIIES2026 por IIES2026.
-- Renombra la fila existente: coupon_uses y ticket_orders referencian el cupón
-- por coupons.id, así que las reservas y las órdenes ya vendidas siguen
-- apuntando al mismo convenio. Data only.
--
-- Rollback:
--   update public.coupons set code = 'IIIES2026', notes = 'Convenio IIIES'
--   where code = 'IIES2026';

update public.coupons
set code = 'IIES2026',
    notes = 'Convenio IIES'
where code = 'IIIES2026';
