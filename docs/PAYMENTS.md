# Pagos con MercadoPago e IVA

> Estado: implementado y validado contra un PostgreSQL 16 local. El historial
> **completo** de migraciones (21 archivos, incluidas las heredadas) aplica
> desde cero, y las seis suites pgTAP pasan con 135 aserciones en verde.
> `lib/database.types.ts` ya está regenerado desde ese esquema, así que el
> contrato local `TicketOrderDatabase` desapareció y el repositorio se
> typechequea contra las tablas reales. **No desplegado**: las migraciones no se
> han aplicado a Supabase. Antes de vender un solo acceso hay que completar la
> sección *Puesta en producción*.

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

### Pases corporativos: ahora se cobran en el sitio

El bloque corporativo dejó de ser una solicitud y pasó a ser una **compra**.
Va por el mismo camino que un acceso individual —Server Action, catálogo del
servidor, `ticket_orders`, preferencia de MercadoPago, webhook, recibo— con
tres diferencias:

- el tier es `corporativo` y **no** está en `TICKET_TIER_IDS`: no es un precio
  publicado, sino un bloque cuyo precio unitario sale de `quoteCorporateOrder()`;
- la cantidad se elige con un **selector de accesos** (menos/más, atajos y el
  desplegable `CORPORATE_SEAT_OPTIONS`, de 2 a 25). El límite duro del servidor
  sigue siendo `CORPORATE_MAX_SEATS` (200): un bloque mayor se acuerda con el
  equipo;
- la orden lleva un **roster**: un participante nombrado por acceso, en
  `public.ticket_order_attendees`, que es lo que necesita la constancia DC-3.
  `create_ticket_order()` lo escribe en la misma transacción y rechaza un
  roster que no coincida con la cantidad comprada.

### Descuento por volumen: una sola regla

El 25% dejó de ser una ventaja exclusiva del bloque corporativo. Es una regla
del catálogo (`VOLUME_DISCOUNT_MIN_QUANTITY`, `VOLUME_DISCOUNT_BASIS_POINTS`)
que se aplica **a partir del quinto acceso** a cualquier tier marcado
`volumeDiscount` —hoy sólo Plus— y a todo bloque corporativo. Cinco Accesos
Plus cuestan lo mismo comprados uno a uno que dentro de un bloque
(2,500 → 1,875 MXN por acceso).

El descuento se aplica siempre **al precio unitario**, nunca al total, para que
la línea siga siendo un múltiplo exacto del unitario. De eso dependen la
invariante de importes de la base de datos, el `unit_price` de la preferencia y
el CFDI. `quoteVolumePricing()` es lo que lee el comprador (precio de lista,
descuento y total) y `quoteOrder()` lo que se cobra; ambos derivan del mismo
unitario descontado.

Toda orden —individual o corporativa— acepta además un **referido opcional**
(`referral_source`): texto libre que escribe el comprador, nunca un
identificador sobre el que el sitio actúe.

### Códigos de descuento de convenio (opcionales)

El checkout acepta un **código opcional**. Quien no escribe nada paga el precio
publicado; quien escribe algo que no es un código válido recibe un aviso y
**puede pagar igual**, al precio publicado. En ningún estado el campo bloquea
el botón de pago ni se presenta como obligatorio.

Los códigos viven en `public.coupons` y **sólo ahí**: el bundle del navegador
nunca recibe la lista. El navegador manda una cadena y el servidor contesta si
compró un descuento. Los convenios vigentes
(`UVB2026`, `IIIES2026`, `PVILLAFLORIDA2026`, `CANACAR2026`) valen 20%, y
`AAARAC2026` vale 25%. El porcentaje es de cada cupón, no de "ser convenio":
vive en `coupons.discount_basis_points` y cada código puede valer otra cosa.

Antes de buscarlo el código se normaliza: se quitan espacios y se pasa a
mayúsculas, así que `uvb2026`, ` Uvb2026 ` y `UVB2026` son el mismo cupón.

Como el descuento por volumen, el cupón se aplica **al precio unitario**, de
modo que la línea sigue siendo múltiplo exacto del unitario y el IVA se vuelve
a extraer del bruto descontado (`applyCouponToQuote`). Las dos reglas se
componen: cinco Accesos Plus con `UVB2026` son 2,500 → 1,875 (volumen) → 1,500
(cupón) por acceso.

