# Plan de implementación — solicitudes en Supabase

Estado: implementación local ejecutada; activación remota pendiente de gates.  
Última revisión: 2026-07-29.  
Alcance: solicitudes de patrocinio y pases corporativos/equipos.  
Fuera de alcance: venta individual, pagos, folios y administración de asistentes.

## 0. Estado de ejecución

Este documento conserva el diseño y la secuencia de decisiones. La fuente
canónica del código actual es `docs/PROJECT_CONTEXT.md`.

| Área | Estado al 2026-07-29 |
|---|---|
| Esquema, pgTAP, tipos y baseline local | Implementado en el repositorio |
| Dominio, formularios, idempotencia y outbox | Implementado en el repositorio |
| Contrato env, CI, cron y runbooks | Implementado en el repositorio |
| Reconciliación/aplicación remota | Pendiente; requiere operador y backup |
| Aviso y retención | Borrador técnico; pendiente aprobación legal |
| Preview | Pendiente migración, secretos, smoke tests y ventana de 48 h |
| Production | No activada por esta implementación local |

Las descripciones de “estado actual” que siguen son el snapshot previo a la
implementación y explican por qué se tomó cada decisión; no deben usarse como
inventario vigente.

## 1. Decisión de producto

Supabase será el sistema de registro operativo de los dos formularios actuales:

1. Solicitud de pase corporativo para equipos de hasta 10 personas.
2. Solicitud de patrocinio.

Eventbrite seguirá siendo el único sistema para comprar y administrar accesos
individuales. No se reactivarán `registros`, folios, pagos, Conekta ni las rutas
retiradas de `/admin`.

La base de datos será la fuente de verdad de cada solicitud. Resend dejará de ser
el único registro y pasará a ser un canal de notificación para el equipo.

## 2. Principios que no se negocian

- Una solicitud se considera recibida únicamente cuando quedó persistida.
- El correo se envía después de persistir; nunca antes.
- Un fallo de Resend no elimina ni invalida una solicitud guardada.
- Un reintento del navegador no crea duplicados.
- El navegador nunca se conecta directamente a Supabase.
- La clave secreta de Supabase solo existe en Vercel y en entornos autorizados.
- No se reutiliza la tabla histórica `public.registros`.
- No se modifica producción directamente desde Table Editor o SQL Editor.
- Todo cambio de esquema nace en una migración versionada y probada.
- CI no necesita secretos de producción.
- `SKIP_ENV_VALIDATION=1` puede seguir usándose en CI, pero únicamente en los
  pasos de build que no disponen de integraciones reales.
- La venta individual y los datos de Eventbrite permanecen fuera de esta base.

## 3. Snapshot previo a la implementación

### Aplicación

- Los dos formularios terminan en `app/actions/inquiries.ts`.
- El flujo actual es honeypot → Zod → Upstash → Resend.
- No hay persistencia ni idempotencia.
- `AttributionCapture` existe, pero los formularios no incluyen actualmente sus
  valores como campos.
- Si la Server Action lanza una excepción inesperada, la interfaz puede quedar
  en estado `sending`.
- Las pruebas actuales no cubren directamente `submitInquiry`.
- El aviso de privacidad afirma que los formularios no se almacenan en ninguna
  base de datos. Debe cambiar antes de activar persistencia.

### Supabase

El proyecto remoto “Summit” está activo y conserva la arquitectura anterior:

- `public.registros`
- `public.admins`
- `public.app_config`
- `public.app_secrets`
- `public.audit_log`
- `public.email_events`

Estas tablas no forman parte del nuevo flujo. Se preservarán sin cambios hasta
que exista una decisión independiente de archivo o eliminación.

El historial remoto contiene migraciones que no se corresponden uno a uno con
los SQL locales. Los archivos locales incluyen además nombres duplicados y SQL
que no constituye un baseline reproducible. Por tanto, ejecutar
`supabase db push` sobre el estado actual no es una operación autorizada.

