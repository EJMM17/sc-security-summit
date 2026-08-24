# Pagos con MercadoPago e IVA

> Estado: implementado en código, **no desplegado**. La migración
> `20260824120000_add_ticket_orders.sql` no se ha aplicado a ningún entorno.
> Antes de vender un solo acceso hay que completar la sección
> *Puesta en producción*.

## Qué cambia en el producto

Hasta ahora Eventbrite era dueño de todos los boletos individuales. A partir de
esta integración el sitio vende directamente los tres accesos publicados
(`plus`, `general`, `estudiante`), los cobra con MercadoPago Checkout Pro,
desglosa el IVA y captura datos fiscales para quien solicite CFDI.

Lo que **no** cambia:

- los pases corporativos y los patrocinios siguen siendo `inquiries`
  (cotización por correo, sin cobro en línea);
- el CFDI se timbra manualmente. El sitio captura, valida y almacena los datos
  fiscales; no hay PAC integrado;
- los CTAs genéricos de "comprar boleto" del resto del sitio (Header, Hero,
  Value, NetworkingHub, FinalCTA, MobileNav, landings de SEO) siguen apuntando
  a Eventbrite. **Sólo los botones de la sección de accesos apuntan a
  `/checkout`.** Decidir si Eventbrite se retira por completo es una decisión
  de negocio pendiente.

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

Pendiente y en este orden:

1. `npx supabase db start && npx supabase db reset --local` — validar que la
   migración aplica.
2. `npx supabase test db --local` — pgTAP `004_` y `005_` deben pasar.
   **Esto no se ha podido ejecutar todavía**: falta Docker en el entorno donde
   se escribió la migración.
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
10. Confirmar con el responsable de privacidad la retención de 5 años y la
    nueva categoría de datos fiscales en el Aviso de Privacidad — el aviso
    aprobado el 2026-07-30 **no** contempla datos fiscales ni pagos.

## Pendientes conocidos

- El `/admin` todavía no lista órdenes; hoy se consultan en Supabase Studio.
- No hay correo de confirmación de compra: el webhook registra el pago pero no
  dispara ninguna notificación. Reutilizar el outbox de `inquiry_notifications`
  es el siguiente paso natural.
- No hay control de cupo: nada impide vender más accesos que asientos.
- Reembolsos y contracargos se registran si MercadoPago los notifica, pero se
  operan desde el panel de MercadoPago.
