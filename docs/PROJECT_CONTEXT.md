# Contexto vigente del proyecto

Última revisión: 2026-07-30.

Este documento describe el repositorio después de incorporar persistencia para
solicitudes. No demuestra que el código, migraciones o variables ya estén
activos en Production. El estado de despliegue se verifica en Vercel y
Supabase; los gates están en `docs/DEPLOYMENT.md`.

## 1. Producto

SC Security Summit 2026 es un sitio de marketing bilingüe para el evento del 24
de septiembre de 2026 en Reynosa, Tamaulipas.

- Eventbrite es el único sistema de venta y administración de accesos
  individuales.
- El sitio conserva solicitudes de pase corporativo y patrocinio en Supabase.
- Supabase es la fuente de verdad de esas solicitudes.
- Resend es un canal de notificación posterior a la persistencia.
- No existen folios, pagos, confirmación de boletos ni `/admin` para este flujo.
- Las tablas históricas de asistentes se preservan, pero no se reutilizan.

## 2. Arquitectura

```text
Navegador
  ├─ CTA individual ───────────────────────────────► Eventbrite
  └─ Formulario corporate / sponsor
       ├─ submission_id estable
       ├─ consentimiento versionado
       ├─ honeypot
       └─ Server Action
            ├─ Zod
            ├─ Upstash: 5 / 15 min / IP
            └─ submit-inquiry use case
                 ├─ RPC idempotente ──────────────► Supabase
                 │    ├─ inquiries
                 │    ├─ inquiry_notifications
                 │    └─ inquiry_events
                 └─ intento de notificación ──────► Resend

Vercel Cron, cada 5 min
  └─ processor compartido
       ├─ reclama outbox con lease
       ├─ reintenta con backoff
       └─ registra intento y evento sin PII
```

### Semántica de recepción

| Persistencia | Correo | Respuesta |
|---|---|---|
| Éxito | Éxito | `ok`, `notification: sent` |
| Éxito | Fallo/retry | `ok`, `notification: queued` |
| Fallo | No se intenta | `storage_unavailable` |
| Replay idéntico | Estado existente | Devuelve la solicitud original |
| UUID con payload distinto | No actualiza | `idempotency_conflict` |

Una solicitud se considera recibida solo después de persistir. Un fallo de
Resend no pierde el lead.

## 3. Capas y fuentes de verdad

| Tema | Fuente |
|---|---|
| Copy, agenda, accesos, ponentes, FAQ, Eventbrite | `lib/content.ts` |
| Schemas y parsing de formularios | `lib/inquiries/schema.ts` |
| Versión de consentimiento | `lib/inquiries/constants.ts` |
| Payload canónico e idempotencia | `lib/inquiries/canonical-payload.ts` |
| Resultado público tipado | `lib/inquiries/result.ts` |
| Server Action | `app/actions/inquiries.ts` |
| Orquestación | `server/use-cases/submit-inquiry.ts` |
| Acceso a Supabase | `lib/supabase-server.ts`, `server/repositories/inquiry-repository.ts` |
| Outbox y Resend | `server/services/inquiry-notifier.ts` |
| Observabilidad sin PII | `server/services/inquiry-observability.ts` |
| Rate limiting | `lib/rate-limit.ts` |
| Esquema y seguridad DB | `supabase/migrations/` |
| Contrato DB | `supabase/tests/database/` |
| Tipos generados | `lib/database.types.ts` |
| Contrato de entorno | `scripts/env-spec.mjs` |
| Cron | `app/api/cron/inquiry-notifications/route.ts`, `vercel.json` |
| Operación humana | `docs/INQUIRY_OPERATIONS.md` |

No se consulta Supabase desde componentes ni directamente desde la Server
Action. Todas las consultas viven en el repositorio server-only.

## 4. Datos

Tablas nuevas:

- `public.inquiries`;
- `public.inquiry_notifications`;
- `public.inquiry_notification_attempts`;
- `public.inquiry_events`.