El Security Advisor reporta `pg_net` instalado en `public`. Este hallazgo debe
investigarse y resolverse o justificarse durante la fase de baseline; no bloquea
la redacción del plan, pero sí el cierre de la implementación.

La revisión de grants heredados encontró privilegios demasiado amplios para
`anon` y `authenticated`, incluidos privilegios que RLS no gobierna, como
`TRUNCATE`. El endurecimiento del legado se hará en una migración separada,
reversible y probada; no se mezclará con la creación del nuevo dominio.

## 4. Arquitectura objetivo

```text
Formulario
  │
  ├─ UUID estable de envío
  ├─ honeypot
  ├─ validación Zod
  └─ rate limit
       │
       ▼
Server Action
  │
  ├─ INSERT idempotente en Supabase
  │    ├─ inquiries
  │    └─ notification pendiente
  │
  ├─ intento inmediato de notificación
  │    └─ Resend
  │
  └─ respuesta al usuario
       ├─ persistido: éxito
       └─ no persistido: error recuperable

Cron de Vercel
  └─ reintenta notificaciones pendientes o transitorias
```

### Semántica de éxito

| Persistencia | Correo | Resultado al usuario | Estado interno |
|---|---|---|---|
| Éxito | Éxito | Éxito | Solicitud guardada, notificación enviada |
| Éxito | Fallo | Éxito | Solicitud guardada, notificación pendiente |
| Fallo | No se intenta | Error | No se recibió la solicitud |
| Duplicado del mismo envío | Ya existente | Éxito | Se devuelve el registro original |
| Colisión de UUID con datos distintos | No se intenta | Error | Evento de seguridad/idempotencia |

## 5. Modelo de datos

Se utilizará una tabla discriminada porque ambos formularios comparten el mismo
ciclo operativo y la mayoría de sus campos. Separarlos obligaría a duplicar
estados, consultas, índices, retención y herramientas de operación.

### `public.inquiries`

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `submission_id` | `uuid` | `NOT NULL UNIQUE`, generado por el formulario |
| `payload_hash` | `bytea` | SHA-256 del payload canónico, exactamente 32 bytes |
| `kind` | `text` | `corporate` o `sponsor` |
| `status` | `text` | `new`, `contacted`, `qualified`, `proposal_sent`, `won`, `lost`, `archived` |
| `contact_name` | `text` | 2–160 caracteres |
| `email` | `text` | 3–255, normalizado a minúsculas |
| `phone` | `text` | 7–30 caracteres |
| `company` | `text` | 2–160 caracteres |
| `job_title` | `text` nullable | Obligatorio para `corporate` |
| `requested_seats` | `smallint` nullable | Obligatorio para `corporate`, entre 2 y 10 |
| `interest` | `text` nullable | Obligatorio para `sponsor`, 10–1200 caracteres |
| `language` | `text` | `es` o `en` |
| `consent_version` | `text` | Versión explícita del aviso aceptado |
| `consented_at` | `timestamptz` | Momento de aceptación |
| `utm_source` | `text` nullable | Máximo 512 |
| `utm_medium` | `text` nullable | Máximo 512 |
| `utm_campaign` | `text` nullable | Máximo 512 |
| `utm_term` | `text` nullable | Máximo 512 |
| `utm_content` | `text` nullable | Máximo 512 |
| `landing_page` | `text` nullable | Path local sin query/hash, máximo 2048 |
| `referrer` | `text` nullable | Solo origen HTTP(S), máximo 2048 |
| `first_touch_at` | `timestamptz` nullable | Atribución |
| `last_touch_at` | `timestamptz` nullable | Atribución |
| `owner` | `text` nullable | Responsable interno |
| `internal_notes` | `text` nullable | Máximo operativo definido en DB |
| `next_follow_up_at` | `timestamptz` nullable | Seguimiento |
| `retention_until` | `date` | Fecha calculada; la política final requiere aprobación antes de Production |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` |

### Restricciones discriminadas

- `corporate`: `job_title` y `requested_seats` son obligatorios; `interest` es
  `NULL`.
- `sponsor`: `interest` es obligatorio; `job_title` y `requested_seats` son
  `NULL`.
- `first_touch_at <= last_touch_at` cuando ambos existen.
- No se impone unicidad sobre `email`: una persona puede realizar solicitudes
  legítimas en momentos o categorías distintas.
- No se almacena IP ni user-agent. Upstash puede utilizar IP para rate limiting,
  pero la base aplica minimización de datos.
- Un `submission_id` existente con el mismo `payload_hash` es un replay seguro;
  con un hash distinto es un conflicto y nunca actualiza la fila original.

### `public.inquiry_notifications`

Implementa una outbox pequeña y durable para que el correo sea recuperable.

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` | PK |
| `inquiry_id` | `uuid` | FK a `inquiries`, `ON DELETE CASCADE` |
| `channel` | `text` | Inicialmente `email` |
| `template` | `text` | `corporate_internal_v1` o `sponsor_internal_v1` |
| `status` | `text` | `pending`, `processing`, `sent`, `retry`, `dead` |
| `attempt_count` | `smallint` | `0..5` |
| `next_attempt_at` | `timestamptz` | Índice parcial para pendientes |
| `provider_message_id` | `text` nullable | ID de Resend |
| `last_error_code` | `text` nullable | Código técnico sin PII |
| `last_error_at` | `timestamptz` nullable | Diagnóstico |
| `sent_at` | `timestamptz` nullable | Entrega aceptada por proveedor |
| `created_at` | `timestamptz` | Auditoría |
| `updated_at` | `timestamptz` | Auditoría |