Dos validaciones, y sólo la segunda decide:

1. `validateDiscountCode` (Server Action) contesta al formulario para que el
   comprador vea el precio antes de decidir. Es informativa.
2. `createTicketCheckoutUseCase` vuelve a hacer todo el cálculo antes de crear
   la preferencia: cotiza el tier y la cantidad contra el catálogo, relee el
   cupón en Supabase, comprueba `active` y la ventana, recalcula el descuento y
   cobra ese resultado. Después `create_ticket_order` lo verifica una tercera
   vez dentro de la transacción y reserva el uso.

El navegador **nunca** manda un importe: manda tier, cantidad y código.
Manipular por DevTools el porcentaje, el subtotal o el total no cambia nada de
lo que el servidor calcula ni de lo que MercadoPago cobra.

El formulario sólo envía un código que el servidor ya declaró aplicable. Si
entre ese momento y el pago el cupón dejó de aplicar, la acción responde
`discount_code_changed`: no se crea orden, el formulario quita el código y el
comprador puede pagar al precio publicado. Nunca se le cobra en silencio un
importe distinto del que vio.

La orden guarda el convenio junto con los importes: `coupon_id`,
`coupon_code`, `coupon_discount_type`, `coupon_discount_basis_points`,
`coupon_list_unit_price_cents` y `coupon_discount_cents`. El subtotal previo al
descuento es `coupon_list_unit_price_cents * quantity` y el total posterior es
`total_cents`, así que las ventas y los descuentos por convenio se consultan
sin depender de un cupón que después cambie.

`public.coupon_uses` registra un uso por orden: `reserved` al crear la orden,
`used` cuando se paga y `released` cuando la orden se cancela, se rechaza, se
reembolsa o llega a contracargo. Lo mueve un trigger sobre el estado de la
orden, así que el webhook, la reconciliación y el barrido lo obtienen sin
código extra y una sola vez. `max_uses` ya se respeta dentro de la transacción;
`max_uses_per_customer`, `minimum_purchase_cents` y `maximum_discount_cents`
son columnas listas para una pantalla de administración que todavía no existe.
Los cupones se administran en Studio: `service_role` sólo puede **leer**
`public.coupons`.

Las `inquiries` corporativas y de patrocinio ya recibidas siguen guardadas y se
consultan desde `/admin`, pero el sitio ya no crea ninguna nueva: la sección de
patrocinio se retiró por completo (bloque del landing, formulario, `/sponsors`
y `/media-kit`), igual que la sección "a quién va dirigido".

Lo que **no** cambia:

- el CFDI se timbra manualmente. El sitio captura, valida y almacena los datos
  fiscales; no hay PAC integrado.

## Reglas de IVA

Los precios publicados en `lib/content.ts` **ya incluyen IVA**: el número que
ve el visitante es el total que paga y el 16% va dentro. La copy pública lo
dice (`ui.taxNote` → "IVA incluido" / "VAT included"). El vendedor absorbe el
impuesto; el precio publicado no cambió al hacer el cambio.

| Acceso | Total publicado | Base gravable | IVA 16% incluido |
|---|---:|---:|---:|
| Plus | $2,500.00 | $2,155.17 | $344.83 |
| General | $900.00 | $775.86 | $124.14 |
| Estudiante | $650.00 | $560.34 | $89.66 |
| Corporativo (≥5 accesos, por acceso) | $1,875.00 | $1,616.38 | $258.62 |

Reglas de cálculo, en `lib/payments/tax.ts`:

- todo se opera en **centavos enteros**; no hay aritmética de punto flotante
  sobre importes;
- la tasa se expresa en puntos base (`1600` = 16%), no como decimal;
- la base se **extrae del bruto** (`extractTaxFromGross`) con redondeo medio
  hacia arriba y el impuesto es el resto, de modo que base + IVA es exactamente
  el importe cobrado y la división nunca crea ni pierde un centavo;
- la extracción se hace **una vez sobre la línea completa**, no por unidad.
  Esto es lo que el SAT espera en un concepto de CFDI y evita que el total del
  CFDI difiera del importe capturado por MercadoPago;
