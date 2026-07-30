# Contexto vigente del proyecto

Última revisión: 2026-07-29.

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
comprueba Resend, Upstash, cron o Eventbrite.

## 7. Entorno

El runtime canónico es Node 22.x con npm 10+. Node 20 terminó su ciclo de
soporte y ya no es compatible con la versión fijada de Supabase JavaScript.

Requeridas en Preview y Production:

- `SUPABASE_URL`;
- `SUPABASE_SECRET_KEY`;
- `RESEND_API_KEY`;
- `CONTACT_EMAIL`;
- `UPSTASH_REDIS_REST_URL`;
- `UPSTASH_REDIS_REST_TOKEN`;
- `ENFORCE_ENV_VALIDATION=1`.

Además, Production requiere:

- `CRON_SECRET`;
- `NEXT_PUBLIC_SITE_URL`.

`INQUIRY_NOTIFICATION_BATCH_SIZE` es opcional, rango 1–25, default 10.

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
- Lighthouse se ejecuta en `main`.

`npm run lint` usa ESLint CLI directamente; no depende del comando deprecado
`next lint`.

Riesgo de dependencias conocido: Next 15.5.22 mantiene versiones transitivas de
PostCSS y Sharp reportadas por `npm audit`. No existe corrección compatible en
la línea Next 15: la recomendación automática es un downgrade inválido. El
riesgo queda acotado porque el build no acepta CSS de terceros y las imágenes
son locales. `npm audit --omit=dev` permanece visible en CI y la eliminación
del hallazgo requiere una actualización mayor de Next, con su propia migración
y pruebas; no se usarán overrides transitivos no soportados para ocultarlo.

## 9. Privacidad y retención

El consentimiento actual usa `2026-07-29-draft`. El aviso y la propuesta de
retención de 18 meses están técnicamente redactados, pero pendientes de
validación legal. No se activa persistencia en Production ni se ejecuta
eliminación hasta aprobar:

- identidad/domicilio completos del Responsable;
- finalidades y encargados;
- transferencias aplicables;
- plazo y excepciones;
- proceso ARCO;
- eliminación o anonimización.

La autoridad federal vigente indicada en el borrador es la Secretaría
Anticorrupción y Buen Gobierno, no el extinto INAI.

## 10. Fallos esperados

- Supabase no disponible: el usuario recibe error y no se intenta correo.
- Resend no disponible: la solicitud persiste y queda en cola.
- Upstash no disponible en Preview/Production: rate limiting falla cerrado.
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

El repositorio incluye una migración separada para retirar
`trg_send_confirmation_email`, `public.notify_new_registro()` y `pg_net`, más
un tombstone JWT/HTTP 410 en
`supabase/functions/send-confirmation-email/index.ts`. La aplicación remota de
ese corte sigue gated por backup y por verificar que las siete filas históricas
de `public.registros` permanezcan intactas.
