# SC Security Summit 2026 — Runbook

Última revisión: 2026-07-30.

Runbook de continuidad para el sitio, Eventbrite y las solicitudes corporate /
sponsor. La operación detallada de solicitudes está en
`docs/INQUIRY_OPERATIONS.md`.

## 1. Límites del sistema

- Eventbrite administra compras, pagos, boletos, reembolsos y check-in
  individuales.
- Supabase conserva únicamente solicitudes de pase corporativo y patrocinio.
- Resend notifica al equipo después de que la solicitud quedó persistida.
- Un correo fallido queda en outbox para reintento; no borra el lead.
- El navegador nunca accede directamente a Supabase.
- Las tablas históricas (`registros`, `admins`, etc.) no forman parte del flujo
  nuevo.

## 2. Referencias

| Recurso | Ubicación |
|---|---|
| Sitio | <https://scsecuritysummit.com> |
| Health | <https://scsecuritysummit.com/api/health> |
| Solicitudes | Supabase Studio → `public.inquiries` |
| Outbox | Supabase Studio → `public.inquiry_notifications` |
| Intentos | Supabase Studio → `public.inquiry_notification_attempts` |
| Eventos | Supabase Studio → `public.inquiry_events` |
| Correo | Resend Dashboard → Emails |
| Deploys y cron | Vercel Dashboard |
| Errores operativos | Vercel Runtime Logs por código técnico; Sentry solo para excepciones no controladas si está configurado |
| Rate limiting | Vercel Storage → recurso Upstash / Upstash Console |
| Venta individual | Eventbrite Organizer |

Los enlaces de cuentas, responsables y teléfonos de escalación se mantienen en
el gestor interno autorizado, no en el repositorio.

## 3. Revisión diaria

Durante operación normal: una vez al día. Durante semana del evento: 09:00 y
17:00, hora de Ciudad de México.

1. `/api/health` responde `200`, confirmando app + storage crítico.
2. El último deployment de Vercel está verde.
3. Vercel Runtime Logs no contiene tres eventos técnicos
   `inquiry_persistence_failed` en los últimos 15 minutos.
4. No existen notificaciones `dead`.
5. Las notificaciones `pending`, `processing` o `retry` no están detenidas.
6. Las solicitudes `new` de más de 24 horas tienen responsable o seguimiento.
7. Resend no muestra un aumento anormal de rechazos.
8. Upstash no muestra fallos o abuso sostenido.
9. Eventbrite sigue publicado con accesos y precios correctos.

Registra fecha, operador, conteos y decisiones. Nunca copies nombres, correos,
teléfonos o mensajes del formulario a logs o tickets no autorizados.

## 4. Severidad

| Nivel | Condición | Respuesta |
|---|---|---|
| SEV-1 | No se puede abrir el sitio o toda persistencia falla | Inmediata; activar fallback y evaluar rollback |
| SEV-2 | Notificaciones detenidas/dead, cron sin ejecución >15 min o formularios degradados | Atender en menos de 30 min |
| SEV-3 | Una solicitud requiere corrección o seguimiento manual | Mismo día hábil |

Tres fallos de persistencia en 15 minutos se tratan como SEV-1.

## 5. SOP — solicitud sin respuesta

1. Busca por empresa o correo en `public.inquiries`.
2. Si existe, conserva su `id` como correlación y revisa `status`, `owner` y
   `next_follow_up_at`.
3. Revisa su fila en `public.inquiry_notifications`.
4. Si está `sent`, confirma el correo en Resend y la bandeja de
   `CONTACT_EMAIL`.
5. Si está `pending` o `retry`, revisa el último `error_code` sanitizado y el
   cron.
6. Si está `dead`, escala como SEV-2; no cambies el estado manualmente sin una
   instrucción aprobada.
7. Si la solicitud no existe, el envío no quedó recibido. Pide reintentar y
   ofrece el correo de contacto como canal alterno.

No solicites que la persona vuelva a enviar si la fila ya existe: un replay
idéntico es seguro, pero no sustituye el seguimiento humano.

## 6. SOP — Resend no disponible

1. Confirma el incidente en Resend Status y en sus logs.
2. Comprueba que las solicitudes nuevas siguen apareciendo en `inquiries`.
3. Comprueba que su outbox queda `pending` o `retry`.
4. No despliegues un cambio que envíe correo antes de persistir.
5. Cuando el proveedor vuelva, confirma que el cron drene la cola gradualmente.
6. Escala cualquier fila `dead`.