RPC internas:

- `create_inquiry`;
- `claim_inquiry_notification`;
- `claim_inquiry_notifications`;
- `complete_inquiry_notification`.

RLS está habilitado y `anon` / `authenticated` no reciben acceso. La aplicación
usa `SUPABASE_SECRET_KEY` únicamente en servidor.

No se guarda IP ni user-agent en `inquiries`. Intentos, eventos, Sentry y logs
usan identificadores y códigos técnicos, no payloads completos.

La atribución se captura y se adjunta a los formularios solo después de
consentimiento de marketing `all`. Sin decisión o con “solo esenciales”, los
campos permanecen vacíos y el sitio elimina los stores de atribución heredados.
Como los campos ocultos son entrada no confiable, el servidor vuelve a aplicar
el gate: descarta toda atribución salvo que la decisión enviada sea exactamente
`all`. Esa señal de transporte no sustituye la aceptación versionada del aviso.

El proyecto usa Consent Mode básico. GTM, GA, Ads, Meta, LinkedIn, Vercel
Analytics/Speed Insights y el rastreador de interacciones no se montan ni
acumulan eventos antes del opt-in; por tanto, tampoco salen pings sin cookies.

## 5. Operación

No se reconstruyó `/admin`. La primera versión se opera en Supabase Studio con
cuentas individuales y MFA.

Operaciones puede cambiar en `inquiries`:

- `status`;
- `owner`;
- `internal_notes`;
- `next_follow_up_at`.

No debe editar IDs, payload, consentimiento, atribución, timestamps, outbox,
intentos o eventos. Consulta `docs/INQUIRY_OPERATIONS.md`.

## 6. Rutas

| Ruta | Función |
|---|---|
| `/` | Landing, Eventbrite y formularios |
| `/ctpat-oea` | SEO CTPAT/OEA |
| `/seguridad-cadena-suministro` | SEO temático |
| `/evento-logistica-reynosa` | SEO local |
| `/sponsors` | Patrocinio |
| `/media-kit` | Recursos de prensa |
| `/terminos-y-condiciones` | Términos, noindex |
| `/aviso-de-privacidad` | Aviso, noindex |
| `/api/health` | Readiness de aplicación + tabla `inquiries` |
| `/api/cron/inquiry-notifications` | Reintento interno autenticado |

`/api/health` carga el cliente Supabase de forma lazy y ejecuta un probe
privacy-safe sobre `inquiries` con presupuesto de tres segundos. Devuelve `503`
si la configuración o el almacenamiento crítico no están disponibles. No
comprueba Resend, Upstash, cron o Eventbrite. Las solicitudes concurrentes
comparten un solo probe; un resultado sano se reutiliza 30 segundos y un fallo
5 segundos, con el mismo TTL corto en CDN, para evitar amplificación hacia
Supabase.

## 7. Entorno

El runtime canónico es Node 22.x con npm 10+. Node 20 terminó su ciclo de
soporte y ya no es compatible con la versión fijada de Supabase JavaScript.

Requeridas en Production:

- `SUPABASE_URL`;
- `SUPABASE_SECRET_KEY`;
- `RESEND_API_KEY`;
- `CONTACT_EMAIL`;
- `KV_REST_API_URL`;
- `KV_REST_API_TOKEN`;
- `ENFORCE_ENV_VALIDATION=1`;
- `CRON_SECRET`;
- `NEXT_PUBLIC_SITE_URL`.

`INQUIRY_NOTIFICATION_BATCH_SIZE` es opcional, rango 1–25, default 10.

La integración Upstash conectada desde Vercel Storage administra y rota el par
REST de Production mediante `summit-rate-limit-production`, conectado solo a
Production. El recurso Redis anterior permanece archivado y no se reconecta.
Los aliases manuales `UPSTASH_REDIS_REST_URL` y
`UPSTASH_REDIS_REST_TOKEN` están retirados. La aplicación no consume `KV_URL`,
`REDIS_URL` ni `KV_REST_API_READ_ONLY_TOKEN`, aunque el proveedor las genere;
permanecen fuera del contrato de aplicación y no se duplican manualmente.