Restricción única: `(inquiry_id, channel, template)`.

Un trigger `AFTER INSERT` sobre `inquiries` crea la notificación pendiente
dentro de la misma transacción. La función del trigger:

- no será `SECURITY DEFINER`;
- fijará explícitamente `search_path = ''`;
- usará nombres de esquema completos;
- no tendrá permiso de ejecución pública innecesario.

### `public.inquiry_notification_attempts`

Registro append-only de cada intento. Contiene `notification_id`,
`attempt_number`, `result`, `provider_message_id`, `error_code` sanitizado,
`duration_ms` y `attempted_at`.

- No admite `UPDATE` ni `DELETE` desde la aplicación.
- Nunca guarda destinatario, asunto, cuerpo del correo o error con PII.
- `notification_id` tiene FK e índice explícito.
- Permite distinguir una caída temporal de un fallo permanente sin depender de
  logs efímeros.

### `public.inquiry_events`

Historial append-only para cambios operativos relevantes:

- `created`
- `status_changed`
- `notification_sent`
- `notification_failed`
- `assigned`
- `note_updated`
- `archived`

Campos: `id`, `inquiry_id`, `event_type`, `actor`, `from_value`, `to_value`,
`metadata`, `created_at`. `metadata` no puede contener nombre, correo, teléfono
ni texto libre del formulario.

El FK `inquiry_id` tendrá índice explícito, como exige la práctica recomendada
de PostgreSQL.

## 6. Seguridad

### Acceso desde la aplicación

- Instalar y fijar una versión exacta de `@supabase/supabase-js`.
- Usar `SUPABASE_URL` y `SUPABASE_SECRET_KEY`, ambos server-only.
- Preferir la clave moderna `sb_secret_...`; no introducir una nueva
  dependencia sobre el `service_role` JWT legado.
- Crear el cliente únicamente en `lib/supabase-server.ts`.
- El módulo comienza con `import "server-only";`.
- Configurar `persistSession: false` y `autoRefreshToken: false`.
- Crear el cliente de forma lazy para que imports y builds sin secretos no
  fallen.
- Ninguna variable Supabase llevará el prefijo `NEXT_PUBLIC_`.

### Base de datos

Para cada tabla nueva:

