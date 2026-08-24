# Pagos con MercadoPago e IVA

> Estado: implementado y validado contra un PostgreSQL 16 local (migraciones
> aplicadas desde cero + 56 aserciones pgTAP en verde). **No desplegado**: las
> migraciones no se han aplicado a Supabase. Antes de vender un solo acceso hay
> que completar la sección *Puesta en producción*.

## Qué cambia en el producto

Hasta ahora Eventbrite era dueño de todos los boletos individuales. A partir de
esta integración el sitio vende directamente los tres accesos publicados
(`plus`, `general`, `estudiante`), los cobra con MercadoPago Checkout Pro,
desglosa el IVA y captura datos fiscales para quien solicite CFDI.

**Eventbrite quedó retirado del sitio.** No queda ningún enlace: todos los
CTAs (Header, Hero, Value, NetworkingHub, FinalCTA, MobileNav, sección de
accesos y las landings de SEO) apuntan a `/checkout`. Se eliminaron la
constante `EVENTBRITE_URL` y la variable `NEXT_PUBLIC_EVENTBRITE_URL`, y los
Términos y el Aviso de Privacidad ya no lo mencionan. Los boletos vendidos en
Eventbrite **antes** de este cambio siguen siendo válidos y se operan desde el
panel de Eventbrite; el sitio ya no los referencia.

Lo que **no** cambia:

- los pases corporativos y los patrocinios siguen siendo `inquiries`
  (cotización por correo, sin cobro en línea);
- el CFDI se timbra manualmente. El sitio captura, valida y almacena los datos
  fiscales; no hay PAC integrado.

## Reglas de IVA

Los precios publicados en `lib/content.ts` son **base gravable**, sin IVA. La
copy pública ya lo dice (`ui.taxNote` → "más I.V.A." / "plus VAT").

| Acceso | Base | IVA 16% | Total |
|---|---:|---:|---:|
| Plus | $2,500.00 | $400.00 | $2,900.00 |
| General | $900.00 | $144.00 | $1,044.00 |
| Estudiante | $650.00 | $104.00 | $754.00 |

Reglas de cálculo, en `lib/payments/tax.ts`:

- todo se opera en **centavos enteros**; no hay aritmética de punto flotante
  sobre importes;
- la tasa se expresa en puntos base (`1600` = 16%), no como decimal;
- el redondeo es **medio hacia arriba** (`applyRateHalfUp`), implementado con
  operaciones enteras;
- el impuesto se calcula **una vez sobre la línea completa**, no por unidad.
  Esto es lo que el SAT espera en un concepto de CFDI y evita que el total del
  CFDI difiera del importe capturado por MercadoPago;
- `record_ticket_order_payment` y `create_ticket_order` repiten la misma
  fórmula en SQL, así que un importe inconsistente no se puede persistir ni
  siquiera desde `psql`.

El navegador **nunca envía un importe**. Envía `tier` y `quantity`; el servidor
los cotiza contra `lib/payments/catalog.ts`, que es la única fuente de verdad
del dinero. `tests/payments/catalog.test.ts` falla si el catálogo se desvía de
los precios publicados en `lib/content.ts`.

## Datos fiscales (CFDI 4.0)

Se capturan **sólo** si el comprador marca "Necesito factura (CFDI)". Un pedido
sin esa casilla no almacena ningún identificador fiscal: viven en la tabla
aparte `ticket_order_invoice_details`.

Se valida en el borde (`lib/payments/rfc.ts`, `lib/payments/sat-catalogs.ts`):

- estructura del RFC (12 = persona moral, 13 = persona física), incluida la
  fecha embebida;
- `XAXX010101000` (público en general) se rechaza — pedir factura con él no
  tiene sentido. `XEXX010101000` (residente en el extranjero) sí se acepta;
- el **régimen fiscal** y el **uso de CFDI** deben corresponder al tipo de
  persona que implica el RFC. Ésta es la causa más común de rechazo por parte
  de un PAC, y se detecta mientras el comprador todavía está en la página;
- código postal de 5 dígitos, `00000` rechazado.

Los catálogos SAT incluidos son subconjuntos curados, no los catálogos
completos: ofrecer todo invitaría a combinaciones que el equipo de facturación
no puede timbrar para este concepto.

## Flujo de la petición

```text
components/TicketCheckoutForm (cliente, submission_id estable)
  → app/actions/checkout.ts            honeypot + Zod
  → server/use-cases/create-ticket-checkout.ts
       1. cotiza contra el catálogo del servidor
       2. rate limit (Upstash, misma ventana que los formularios)
       3. persiste la orden          ← frontera de éxito
       4. crea la preferencia en MercadoPago
       5. guarda el preference_id (fallo no fatal)
  → redirección a init_point de MercadoPago

MercadoPago → POST /api/webhooks/mercadopago
       1. verifica la firma HMAC (x-signature) y la antigüedad
       2. relee el pago desde la API con credenciales propias
       3. localiza la orden por external_reference
       4. record_ticket_order_payment (idempotente)
```