Mientras Supabase esté sano, la captura sigue disponible y el usuario recibe
éxito aunque la notificación quede en cola.

## 7. SOP — Supabase no disponible

1. Confirma el estado del proveedor y los errores de persistencia.
2. El formulario debe responder `storage_unavailable` y no mostrar éxito.
3. Publica temporalmente el canal de contacto autorizado junto al formulario si
   la indisponibilidad continúa.
4. No cambies el flujo para enviar correo sin persistir: rompería la fuente de
   verdad e idempotencia.
5. Cuando vuelva el servicio, ejecuta una solicitud controlada y confirma fila,
   outbox y notificación.

### 7.1 SOP — `401 PGRST303` intermitente

Síntoma: peticiones sueltas a `/rest/v1/*` responden `401` con
`PGRST303` ("JWT claims validation or parsing failed") mientras el resto de las
peticiones, con la misma credencial, responden `200`. En Vercel aparece como
`cron_run_failed` con el código `PGRST303` en una de las tres tareas del cron;
en Supabase, como `401` en `edge_logs`. Observado por primera vez el
2026-08-26, alrededor de seis por hora.

Efecto: la aplicación reintenta el intento transitorio dos veces
(`lib/supabase-retry-fetch.ts`), así que una incidencia aislada ya no pierde el
lote. El reintento es una mitigación, no la causa resuelta: cada uno se
registra como `supabase_auth_retry` en los logs de Function.

1. Cuenta los `401` de las últimas 24 h en el Log Explorer de Supabase y los
   `supabase_auth_retry` en Vercel. Si suben, escala.
2. Comprueba el formato de `SUPABASE_SECRET_KEY` en Vercel Production y si el
   proyecto todavía admite las llaves legacy JWT.
3. Rota la llave desde el Dashboard de Supabase y actualiza solo el target
   Production. No copies el valor a ningún otro target ni a un ticket.
4. Reconstruye Production y confirma con `/api/health` y una corrida de cron
   limpia.
5. Si los `401` persisten con una llave recién emitida, abre soporte con
   Supabase citando `PGRST303`, el `x-vercel-id` y la hora exacta; nunca el
   valor de la llave.

No amplíes el reintento a otros `401`: una llave equivocada, ausente o
caducada debe seguir fallando de inmediato y de forma visible.

## 8. SOP — cron detenido

1. Confirma que el equipo Vercel sigue en Pro.
2. Confirma que `CRON_SECRET` existe en Production y no contiene saltos de
   línea.
3. En Vercel → Cron Jobs, confirma
   `/api/cron/inquiry-notifications` con `*/5 * * * *`.
4. Revisa logs de Function y respuestas `401`, `503` o `500`.
5. Ejecuta una invocación manual autenticada desde una estación autorizada sin
   imprimir el secreto.
6. Confirma que el worker reclama un lote acotado y que no hay dos procesos
   sobre la misma fila.

Vercel no reintenta una invocación cron fallida y puede entregar una misma
invocación más de una vez. El worker debe seguir siendo idempotente.

## 9. SOP — rate limiting

Si una persona legítima recibe `rate_limited`:

1. Confirma hora y ambiente.
2. Revisa métricas de Upstash y abuso agregado.
3. Espera la ventana de 15 minutos como primera opción.
4. No registres su IP en tickets, Sentry o Supabase.
5. No eleves el límite sin revisar el patrón de abuso y añadir pruebas.

Upstash solo se usa en Vercel Production y falla cerrado allí. Preview mantiene
los formularios deshabilitados. No copies credenciales ni desactives la
protección para resolver una incidencia.

La aplicación consume `KV_REST_API_URL` y `KV_REST_API_TOKEN`; ambas son
aprovisionadas y rotadas por `summit-rate-limit-production`, conectado solo a
Production en Vercel Storage. El recurso Redis anterior permanece archivado y
no se reconecta.
`KV_URL`, `REDIS_URL` y `KV_REST_API_READ_ONLY_TOKEN` son provider-managed y
no se consumen. Si falta el par REST, comprueba primero el recurso, su conexión
al proyecto y el target Production; no recrees variables manuales.

Incidente de alcance: nunca uses `vercel env rm NAME preview` sobre una entrada
multi-target. Antes haz un inventario y respalda IDs/targets/origen sin copiar
valores, y edita el target desde Dashboard/API. Para Upstash, cambia o rota la
conexión en Vercel Storage y reconstruye Production.

### 9.1 SOP — pedido `cancelled` que el comprador dice haber pagado