1. `ENABLE ROW LEVEL SECURITY`.
2. Revocar todos los privilegios de `anon` y `authenticated`.
3. No crear políticas públicas de inserción.
4. Toda lectura y escritura de la aplicación usa la clave secreta del servidor.
5. Probar explícitamente que `anon` y `authenticated` no pueden hacer
   `SELECT`, `INSERT`, `UPDATE` ni `DELETE`.
6. Ejecutar Security Advisor y Performance Advisor después de la migración.

No se añadirá una policy permisiva de `service_role`: la clave secreta del
backend ya dispone del acceso elevado correspondiente. Las políticas redundantes
del esquema histórico no se copiarán.

Los grants heredados de `registros`, `audit_log`, `app_secrets` y demás tablas
se revisarán en una migración independiente. Debe probarse específicamente que
`anon` y `authenticated` no conservan `TRUNCATE`, `TRIGGER`, `REFERENCES` ni
privilegios sobre secuencias o funciones internas.

### PII

- Sentry recibe IDs y códigos técnicos, nunca payloads completos.
- Los errores de Resend guardan códigos, no cuerpos ni direcciones.
- Logs de Vercel no incluyen nombre, correo, teléfono, interés o notas.
- Los datos de atribución se limitan en longitud y se validan.
- La exportación manual desde Supabase es una operación autorizada y auditada.

## 7. Variables de entorno y CI

### Fuente única del contrato

Crear `scripts/env-spec.mjs` como fuente de verdad con:

- nombre;
- ámbito `public` o `server`;
- requerido en runtime;
- requerido en producción;
- formato;
- placeholder permitido o prohibido;
- descripción.

`scripts/check-env.mjs`, `.env.local.example` y la documentación se derivan o se
validan contra ese contrato. El archivo legado `.env.example` se elimina para
evitar dos plantillas contradictorias.

### Variables nuevas

| Variable | Dónde | Secreto |
|---|---|---|
| `SUPABASE_URL` | Vercel Preview/Production y desarrollo autorizado | No publicar en bundle |
| `SUPABASE_SECRET_KEY` | Vercel Preview/Production | Sí |
| `CRON_SECRET` | Vercel Production | Sí |

### Estrategia GitHub Actions

Se conserva la razón válida de no usar secretos de producción en GitHub.

1. Quitar `SKIP_ENV_VALIDATION` del bloque global del workflow.
2. Añadir `npm run env:contract`, sin secretos, a cada PR.
3. Mantener `SKIP_ENV_VALIDATION=1` solo en los pasos `npm run build`.
4. Unit tests sustituyen Supabase y Resend con adaptadores falsos.
5. Un job de base levanta Supabase local con una versión de CLI fijada:
   - `supabase db start`
   - `supabase db reset`
   - `supabase test db`
   - `supabase db lint --local --level error`
6. Este job usa credenciales locales generadas; nunca accede a producción.
7. Vercel Preview y Production usan `ENFORCE_ENV_VALIDATION=1`.
8. Si `VERCEL=1`, el validador rechaza `SKIP_ENV_VALIDATION=1`.
9. Upstash se valida como par indivisible y obligatorio en Preview/Production.
10. La generación local de tipos debe dejar `git diff --exit-code` limpio.

La versión de `supabase/setup-cli` y la versión del CLI se fijan; no se usa
`latest`.

Preview usa un proyecto o branch de Supabase separado de Production. Nunca se
ejecutan pruebas E2E contra los datos del proyecto productivo.

## 8. Reconciliación del historial de migraciones

Esta fase es obligatoria y ocurre antes de escribir la nueva tabla.

### Preparación

- Designar una sola persona responsable de la operación remota.
- Crear backup lógico del esquema y los datos actuales.
- Exportar el listado de migraciones remotas.
- Guardar el resultado de Security/Performance Advisor.
- Archivar los SQL locales actuales bajo
  `docs/history/supabase-migrations-legacy/`.