La orden se persiste **antes** de contactar a MercadoPago. Ésa es la propiedad
que hace seguro el webhook: una notificación sólo puede llegar para una orden
que ya existe, así que el webhook nunca tiene que inventar una fila a partir de
datos del proveedor.

### Idempotencia

Tres capas, todas necesarias:

1. **`submission_id` + hash canónico** (`lib/payments/canonical-payload.ts`).
   Mismo id y mismo hash = replay seguro; mismo id y hash distinto =
   `idempotency_conflict`, nunca se sobrescribe la orden original. El bloque de
   factura **sí** entra en el hash: pedir CFDI o cambiar el RFC es una orden
   materialmente distinta.
2. **`X-Idempotency-Key`** hacia MercadoPago, con la clave
   `ticket-order:<order_id>`, de modo que un reintento no genera una segunda
   preferencia de pago.
3. **`record_ticket_order_payment`**, que bloquea la fila (`for update`),
   ignora entregas duplicadas y nunca deja que una notificación tardía en
   `pending` degrade una orden ya `paid`.

## Seguridad

- El webhook exige firma HMAC válida y rechaza notificaciones con más de 5
  minutos de antigüedad. Sin `MERCADOPAGO_WEBHOOK_SECRET` **todo** se rechaza:
  falla cerrado.
- El cuerpo del webhook no se cree: sólo se toma el id y se relee el pago
  contra la API de MercadoPago.
- La URL de redirección se valida contra los hosts de MercadoPago en el
  servidor y otra vez en el cliente; una respuesta inesperada del proveedor no
  puede convertirse en un open redirect.
- `MERCADOPAGO_ACCESS_TOKEN` sólo acepta un token `APP_USR-` en Vercel
  Production y un token `TEST-` en cualquier otro entorno. Un cargo real desde
  una máquina de desarrollo es imposible por contrato de entorno.
- Las tablas nuevas tienen RLS activo y **cero políticas**: `anon` y
  `authenticated` no tienen ningún privilegio. Todo acceso pasa por la clave
  secreta del servidor.
- `service_role` puede leer, insertar y actualizar órdenes, pero **no
  borrarlas**; `ticket_order_events` es append-only.

## Privacidad

- Nombre, correo, teléfono, RFC, razón social y código postal **nunca** salen
  en logs, en Sentry ni en los eventos de la base de datos.
  `server/services/payment-observability.ts` acepta únicamente identificadores,
  importes y códigos técnicos; su tipo no debe ampliarse.
- `is_safe_ticket_order_event_metadata` impone la misma lista blanca en SQL.
- Las páginas de retorno (`/checkout/gracias`, `/pendiente`, `/error`) muestran
  el desglose y el id de la orden, pero **ningún dato personal ni fiscal**: la
  URL termina en historial, referrers y portapapeles.
- Retención: 5 años (`orderRetentionDateFrom`), por la obligación de conservar
  comprobantes fiscales, frente a los 18 meses de las `inquiries`.

## Entorno

| Variable | Local / dev | Preview | Production |
|---|---|---|---|
| `MERCADOPAGO_ACCESS_TOKEN` | `TEST-…` | prohibido | `APP_USR-…` |
| `MERCADOPAGO_WEBHOOK_SECRET` | requerido si hay token | prohibido | requerido si hay token |

Son un par indivisible: un checkout sin webhook verificado nunca confirma un
pago. Si faltan ambos, el checkout responde `provider_unavailable` y no se
cobra nada — falla cerrado.

La clave pública de MercadoPago **no** se usa ni se declara: Checkout Pro sólo
necesita el access token del servidor. Guárdala para el día que se monten los
Bricks en el navegador, que exigirán además ampliar la CSP del middleware.

## Puesta en producción

Las migraciones y sus pruebas **ya se ejecutaron** contra un PostgreSQL 16
local con roles `anon`/`authenticated`/`service_role` y pgTAP: ambas aplican
desde cero y las 56 aserciones de `004_`, `005_` y `006_` pasan. Eso encontró y
corrigió dos defectos reales (`pg_catalog.coalesce` y `pg_catalog.greatest`, que
son construcciones SQL y no funciones del catálogo).

Falta, y en este orden:

1. `npx supabase db start && npx supabase db reset --local` — validar el
   historial completo de migraciones, incluidas las heredadas, con el CLI
   fijado. La validación local se hizo aplicando sólo las dos migraciones
   nuevas, que son autocontenidas.
2. `npx supabase test db --local` — confirmar `004_`, `005_` y `006_` con el
   runner oficial.
3. `npx supabase db lint --local --level error --fail-on error`.
4. `npm run db:types` y borrar el contrato local `TicketOrderDatabase` de
   `server/repositories/ticket-order-repository.ts`, que existe sólo mientras
   `lib/database.types.ts` no conozca las tablas nuevas.