- `create_ticket_order` repite la misma fórmula en SQL y la restricción
  `ticket_orders_amounts_check` exige `subtotal + IVA = precio unitario ×
  cantidad`, así que un importe inconsistente no se puede persistir ni siquiera
  desde `psql`;
- la preferencia de MercadoPago lleva **un solo ítem** al precio bruto. Una
  línea de IVA aparte volvería a cobrar un impuesto que ya está dentro.

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

### Medios de pago

La preferencia declara `payment_methods` de forma explícita:

- `excluded_payment_types: ["ticket", "atm"]`. Son medios **offline**: el
  comprador se lleva un comprobante y paga horas o días después, en OXXO o en
  una ventanilla. El cupo retiene un pedido `pending` durante `hold_minutes`
  (30 min) y la preferencia expira en el mismo plazo, así que un comprobante
  offline nace muerto o se liquida cuando sus lugares ya se liberaron a otra
  persona. **Habilitarlos exige primero subir las dos ventanas** por encima del
  vencimiento del comprobante (p. ej. tres días en `hold_minutes`, en
  `expiration_date_to` y en `CHECKOUT_EXPIRY_MINUTES`); no basta con quitar la
  exclusión.
- `installments: 12`. El costo de las parcialidades lo asume el comprador.

Los ítems declaran `category_id: "tickets"`: es el dato de industria que
MercadoPago usa para puntuar el riesgo de la operación y aprobarla.

### Operar sin el secreto del webhook

El secreto **no** es una credencial aparte que haya que conseguir: MercadoPago
lo genera al registrar la URL del webhook en su panel, en el mismo paso. Hasta
entonces el sitio puede vender igual, porque la confirmación no depende sólo de
la notificación.

- El webhook **falla cerrado**: sin `MERCADOPAGO_WEBHOOK_SECRET` rechaza todo
  con 401. Nunca se acepta una notificación sin firma verificada.
- La confirmación la sostiene la reconciliación: las páginas de retorno para el
  comprador que vuelve, y el barrido del cron para el que pagó y cerró la
  pestaña.
- El contrato de entorno lo refleja: `MERCADOPAGO_ACCESS_TOKEN` se acepta solo,
  pero `MERCADOPAGO_WEBHOOK_SECRET` sin token se rechaza — un secreto de firma
  no sirve de nada sin el token con el que se relee el pago.

Es un modo de arranque válido, no el destino: sin webhook la confirmación tarda
hasta un ciclo de cron en vez de segundos. Registra el webhook en cuanto
puedas.

La **public key** de MercadoPago no se usa ni se declara. Checkout Pro sólo
necesita el access token del servidor; la public key hace falta el día que se
monten los Bricks en el navegador, que además exigirán ampliar la CSP del
middleware. Guárdala, pero no hay dónde ponerla hoy.

### Reconciliación cuando el webhook no llega

El webhook es el camino principal y sigue siendo la autoridad, pero no es el
único. Si la notificación nunca llega —URL mal registrada en el panel, caída
del proveedor, entrega perdida mientras el sitio estaba abajo— un pedido pagado
se quedaría `pending` para siempre: sin comprobante para el comprador, sin
lugar comprometido y sin nada en `/admin` que delate el problema.

`server/use-cases/reconcile-ticket-order.ts` cierra ese hueco desde las páginas
de retorno. Sólo actúa sobre un pedido `pending`: consulta
`GET /v1/payments/search?external_reference=<order_id>`, y si encuentra un pago
en estado terminal lo aplica con el mismo `record_ticket_order_payment`
idempotente y dispara los correos pendientes.

- Un pedido en estado terminal **no** se vuelve a leer: una notificación tardía
  en `pending` nunca puede degradar un pedido ya `paid`.
- Un pedido puede acumular varios intentos (una tarjeta rechazada y luego una
  aprobada); el pago aprobado gana sobre cualquier otro.
- La reconciliación está limitada por `reconcile:<order_id>` en la misma
  ventana de Upstash, así que refrescar la página de retorno no se convierte en
  una ráfaga de llamadas al proveedor. Quedar limitado no es un error: se
  muestra el estado almacenado y el webhook o la siguiente visita se ponen al
  día.

#### Barrido del cron