Nunca se ejecuta `vercel env rm NAME preview` sobre una entrada multi-target.
Antes de cualquier cambio se hace un inventario y se respalda la metadata; los
targets se editan siempre en Dashboard/API y la conexión Upstash desde Vercel
Storage.

Todo deployment Vercel cuyo target no sea Production es una vista visual
desconectada y estricta. Supabase, Resend, Upstash, cron, aliases Supabase
legados e IDs de analytics de marketing están prohibidos. Los formularios se
renderizan deshabilitados, la Server Action corta antes de leer datos y
`/api/health` devuelve `503`. Vercel Analytics, Speed Insights, el rastreador de
interacciones, la atribución y Sentry no se montan.

Sentry es opcional y exclusivo de Production. Opera solo con errores: sin
trazas, replay, logs, métricas, requests, encabezados, cuerpos, query strings,
usuarios, breadcrumbs, mensajes libres, contexto de fuente o variables
locales. Cada evento se reconstruye desde una allowlist de IDs/códigos y frames
técnicos.

Las pruebas integradas usan Supabase loopback/CI y adaptadores controlados. Los
proveedores reales se ejercitan únicamente mediante smoke controlado después
del rebuild Production. Un `SUPABASE_URL` remoto debe coincidir con el host
exacto de Summit fijado en `config/deployment-contract.json`; localhost HTTP
solo se admite para desarrollo.

La especificación completa está en `scripts/env-spec.mjs`.
`.env.local.example` se genera de ese contrato. `.env.example` no debe existir.

`SKIP_ENV_VALIDATION=1` solo es válido en el paso build de GitHub Actions. Se
rechaza en Vercel y en uso local.

## 8. CI

CI no contiene secretos productivos.

- `npm run env:contract` valida estructura y plantilla.
- TypeScript, ESLint CLI, Vitest con umbrales críticos de 85%, build y Playwright
  validan la aplicación.
- El build de GitHub usa el bypass solo en ese paso.
- Un job con Supabase CLI fijado levanta base local, ejecuta reset, pgTAP, lint
  y verifica tipos generados sin diff.
- Lighthouse se ejecuta en `main` después de que el estado Vercel del mismo
  SHA confirme el despliegue; nunca mide el alias mientras aún apunta al commit
  anterior.

`npm run lint` usa ESLint CLI directamente; no depende del comando deprecado
`next lint`.

Compatibilidad vigilada: Next 15.5.22 declara rangos transitivos de PostCSS y
Sharp anteriores a las correcciones de seguridad disponibles. `package.json`
fija overrides temporales a versiones corregidas, y `sharp` es dependencia de
runtime explícita para que el optimizador no dependa de devDependencies. CI
bloquea `npm audit --audit-level=high`, build y E2E, incluida una petición real
al optimizador de imágenes en Linux. Los overrides se retiran solo cuando una
versión estable de Next incluya rangos corregidos y toda esa matriz pase sin
ellos; nunca se usa `npm audit fix --force`.

## 9. Privacidad y retención

El consentimiento vigente usa `2026-07-30`. La persona responsable de
privacidad aprobó el 2026-07-30 el aviso, la retención de 18 meses, el proceso
ARCO y el procedimiento de eliminación/anonimización. Las excepciones al plazo
son una relación contractual, una solicitud ARCO en trámite o una obligación
jurídica documentada. Al vencimiento, una persona autorizada elimina los datos
personales o los anonimiza de forma irreversible y registra solo fecha,
responsable, conteo y resultado, nunca PII.