- Inicializar y versionar `supabase/config.toml`.
- Fijar Supabase CLI como dependencia de desarrollo.

### Baseline ejecutado

La auditoría remota confirmó dieciséis versiones ya aplicadas. Para no
reescribir ni reparar historial productivo, la estrategia implementada es:

1. La primera versión remota existente
   (`20260417050203_add_cfdi_columns_to_registros`) contiene el baseline
   consolidado y sin datos para bases nuevas.
2. Las otras quince versiones históricas existen localmente como marcadores
   no-op con el mismo número y nombre registrados en remoto.
3. Los SQL locales anteriores se conservan solo como evidencia bajo
   `docs/history/supabase-migrations-legacy/`.
4. En una base vacía, `supabase db reset --local` ejecuta el baseline y después
   las tres migraciones nuevas.
5. En Production, Supabase omite las dieciséis versiones ya registradas y solo
   propone como pendientes las tres migraciones `20260730...`.

Está prohibido marcar versiones remotas como `reverted`, ejecutar
`migration repair` o sustituir el historial durante este despliegue. Antes de
aplicar las migraciones nuevas se comparan `supabase migration list`, esquema,
conteos y advisors contra el snapshot auditado.

No ejecutar `db reset --linked`. Esa operación es destructiva y queda prohibida
para producción.

### Gate de baseline

No se continúa si cualquiera de estos puntos falla:

- backup no verificado;
- historial local/remoto divergente;
- `db reset` local falla;
- diff de esquema no vacío;
- se pierden triggers, constraints, grants o políticas;
- advisors contienen un hallazgo crítico o error sin resolver.

## 9. Flujo de aplicación

### Validación compartida

Mover los schemas a `lib/inquiries/schema.ts`:

- `corporateInquirySchema`
- `sponsorInquirySchema`
- `inquirySchema`
- `attributionSchema`

El mismo módulo define los tipos TypeScript inferidos. No se duplican interfaces
manuales.

### Capas

```text
app/actions/inquiries.ts
  └─ server/use-cases/submit-inquiry.ts
       ├─ lib/inquiries/schema.ts
       ├─ server/repositories/inquiry-repository.ts
       ├─ server/services/inquiry-notifier.ts
       └─ lib/rate-limit.ts
```

- La Server Action traduce `FormData` y errores a un resultado tipado.
- El caso de uso controla el orden persistencia → notificación.
- El repositorio contiene todas las consultas Supabase.
- El notificador contiene Resend y actualiza la outbox.
- Los componentes solo manejan estados de interfaz.

No se llamará a Supabase directamente desde componentes ni desde la Server
Action.

### Resultado tipado

```ts
type InquiryResult =
  | { ok: true; inquiryId: string; notification: "sent" | "queued" }
  | {
      ok: false;
      reason:
        | "invalid"
        | "rate_limited"
        | "storage_unavailable"
        | "idempotency_conflict"
        | "unexpected";
    };
```

`inquiryId` no debe mostrarse como secreto ni utilizarse para acceso público;
sirve para soporte y correlación.

### Interfaz

- Cada formulario genera un `submission_id` estable al montarse.
- El pase corporativo añade un campo requerido `requestedSeats`, rango 2–10.
- Ambos envían `language`, `consentVersion` y atribución.
- `try/catch/finally` garantiza que la UI nunca queda en `sending`.
- Los mensajes diferencian validación, rate limit y indisponibilidad temporal.
- El formulario se limpia solo después de persistencia confirmada.
- Un correo pendiente no se presenta como error al usuario.

## 10. Reintentos de correo

Crear un Route Handler interno invocado por Vercel Cron:

- autenticación con `CRON_SECRET`;
- ejecución cada 5 minutos;
- lote máximo pequeño y configurable;
- bloqueo de filas con estrategia que evite dos workers sobre la misma
  notificación;
- máximo 5 intentos;
- backoff antes de los reintentos 2–5: 1, 5, 15 y 60 minutos; el quinto fallo
  pasa a `dead`;