Las páginas de retorno sólo reconcilian para el comprador que **vuelve**. El
que paga y cierra la pestaña dejaría su pedido en `pending` para siempre, así
que la corrida de cron de cada cinco minutos también barre pedidos pendientes
(`server/use-cases/sweep-pending-ticket-orders.ts`).

- Sólo toca pedidos con más de 15 minutos: por debajo de eso el comprador
  todavía puede estar en el checkout de MercadoPago y preguntar sería
  malgastar una llamada.
- Ignora los de más de 7 días: la preferencia expiró hace mucho y el proveedor
  no tiene nada nuevo que decir.
- Procesa en serie y con lote acotado (20 por corrida, 50 como máximo): una
  ráfaga en paralelo es justo cómo un barrido se gana un rate limit del
  proveedor.
- Se salta el límite por pedido, que existe para el comprador que refresca; si
  lo compartiera, ese comprador podría dejar sin presupuesto al barrido que
  existe precisamente para quien nunca volvió.
- Si el checkout está apagado (sin credenciales) devuelve un barrido vacío en
  vez de fallar la corrida.

### Checkout abandonado

Un comprador que cierra la pestaña nunca genera un pago: MercadoPago no tiene
nada que notificar y la reconciliación no tiene nada que aplicar. Sin más, el
pedido se queda `pending` mientras exista la fila, el panel no distingue un
abandono de alguien que está pagando ahora mismo, y el barrido vuelve a
preguntar por él cada cinco minutos hasta que caduca la ventana de siete días.

Por eso la misma corrida cierra los abandonos, con
`public.expire_stale_ticket_orders(uuid[], integer)`:

- **Sólo expira lo que el proveedor confirmó.** El barrido nombra únicamente
  los pedidos que acaba de consultar y para los que MercadoPago respondió que
  no tiene ningún pago. La antigüedad por sí sola no prueba abandono —un pago
  puede estar en un estado no terminal que el sitio aún no registró— y un
  proveedor inalcanzable no expira nada: sin respuesta, "abandonado" y "no
  pude comprobar" se ven igual.
- **La base vuelve a comprobar todo.** Sigue `pending`, sin
  `provider_payment_id` y con más de 60 minutos, dentro de la misma sentencia
  que escribe el cambio y con `for update skip locked`, así que un pago que
  aterriza en ese instante gana.
- **El piso son 30 minutos**, la expiración de la preferencia
  (`CHECKOUT_EXPIRY_MINUTES`). El parámetro se acota, no se obedece.
- El pedido queda `cancelled` con `provider_status = 'expired'`, que no colisiona
  con ningún estado real de MercadoPago y deja ver en `/admin` la diferencia
  entre un abandono y una cancelación del comprador. Se registra un evento
  `order_expired`.
- **Expirar no cierra el dinero.** `record_ticket_order_payment` sigue moviendo
  un pedido `cancelled` a `paid` si un pago real llega tarde por el webhook, y
  el disparador del comprobante actúa como siempre.
- El seguimiento de venta cuenta esos pedidos como **abandonados**, no como
  venta perdida: nadie intentó pagar y nada fue rechazado, así que la tasa de
  conversión conserva su significado.

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
   `pending` degrade una orden ya `paid`. Además **sólo marca `paid` por el
   total guardado**: si MercadoPago informa un importe distinto, se registra el
   evento `payment_amount_mismatch`, la orden no se marca pagada y el cupón no
   se consume. El webhook y la reconciliación mandan el importe capturado en
   centavos (`capturedAmountCents`); una moneda distinta de MXN no puede
   coincidir jamás.

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
| `MERCADOPAGO_WEBHOOK_SECRET` | opcional | prohibido | opcional, recomendado |

El token va solo si todavía no registraste el webhook; el secreto **sin** token
se rechaza. Sin ninguno de los dos el checkout responde `provider_unavailable`
y no se cobra nada — falla cerrado.

## Puesta en producción

Las migraciones y sus pruebas **ya se ejecutaron** contra un PostgreSQL 16
local con roles `anon`/`authenticated`/`service_role` y pgTAP: ambas aplican
desde cero y las 56 aserciones de `004_`, `005_` y `006_` pasan. Eso encontró y
corrigió dos defectos reales (`pg_catalog.coalesce` y `pg_catalog.greatest`, que
son construcciones SQL y no funciones del catálogo).