Esta aprobación cerró el gate legal. El backup, el historial y los advisors se
verificaron el 2026-07-30. Ese mismo día se aplicaron las tres migraciones, se
desplegó el tombstone JWT/HTTP 410 y Vercel publicó el merge `d1c5241` en
Production. La cuenta Vercel continúa vencida por decisión del propietario:
el deployment actual está activo, pero una suspensión futura sigue siendo un
riesgo operativo externo.

Google Maps no se descarga durante la visita inicial. La sección de ubicación
presenta un control bilingüe y crea el iframe únicamente después de una acción
explícita del visitante. Esta decisión mantiene la carga inicial y el
presupuesto Lighthouse libres de los scripts del mapa, además de reducir
conexiones de terceros no solicitadas.

El hero se mantiene deliberadamente estático: fecha, sede y métricas se
renderizan en servidor, sin contadores por segundo ni animaciones que repinten
el contenido principal. La fecha visible es la fuente suficiente para el
visitante; reintroducir un contador requiere demostrar que no retrasa LCP,
no crea un intervalo permanente y conserva los presupuestos de Lighthouse. La
imagen principal usa exclusivamente el `srcset` optimizado de `next/image`;
envolverla con fuentes manuales provoca descargas duplicadas y está prohibido.
El recurso usa prioridad alta explícita y calidad 70 bajo el overlay del hero;
ambos valores forman parte del presupuesto LCP.
El título principal usa la pila tipográfica del sistema y la fuente decorativa
no se precarga: el contenido LCP nunca debe depender de una fuente secundaria.

El proyecto Summit está actualmente en Supabase Free, que no ofrece backups
programados. El 2026-07-30 se creó un dump lógico de `public` y
`supabase_migrations`, cifrado fuera del repositorio con DPAPI, y se probó
mediante una restauración separada. La verificación recuperó las diez filas
históricas y todos los objetos legados que afectará el corte. Mientras el sitio
legado siga activo, el conteo y el dump deben refrescarse justo antes del corte
si se registra una escritura posterior.

La autoridad federal vigente indicada en el borrador es la Secretaría
Anticorrupción y Buen Gobierno, no el extinto INAI.

## 10. Fallos esperados

- Supabase no disponible: el usuario recibe error y no se intenta correo.
- Resend no disponible: la solicitud persiste y queda en cola.
- Upstash no disponible en Production: rate limiting falla cerrado. Preview
  corta antes de invocarlo.
- Cron no disponible: outbox se conserva; Operaciones escala si supera 15 min.
- Eventbrite no disponible: se detiene la venta individual, sin afectar datos
  de solicitudes ya guardadas.
- Sentry o analítica no configurados: no bloquean captura.

## 11. Cambio seguro

Orden obligatorio:

1. schema/tipo;
2. migración versionada;
3. pgTAP;
4. `db reset --local`;
5. tipos generados;
6. repositorio/caso de uso;
7. tests unitarios/E2E;
8. contrato env si aplica;
9. documentos;
10. advisors;
11. Preview;
12. migración compatible antes de la aplicación.

Una migración aplicada nunca se edita. Cambios destructivos siguen
expand → migrate → contract y una decisión independiente.

## 12. Historia

`AUDITORIA_REPO_2026-04-25.md` y `docs/history/` son evidencia histórica. No
constituyen instrucciones operativas. El baseline vigente y las nuevas
migraciones están en `supabase/migrations/`.

El corte remoto retiró `trg_send_confirmation_email`,
`public.notify_new_registro()` y `pg_net`. El tombstone de
`supabase/functions/send-confirmation-email/index.ts` quedó activo como versión
5, con JWT obligatorio: responde 401 sin credenciales y 410 con un JWT válido.
Las diez filas históricas legítimas de `public.registros` permanecieron
intactas. Dos smoke tests controlados —corporate y sponsor— confirmaron fila,
outbox, intento, evento y entrega a Resend; después se eliminaron únicamente
las dos solicitudes sintéticas para no contaminar la operación.