- errores permanentes pasan a `dead`;
- alertar cuando exista una fila `dead`;
- nunca devolver PII en la respuesta del cron.

El intento inmediato y el cron utilizan la misma función
`processInquiryNotification`; no se duplicará lógica.

## 11. Pruebas obligatorias

### Unitarias

- Ambos schemas: casos válidos, límites y campos cruzados inválidos.
- Conversión de `FormData`.
- Honeypot devuelve éxito falso sin persistir.
- Rate limit impide persistencia.
- Persistencia exitosa y correo exitoso.
- Persistencia exitosa y correo fallido → éxito con `queued`.
- Persistencia fallida → no se llama Resend.
- Reintento con mismo `submission_id` → mismo registro.
- Mismo UUID con datos distintos → conflicto.
- Excepción inesperada siempre libera el estado visual.
- Redacción de PII en logs/Sentry.

### Integración de repositorio

Contra Supabase local:

- INSERT de corporate.
- INSERT de sponsor.
- Constraints discriminadas.
- Rango 2–10.
- UUID único.
- Normalización de email.
- Trigger de `updated_at`.
- Creación atómica de outbox.
- Índice de pendientes.
- Cambio de status y evento de auditoría.

### pgTAP / seguridad

- Existen las cuatro tablas.
- PK, FK, índices y checks correctos.
- RLS habilitado.
- Roles `anon` y `authenticated` sin CRUD.
- No existen policies públicas inesperadas.
- Funciones con `search_path` seguro.
- FK indexadas.

### E2E

GitHub no recibe secretos de integraciones. Por eso Playwright en CI cubre:

- render ES/EN y límites corporate 2–10;
- móvil/escritorio;
- enlaces al aviso;
- atribución vacía antes del consentimiento;
- captura minimizada después de `all`;
- borrado al volver a “solo esenciales”;
- ausencia de claves secretas en HTML o JavaScript.

Los fallos de persistencia/Resend, rate limit, liberación de UI y replay
idempotente se prueban con Vitest y pgTAP usando dependencias controladas. Los
envíos corporate/sponsor reales, el fallo recuperable y el reintento del
navegador se ejecutan como smoke tests en Preview aislado; nunca contra
Production ni desde GitHub Actions.

## 12. Observabilidad

Eventos permitidos:

- `inquiry_persisted`
- `inquiry_duplicate_replayed`
- `inquiry_persistence_failed`
- `inquiry_notification_sent`
- `inquiry_notification_retry`
- `inquiry_notification_dead`

Contexto permitido:

- `inquiry_id`
- `kind`
- `language`
- código de error
- número de intento
- duración

Contexto prohibido:

- nombre;
- email;
- teléfono;
- empresa;
- cargo;
- mensaje de patrocinio;
- notas internas.

El hash idempotente se calcula sobre una serialización canónica, versionada y
documentada del payload ya normalizado. Incluirá `kind`, datos de contacto,
campos específicos, idioma y versión de consentimiento; no incluirá timestamps
de servidor ni estado operativo.

Alertas mínimas:

- una notificación `dead`;
- tres fallos de persistencia en 15 minutos;
- solicitudes nuevas sin contacto durante 24 horas;
- cron sin ejecución durante 15 minutos.

## 13. Privacidad y retención

Antes de desplegar:

- actualizar `app/aviso-de-privacidad/page.tsx`;
- incluir Supabase como encargado/proveedor de infraestructura;
- retirar la afirmación “no almacena los datos en base de datos alguna”;
- declarar finalidad, campos, medidas, transferencias y plazo;
- versionar el consentimiento enviado por cada formulario;
- validar el texto con la persona responsable legal/privacidad.

Política técnica propuesta: 18 meses desde la creación, salvo que exista una
relación contractual u obligación aplicable que requiera otro plazo. El plazo
final debe ser aprobado antes de producción.

Un job mensual:

