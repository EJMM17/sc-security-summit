# RUNBOOK — SC Security Summit 2026

> Resumen de continuidad. El procedimiento canónico está en
> [`docs/RUNBOOK.md`](docs/RUNBOOK.md) y la operación de solicitudes en
> [`docs/INQUIRY_OPERATIONS.md`](docs/INQUIRY_OPERATIONS.md).

## Alcance

- Eventbrite administra accesos individuales, pagos, boletos y check-in.
- Supabase conserva solicitudes corporate y sponsor.
- Resend notifica después de persistir.
- Vercel Cron reintenta la outbox cada cinco minutos.

## Revisión rápida

1. `/api/health` responde `200` (aplicación + storage crítico).
2. Último deployment Vercel verde.
3. Sin tres fallos de persistencia en 15 minutos.
4. Sin notificaciones `dead`.
5. Cron ejecutado en los últimos 15 minutos.
6. Solicitudes `new` de menos de 24 horas o con seguimiento asignado.
7. Eventbrite publicado.

## Incidencias

- Supabase caído: el formulario no debe mostrar éxito; ofrece el canal de
  contacto autorizado.
- Resend caído: confirma que la solicitud persista y quede `pending`/`retry`.
- Cron caído: confirma Vercel Pro, `CRON_SECRET` y la ruta
  `/api/cron/inquiry-notifications`.
- Upstash caído en Production: confirma en Vercel Storage la conexión y el par
  `KV_REST_API_URL`/`KV_REST_API_TOKEN`; el formulario falla cerrado. No
  desactives la protección. En Preview los formularios ya están deshabilitados.
- Bad deploy: vuelve al deployment verde, conserva tablas/datos y revisa el
  cron por separado.

Nunca ejecutes `supabase db reset --linked` en Production ni uses un `DROP`
como rollback automático.

## Gates de Production

- aviso final y retención aprobados;
- backup verificado;
- migraciones, pgTAP, lint, tipos y advisors verdes;
- Preview visual desconectado verificado, sin scopes Production;
- variables Production estrictas completas;
- conexión Upstash de Vercel Storage limitada a Production;
- Vercel Pro + `CRON_SECRET`;
- rebuild del mismo commit como Production y smoke corporate/sponsor.

Nunca uses `vercel env rm NAME preview` sobre una entrada multi-target. Edita
targets en Dashboard/API después de inventariar y respaldar la metadata; las
variables Upstash se gestionan y rotan desde Vercel Storage.