Un pedido con `provider_status = 'expired'` fue cerrado por el barrido porque
MercadoPago respondió que no tenía ningún pago para él pasada la ventana de la
preferencia. Antes de tocar nada:

1. Busca el pago en el panel de MercadoPago por el correo o el monto, y
   confirma su `external_reference`.
2. Si existe un pago aprobado con ese `external_reference`, el webhook debe
   poder aplicarlo: reenvía la notificación desde el panel del proveedor. Un
   pedido expirado no bloquea el cobro — `record_ticket_order_payment` lo
   mueve a `paid` y encola el comprobante.
3. Si el pago existe pero con otro `external_reference`, no lo fuerces sobre
   este pedido: registra el caso y trátalo como cobro manual.
4. Si no existe ningún pago, el cierre fue correcto. El comprador puede volver
   a comprar; el pedido viejo no reserva cupo.

Nunca edites `status` a mano para "arreglar" un cobro: la única ruta que
escribe un pago es la del proveedor.

## 10. Venta y evento

Para “pagué y no recibí boleto”, busca el pedido en Eventbrite por el correo de
compra y reenvía la confirmación desde Eventbrite. El sitio y Supabase no
contienen órdenes individuales.

El check-in se realiza con Eventbrite Organizer. La lista offline se exporta
desde Eventbrite bajo el procedimiento de privacidad autorizado.

## 11. Retención

La política aprobada el 2026-07-30 conserva cada solicitud durante 18 meses
desde `created_at`, salvo relación contractual, solicitud ARCO en trámite u
obligación jurídica documentada. Una persona autorizada ejecuta la revisión
mensual, elimina los datos personales o los anonimiza de forma irreversible y
registra:

- fecha de ejecución;
- responsable;
- número de filas procesadas;
- resultado y, si aplica, código técnico del fallo.

La tarea mensual nunca registra PII. Ante un fallo, detén el lote, conserva las
filas sin cambios y escala a privacidad antes de reintentar.

## 12. Recuperación

- **Health 503:** revisa primero configuración/conectividad Supabase y luego el
  deployment; el probe tiene un timeout de tres segundos.
- **Bad deploy:** promueve el deployment verde anterior. Mantén las tablas y
  datos nuevos; no hagas `DROP`.
- **Cron defectuoso:** deshabilítalo por separado. Instant Rollback no restaura
  automáticamente la configuración de cron.
- **Migración defectuosa:** corrige con una migración nueva aditiva. Nunca
  edites una migración aplicada.
- **Pérdida o corrupción:** detén escrituras, conserva evidencia y sigue el
  procedimiento de backup/restauración de Supabase.
- **Eventbrite caído:** pausa ventas y dirige temporalmente al canal de contacto
  aprobado; no construyas checkout local de emergencia.

Nunca ejecutes `supabase db reset --linked` en Production.

## 13. Checklist pre-lanzamiento

- [x] Aviso final `2026-07-30`, retención de 18 meses, ARCO y procedimiento de
      eliminación/anonimización aprobados el 2026-07-30.
- [ ] Backup de Production verificado.
- [ ] `public.registros` conserva exactamente los diez registros históricos
      esperados antes y después del corte.
- [ ] Migración `retire_legacy_registration_webhook` aplicada: retiró
      `trg_send_confirmation_email`, `public.notify_new_registro()` y `pg_net`
      con `RESTRICT` dentro de una transacción.
- [ ] `supabase/functions/send-confirmation-email/index.ts` desplegada como
      tombstone HTTP 410 con verificación JWT; no se reutilizó ni documentó el
      secreto heredado.
- [ ] Migraciones alineadas y reproducibles desde cero.
- [ ] pgTAP, lint y tipos generados verdes.
- [ ] Advisors sin errores críticos.
- [ ] Preview visual desconectado, sin variables Production.
- [ ] Vercel Pro confirmado y cron activo cada cinco minutos.
- [ ] `summit-rate-limit-production` conectado solo a Production; par
      `KV_REST_API_URL`/`KV_REST_API_TOKEN` presente.
- [ ] Variables Production validadas en estricto.
- [ ] El commit fue reconstruido como Production; no se promovió el artefacto
      Preview.
- [ ] Una solicitud corporate y sponsor confirmadas de extremo a extremo.
- [ ] Fallo controlado de Resend conserva la solicitud.
- [ ] Fallo controlado de Supabase no devuelve falso éxito.
- [ ] Acceso `anon`/`authenticated` denegado.
- [ ] Operadores con cuentas individuales y MFA.