- identifica registros vencidos;
- exporta solo si existe obligación documentada;
- elimina o anonimiza según la política aprobada;
- registra conteos, nunca PII, en el evento operativo.

## 14. Operación humana

En la primera versión no se reconstruye `/admin`. El equipo opera desde Supabase
Studio con acceso individual y MFA.

Se permite:

- cambiar `status`;
- asignar `owner`;
- escribir `internal_notes`;
- programar `next_follow_up_at`.

Se prohíbe:

- editar esquema desde Dashboard;
- cambiar IDs o timestamps;
- editar PII para “corregir” un envío sin dejar trazabilidad;
- ejecutar SQL no versionado;
- compartir claves;
- exportar datos a equipos personales.

Crear `docs/INQUIRY_OPERATIONS.md` con vistas guardadas:

- nuevos;
- seguimiento vencido;
- notificación pendiente/dead;
- corporate por número de accesos;
- sponsorship por estado;
- retención próxima a vencer.

## 15. Protocolo de cambios para humanos e IA

Cada cambio debe respetar este orden:

1. Actualizar schema Zod y tipo.
2. Crear migración con `supabase migration new`.
3. Actualizar tests pgTAP.
4. Ejecutar `supabase db reset`.
5. Regenerar tipos TypeScript desde local.
6. Actualizar repositorio/caso de uso.
7. Actualizar pruebas unitarias y E2E.
8. Actualizar `.env.local.example` si aplica.
9. Actualizar `docs/PROJECT_CONTEXT.md` y documentación operativa.
10. Ejecutar advisors.
11. Revisar diff SQL manualmente.
12. Desplegar aplicación después de la migración compatible.

Reglas:

- cambios aditivos primero;
- nunca renombrar/eliminar columna en el mismo despliegue que deja de usarla;
- aplicar patrón expand → migrate → contract;
- no mezclar migración de esquema con actualización masiva de datos;
- una migración aplicada nunca se edita;
- cada migración tiene comentario de forward plan y rollback operativo;
- toda dependencia nueva se fija y actualiza el lockfile.

## 16. Fases y gates

### Fase 0 — Baseline y contrato

- [ ] Backup inmediatamente anterior y snapshot final de advisors.
- [x] Alinear las dieciséis versiones del historial remoto/local sin repararlo.
- [x] `supabase/config.toml` versionado para PostgreSQL 17.
- [x] CLI fijado.
- [x] Una sola plantilla de env.
- [x] `scripts/env-spec.mjs`.
- [ ] Reset local y diff exacto de tipos validados por CI con Docker.
- [x] Auditoría y migración separada de grants heredados.
- [x] Retiro fail-safe de `pg_net` documentado y versionado.

Gate: ninguna modificación funcional hasta cerrar todos los puntos.

### Fase 1 — Base de datos

- [x] Migración aditiva de tablas, checks, índices, RLS y triggers.
- [x] Historial append-only de intentos de notificación.
- [x] pgTAP completo.
- [ ] Tipos exactos generados desde Supabase local en CI.
- [ ] Advisors remotos sin errores de seguridad tras la migración.

Gate: `db reset`, `test db`, `db lint` y advisors verdes.

### Fase 2 — Dominio y adaptadores

- [x] Schemas compartidos.
- [x] Cliente server-only.
- [x] Repositorio.
- [x] Caso de uso.
- [x] Outbox y notificador.
- [x] Pruebas unitarias/integración.

Gate: ningún import de Supabase en módulos cliente y cobertura crítica ≥ 85%.

### Fase 3 — Formularios

- [x] UUID idempotente.
- [x] Cantidad de accesos 2–10.
- [x] Idioma, consentimiento y atribución.
- [x] Errores tipados.
- [x] Accesibilidad y E2E automatizado de contrato visual.
- [ ] Smoke manual ES/EN contra Preview aislado.

Gate: prueba manual ES/EN, móvil/escritorio y reintento sin duplicación.

### Fase 4 — Operación y legal

