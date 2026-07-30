# SC Security Summit 2026 — Runbook

Última revisión: 2026-07-29.

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
| Sitio | <https://www.scsecuritysummit.com> |
| Health | <https://www.scsecuritysummit.com/api/health> |
| Solicitudes | Supabase Studio → `public.inquiries` |
| Outbox | Supabase Studio → `public.inquiry_notifications` |
| Intentos | Supabase Studio → `public.inquiry_notification_attempts` |
| Eventos | Supabase Studio → `public.inquiry_events` |
| Correo | Resend Dashboard → Emails |
| Deploys y cron | Vercel Dashboard |
| Errores | Sentry |
| Rate limiting | Upstash Console |
| Venta individual | Eventbrite Organizer |

Los enlaces de cuentas, responsables y teléfonos de escalación se mantienen en
el gestor interno autorizado, no en el repositorio.

## 3. Revisión diaria

Durante operación normal: una vez al día. Durante semana del evento: 09:00 y
17:00, hora de Ciudad de México.

1. `/api/health` responde `200`, confirmando app + storage crítico.
2. El último deployment de Vercel está verde.
3. No existen errores nuevos de persistencia en Sentry.
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

Upstash falla cerrado en Preview y Production. No desactives la protección para
resolver una incidencia.

## 10. Venta y evento

Para “pagué y no recibí boleto”, busca el pedido en Eventbrite por el correo de
compra y reenvía la confirmación desde Eventbrite. El sitio y Supabase no
contienen órdenes individuales.

El check-in se realiza con Eventbrite Organizer. La lista offline se exporta
desde Eventbrite bajo el procedimiento de privacidad autorizado.

## 11. Retención

La propuesta técnica es 18 meses desde `created_at`, salvo relación contractual
u obligación aplicable. No ejecutes eliminación ni anonimización hasta que la
persona responsable legal apruebe:

- plazo final;
- excepciones;
- método de eliminación o anonimización;
- responsable de ejecución;
- evidencia de la corrida.

La tarea mensual registra solo conteos y resultado, nunca PII.

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

- [ ] Aviso y retención aprobados; versión de consentimiento actualizada.
- [ ] Backup de Production verificado.
- [ ] `public.registros` conserva exactamente los siete registros históricos
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
- [ ] Preview aislado y estable durante 48 horas.
- [ ] Vercel Pro confirmado y cron activo cada cinco minutos.
- [ ] Variables Preview/Production validadas en estricto.
- [ ] Una solicitud corporate y sponsor confirmadas de extremo a extremo.
- [ ] Fallo controlado de Resend conserva la solicitud.
- [ ] Fallo controlado de Supabase no devuelve falso éxito.
- [ ] Acceso `anon`/`authenticated` denegado.
- [ ] Operadores con cuentas individuales y MFA.