Ya hecho:

- El historial **completo** de migraciones aplica desde cero sobre PostgreSQL
  16 con los roles `anon`/`authenticated`/`service_role`: los 21 archivos, no
  sólo los dos nuevos.
- Las seis suites pgTAP pasan: 135 aserciones, cero fallos de aplicación.
  Ninguna función de `public` es ejecutable por `anon` ni por `authenticated`.
- `lib/database.types.ts` regenerado desde ese esquema. El contrato local
  `TicketOrderDatabase` y los `as never` de los repositorios de órdenes se
  eliminaron: ahora el acceso a las tablas nuevas se typechequea de verdad.
- `npm run typecheck`, `npm run lint`, `npm test` (366) y `npm run build` en
  verde.

Falta, y en este orden:

1. `npx supabase db reset --local` y `npx supabase test db --local` con el CLI
   fijado y Docker, para confirmar lo anterior con el runner oficial en lugar
   de un PostgreSQL levantado a mano.
2. `npx supabase db lint --local --level error --fail-on error`.
3. Backup verificado y aplicación de la migración en Production, siguiendo
   `docs/DEPLOYMENT.md`. Revisar Security y Performance Advisors.
4. Configurar en Vercel Production `MERCADOPAGO_ACCESS_TOKEN` (APP_USR-) y
   `MERCADOPAGO_WEBHOOK_SECRET`, ambos **sólo** en el target Production.
5. En el panel de MercadoPago: registrar el webhook en la ruta que el sitio
   expone de verdad —
   `https://scsecuritysummit.com/api/webhooks/mercadopago`, no
   `/api/mercadopago/webhook` — para el tópico
   `payment` y copiar el secreto de firma. El botón *Simular notificación* del
   panel envía un `data.id` inventado; el webhook lo autentica, no lo encuentra
   en la API y responde 500 a propósito, porque un 500 es lo que hace que
   MercadoPago reintente un fallo real. **Una simulación fallida no significa
   que la integración esté mal**: la prueba válida es el pago controlado del
   paso siguiente.
6. Desplegar y hacer una compra controlada de prueba: una con CFDI y una sin
   CFDI. Verificar orden, evento, importe, estado y correo.
7. Confirmar con el responsable fiscal el proceso de timbrado a 72 horas y
   quién opera `invoice_status` / `cfdi_uuid`.
8. **Aprobación de privacidad del aviso `2026-08-24`.** El Aviso de
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

`/admin/boletos` es la misma información vista por asiento en lugar de por
orden: un renglón por acceso pagado, con el nombre del participante cuando la
orden trae roster corporativo y el del comprador cuando no. Encima de la tabla
va el seguimiento de venta —boletos vendidos, órdenes pagadas, cobrado con
IVA, IVA incluido, promedio por boleto, boletos de los últimos siete días,
asientos aún en proceso y conversión—, el desglose por tipo de acceso, la
venta por día en zona horaria del evento, el origen declarado por el comprador
(`referral_source`) y el cupo. `/admin/boletos/lista.csv` descarga la lista
filtrada para la mesa de registro y para los DC-3.

Ni el boleto ni su folio son tablas: el folio `SCS-<orden>-<asiento>` y el
importe por asiento se derivan de la orden en `lib/admin/tickets.ts`. El
importe se reparte sin perder centavos, así que la suma de los asientos es
exactamente lo cobrado. El folio es referencia interna del panel y no sustituye
al comprobante de MercadoPago. `/admin/boletos` no escribe nada: la única
escritura sobre órdenes sigue siendo la de `/admin/ordenes/[id]`.

El cupo se muestra en el panel pero **no se edita desde ahí**: `service_role`
sólo tiene `select` sobre `ticket_capacity`. Se configura en Studio.

## Pendientes conocidos

- No hay timbrado automático: el CFDI lo emite el equipo dentro de 72 horas.
- Reembolsos y contracargos se registran si MercadoPago los notifica, pero se
  operan desde el panel de MercadoPago; la cancelación del CFDI o la nota de
  crédito es manual.
- No hay check-in digital: el comprobante de compra es el documento que se
  presenta el día del evento. `/admin/boletos` y su CSV son la lista de
  asistentes, no un control de acceso: no registran entradas ni marcan
  asistencia.