- [ ] Aviso de privacidad aprobado.
- [x] Runbook de solicitudes.
- [x] Cron implementado y autenticado.
- [ ] Alertas y vistas guardadas configuradas por Operaciones.
- [ ] Retención aprobada.

Gate: una persona no desarrolladora puede encontrar, actualizar y recuperar una
solicitud siguiendo únicamente la documentación.

### Fase 5 — Preview

- [ ] Migración en entorno de preview/staging.
- [ ] Variables Vercel completas.
- [ ] Smoke tests con direcciones controladas.
- [ ] Prueba de fallo de Resend.
- [ ] Prueba de fallo de Supabase.
- [ ] Rollback ensayado.

Gate: 48 horas sin errores no explicados.

### Fase 6 — Producción

- [ ] Backup inmediatamente anterior.
- [ ] Aplicar migración aditiva.
- [ ] Ejecutar advisors.
- [ ] Desplegar aplicación.
- [ ] Enviar una solicitud corporate y una sponsor.
- [ ] Confirmar fila, outbox, correo y evento.
- [ ] Monitoreo intensivo durante 24 horas.

## 17. Rollback

El rollback prioriza no perder datos:

1. Revertir el deployment de Vercel a la versión que solo envía correo.
2. Mantener las tablas nuevas y las solicitudes ya capturadas.
3. Deshabilitar el cron si está causando reintentos incorrectos.
4. Exportar solicitudes recibidas durante la ventana.
5. Corregir con una migración nueva; nunca editar la aplicada.
6. Eliminar tablas solo mediante una decisión posterior, backup verificado y
   ventana de mantenimiento.

No se utiliza una migración `DROP` como rollback automático.

## 18. Secuencia de commits

1. `docs: define Supabase inquiry architecture`
2. `chore: establish reproducible Supabase baseline`
3. `db: add inquiry persistence and outbox`
4. `test: cover inquiry schema and database security`
5. `feat: add server-only inquiry repository`
6. `feat: persist inquiries before notification`
7. `feat: add idempotent corporate and sponsor forms`
8. `ops: add retry cron and inquiry runbook`
9. `legal: update privacy notice for Supabase persistence`
10. `ci: validate env contract and local database`

Cada commit debe compilar y sus pruebas correspondientes deben pasar.

## 19. Definición de terminado

La implementación no está terminada hasta que:

- el esquema se recrea desde cero;
- local y remoto tienen historial alineado;
- la aplicación no usa tablas históricas;
- una solicitud persiste antes del correo;
- los reintentos no duplican;
- una reutilización maliciosa de UUID con otro payload no sobrescribe datos;
- un fallo de Resend conserva el lead;
- un fallo de Supabase se comunica sin falso éxito;
- RLS y grants están probados negativamente;
- CI funciona sin secretos de producción;
- Preview está aislado de Production;
- Vercel valida secretos reales;
- el aviso de privacidad es correcto;
- existe retención definida;
- un humano puede operar el flujo con un runbook;
- una IA puede identificar fuentes de verdad y orden de cambios;
- build, typecheck, lint, Vitest, pgTAP, E2E y advisors están verdes.

## 20. Referencias oficiales

- [Supabase: claves publishable y secret](https://supabase.com/docs/guides/getting-started/api-keys)
- [Supabase: asegurar datos](https://supabase.com/docs/guides/database/secure-data)
- [Supabase: desarrollo local y migraciones](https://supabase.com/docs/guides/local-development/overview)
- [Supabase: flujo local](https://supabase.com/docs/guides/local-development/cli-workflows)
- [Supabase: reparación de migraciones](https://supabase.com/docs/reference/cli/supabase-migration-repair)
- [Supabase: pruebas de base de datos](https://supabase.com/docs/guides/database/testing)
- [Supabase: pruebas automatizadas en GitHub](https://supabase.com/docs/guides/deployment/ci/testing)
- [Supabase: Security y Performance Advisors](https://supabase.com/docs/guides/database/database-advisors)