5. Backup verificado y aplicación de la migración en Production, siguiendo
   `docs/DEPLOYMENT.md`. Revisar Security y Performance Advisors.
6. Configurar en Vercel Production `MERCADOPAGO_ACCESS_TOKEN` (APP_USR-) y
   `MERCADOPAGO_WEBHOOK_SECRET`.
7. En el panel de MercadoPago: registrar el webhook
   `https://scsecuritysummit.com/api/webhooks/mercadopago` para el tópico
   `payment` y copiar el secreto de firma.
8. Desplegar y hacer una compra controlada de prueba: una con CFDI y una sin
   CFDI. Verificar orden, evento, importe, estado y correo.
9. Confirmar con el responsable fiscal el proceso de timbrado a 72 horas y
   quién opera `invoice_status` / `cfdi_uuid`.
10. **Aprobación de privacidad del aviso `2026-08-24`.** El Aviso de
    Privacidad y los Términos ya se reescribieron para cubrir pagos en sitio,
    la categoría de datos fiscales y la retención de cinco años, y
    `INQUIRY_CONSENT_VERSION` se subió a `2026-08-24`. Esa versión **todavía no
    está aprobada** por la persona responsable de privacidad. El texto describe
    con precisión lo que hace el sistema; la aprobación formal es un trámite
    aparte y es bloqueante para vender.

## Cupo

`public.ticket_capacity` limita cuántos asientos pueden comprometerse, en
total y por tipo de acceso. **Es opt-in**: un ámbito sin fila es ilimitado, así
que nada bloquea una venta hasta que operaciones configure un número real.
Mientras la tabla esté vacía, el control existe pero no restringe nada.

Para activarlo, inserta filas desde Supabase Studio:

```sql
insert into public.ticket_capacity (scope, total_seats, hold_minutes)
values ('total', 300, 30), ('estudiante', 40, 30);
```

Cuentan como comprometidos los pedidos `paid` e `in_process`, más los
`pending` cuya ventana de reserva (`hold_minutes`) sigue viva. Un checkout
abandonado libera sus lugares al vencer esa ventana, que debe ser igual o mayor
que la expiración de la preferencia de MercadoPago (30 minutos).

`create_ticket_order` toma un advisory lock antes de verificar el cupo, así que
dos compradores concurrentes no pueden pasar ambos un chequeo en el que sólo
cabe uno. Un pedido que no cabe devuelve `sold_out` y **no** almacena orden. Un
replay se responde antes del chequeo de cupo: un evento agotado nunca rechaza a
alguien que ya tiene su orden.

## Correos de confirmación

Cuando una orden pasa a `paid`, un trigger encola dos correos en
`public.ticket_order_notifications`: el comprobante para el comprador y el
aviso interno para el buzón de operaciones. El outbox replica el contrato del
de `inquiries`: lease de 15 minutos, cinco intentos, backoff 1/5/15/60 minutos
y registro append-only de cada intento.

El webhook intenta el envío inmediato; lo que falle se queda en el outbox y lo
reintenta el cron. El cron `/api/cron/inquiry-notifications` drena **ambas**
colas en la misma corrida de cinco minutos; si cualquiera falla, la corrida se
reporta con 500 para que el fallo sea visible.

El comprobante del comprador incluye el desglose base/IVA/total y si se
solicitó CFDI, pero **nunca repite el RFC, la razón social ni el código
postal**: un buzón de correo no es lugar para duplicar la identidad fiscal de
alguien.

## Operación en /admin

`/admin/ordenes` lista las compras con filtros por estado y por estado de
factura, un buscador y el resumen de cobrado con IVA. El detalle
(`/admin/ordenes/[id]`) muestra la compra, el comprador, el pago, los datos
fiscales y el estado de cada correo.

La superficie de escritura del panel es mínima y deliberada: sólo
`invoice_status`, `cfdi_uuid`, `owner` e `internal_notes`. Importes, datos del
comprador, identificadores fiscales, estado del pago y consentimiento son
evidencia recibida y son de sólo lectura. No se puede marcar una factura como
emitida sin capturar su UUID fiscal, ni operar el flujo de factura en una orden
cuyo comprador no la pidió.

El cupo se muestra en el panel pero **no se edita desde ahí**: `service_role`
sólo tiene `select` sobre `ticket_capacity`. Se configura en Studio.

## Pendientes conocidos

- No hay timbrado automático: el CFDI lo emite el equipo dentro de 72 horas.
- Reembolsos y contracargos se registran si MercadoPago los notifica, pero se
  operan desde el panel de MercadoPago; la cancelación del CFDI o la nota de
  crédito es manual.
- No hay check-in digital: el comprobante de compra es el documento que se
  presenta el día del evento.
