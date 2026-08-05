# Deployment — Vercel + Supabase

Última revisión: 2026-07-30.

Este documento es el procedimiento canónico de despliegue. La aplicación y la
base se despliegan por separado y en este orden:

```text
migración compatible → verificación de base → aplicación → smoke tests
```

No ejecutes `supabase db reset --linked` ni uses datos o secretos de Production
en GitHub Actions, pruebas locales o Preview.

## 1. Gates antes de desplegar

Este checklist conserva tanto el gate como el estado comprobado del corte. La
activación del 2026-07-30 continuó por decisión explícita del propietario con
dos riesgos externos todavía abiertos: la factura Vercel vencida y la auditoría
histórica de snapshots Preview. Ninguno se marca como resuelto:

- [x] El aviso final `2026-07-30` fue revisado y aprobado por la persona
      responsable legal/privacidad el 2026-07-30.
- [x] El plazo de retención de 18 meses, el proceso ARCO y el procedimiento de
      eliminación/anonimización fueron aprobados el 2026-07-30.
- [x] Preview no tiene Supabase, Resend, Upstash, cron, analytics de marketing
      ni telemetría de Vercel/Sentry.
- [x] El inventario completo de Preview fue revisado y no conserva secretos
      legacy ajenos al contrato actual.
- [x] Existe un backup reciente y verificado de Production.
- [x] El historial de migraciones local y remoto está reconciliado.
- [x] Security Advisor y Performance Advisor no tienen errores críticos sin
      resolver.
- [x] Production tiene sus variables completas y Preview no hereda sus scopes.
- [ ] Los deployments Preview históricos que recibieron secretos compartidos
      están protegidos o retirados, o sus credenciales fueron rotadas mediante
      una ventana coordinada con rollback.
- [ ] Vercel Project Settings y `package.json` usan Node 22.x.
- [x] El equipo de Vercel sigue en plan Pro. El cron de cinco minutos no es
      compatible con Hobby.
- [ ] La cuenta de Vercel está al corriente, sin facturas vencidas ni avisos de
      suspensión. El estado `overdue` observado el 2026-07-30 bloquea el corte.
- [x] El operador y la ventana para retirar el webhook legado están
      confirmados según el corte controlado de la siguiente sección.

El plan Vercel Pro fue confirmado durante la revisión del 2026-07-29. Debe
confirmarse otra vez si cambia la suscripción: en Hobby, `*/5 * * * *` hace que
el deployment falle.

El propietario decidió el 2026-07-30 no pagar la factura Vercel vencida y
aceptó continuar mientras la plataforma permitiera el despliegue. Production
aceptó y publicó el merge `d1c5241` como deployment
`dpl_2FHggQ6zK16w4baLr36gZpohmt1o`. La factura y el posible bloqueo futuro de
la cuenta siguen siendo un riesgo operativo externo; no se presentan como
resueltos por el éxito de este deployment.

### Estado del backup de Supabase

El proyecto Summit continúa en Supabase Free. El Dashboard confirmó el
2026-07-30 que ese plan no incluye backups programados. El 2026-07-30 se creó
un dump lógico manual de `public` y `supabase_migrations`, se restauró en una
instancia PostgreSQL desechable y se verificaron tablas, datos, historial,
trigger y función legados. La copia quedó cifrada con Windows DPAPI para el
usuario operador, fuera del repositorio, junto con un manifiesto sin PII y el
SHA-256 del dump original. La restauración recuperó 10 registros, 2
administradores, 15 eventos de auditoría, 7 eventos de correo, 1 fila de
configuración y 16 migraciones.

El artefacto operativo está en
`E:\GitHubProyectos\_backups\sc-security-summit\supabase-production-20260731004918.dump.dpapi`.
Solo puede descifrarlo el mismo usuario de Windows. Una segunda copia en
almacenamiento corporativo sigue siendo recomendable para continuidad del
equipo, pero no sustituye ni invalida la restauración ya comprobada.
Como el sitio legado continúa activo, el operador debe comparar conteos y
regenerar el dump inmediatamente antes de aplicar migraciones si hubo cualquier
escritura posterior a este snapshot.

### Corte único del webhook legado

El retiro ocurre dentro del mismo bloque controlado de las tres migraciones
nuevas, respetando siempre su timestamp. Una sola persona designada debe:

1. Crear backup y comprobar que `public.registros` contiene los diez registros
   históricos legítimos confirmados por el propietario del proyecto el
   2026-07-30.
2. Confirmar que las únicas versiones pendientes son, en este orden:
   `20260730024502_add_inquiry_persistence`,
   `20260730030134_harden_legacy_grants` y
   `20260730030137_retire_legacy_registration_webhook`.
3. Aplicar esas tres versiones en ese orden. La tercera retira
   `trg_send_confirmation_email`, `public.notify_new_registro()` y ejecuta
   `DROP EXTENSION pg_net RESTRICT` dentro de una transacción. Si otra
   dependencia usa `pg_net`, esa migración falla y revierte; el operador se
   detiene y no despliega la aplicación.
4. Verificar que no quede una invocación activa desde la base.
5. Desplegar `supabase/functions/send-confirmation-email/index.ts` como una
   función tombstone HTTP 410 protegida con verificación JWT. Su única
   finalidad es rechazar llamadas rezagadas; no contiene ni documenta
   credenciales heredadas.
6. Confirmar nuevamente que los diez registros históricos siguen intactos y
   que no se generaron correos al ejecutar el smoke test del dominio nuevo.

No borres la Edge Function antes de completar el periodo de observación. El
tombstone hace visible cualquier cliente rezagado sin reactivar el flujo
retirado.

## 2. Fuentes de verdad

| Tema | Fuente |
|---|---|
| Contrato de variables | `scripts/env-spec.mjs` |
| Plantilla local generada | `.env.local.example` |
| Validador | `scripts/check-env.mjs` |
| Esquema de base | `supabase/migrations/` |
| Pruebas de base | `supabase/tests/database/` |
| Tipos generados | `lib/database.types.ts` |
| Cron de reintentos | `vercel.json` |
| Operación diaria | `docs/INQUIRY_OPERATIONS.md` |

`.env.example` está retirado deliberadamente. No se debe crear una segunda
plantilla.

## 3. Preparar una máquina

```bash
npm ci
cp .env.local.example .env.local
npm run env:contract
npm run check-env
```

`npm run env:contract` no usa secretos: comprueba que el contrato no tenga
duplicados, que ningún secreto sea público y que `.env.local.example` coincida
exactamente con `scripts/env-spec.mjs`.

`npm run check-env` carga `.env.local`. En desarrollo reporta faltantes como
advertencias; para una comprobación estricta:

```bash
ENFORCE_ENV_VALIDATION=1 npm run check-env
```

En PowerShell:

```powershell
$env:ENFORCE_ENV_VALIDATION = "1"
npm run check-env
Remove-Item Env:ENFORCE_ENV_VALIDATION
```

Después de traer valores de un ambiente, valida también sus requisitos
específicos:

```bash
npm run check-env -- --target=preview
npm run check-env -- --target=production
```

Vercel ignora un target manual y usa `VERCEL_ENV`, por lo que no se puede
degradar la validación del deployment mediante argumentos.

`SKIP_ENV_VALIDATION=1` está reservado al paso `build` de GitHub Actions.
El validador lo rechaza en Vercel y fuera de GitHub Actions.

## 4. Variables por ambiente

| Variable | Development | Preview | Production |
|---|---:|---:|---:|
| `SUPABASE_URL` | solo loopback local | prohibida | requerida; host exacto fijado en `config/deployment-contract.json` |
| `SUPABASE_SECRET_KEY` | clave local | prohibida | requerida, `sb_secret_…` |
| `RESEND_API_KEY` | prohibida | prohibida | requerida |
| `CONTACT_EMAIL` | prohibida | prohibida | requerida |
| `KV_REST_API_URL` | prohibida | prohibida | requerida; administrada por la integración Upstash |
| `KV_REST_API_TOKEN` | prohibida | prohibida | requerida; administrada y sensible |
| `KV_URL` / `REDIS_URL` / `KV_REST_API_READ_ONLY_TOKEN` | prohibidas | prohibidas | provider-managed; no consumidas por la app |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | prohibidas | prohibidas | aliases manuales retirados y prohibidos |
| `CRON_SECRET` | prohibida | prohibida | requerida |
| `NEXT_PUBLIC_SITE_URL` | opcional | opcional | requerida |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | prohibidas | prohibidas | opcionales como grupo |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | prohibidas | prohibidas | opcionales |
| IDs de analytics de marketing | prohibidos | prohibidos | opcionales |
| `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` | opcionales como grupo | prohibidas | opcionales como grupo; habilitan `/admin` |
| `ENFORCE_ENV_VALIDATION` | `0` o ausente | opcional; strict automático | `1` |

Supabase URL/key, Resend key/contact inbox,
`KV_REST_API_URL`/`KV_REST_API_TOKEN` y
`SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` son pares indivisibles. Fuera de Vercel
Production solo se permite Supabase local por loopback. El runtime ignora
Resend, Upstash, cron, Sentry y marketing fuera de Production aunque alguien
copie una clave.

`ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` son un par indivisible y opcional.
Con ambas configuradas en Production, `/admin` queda disponible; si falta
cualquiera de las dos, toda ruta `/admin` responde 404. Están prohibidas en
Preview, de modo que ningún despliegue visual expone el panel. Genera
`ADMIN_SESSION_SECRET` al azar (por ejemplo
`openssl rand -base64 32`) y rota ambas cuando alguien deje de operar; la
rotación invalida las sesiones abiertas.

`SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `KV_REST_API_TOKEN`, `CRON_SECRET`,
`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` y
`SENTRY_AUTH_TOKEN` son server-only. También lo son las salidas sensibles
provider-managed `KV_URL`, `REDIS_URL` y `KV_REST_API_READ_ONLY_TOKEN`, aunque
la aplicación no las lea. Ninguna lleva el prefijo `NEXT_PUBLIC_`.

`NEXT_PUBLIC_SENTRY_DSN` es público por diseño, pero su scope sigue siendo solo
Production. Sentry se inicializa únicamente para errores y el evento saliente
se reconstruye desde una allowlist técnica: no se envían trazas, replay, logs,
métricas, requests, encabezados, cuerpos, query strings, usuario, breadcrumbs,
mensajes libres, contexto de fuente ni variables locales.

## 5. Configurar Vercel

Vincula el checkout al proyecto existente:

```bash
vercel link
```

Agrega o rota secretos de forma interactiva para no dejarlos en el historial
del shell:

```bash
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SECRET_KEY production --sensitive
```

Repite solo para las variables manuales Production de la tabla. Revisa y retira
sus scopes Preview; también retira `SUPABASE_SERVICE_ROLE_KEY` y cualquier
`NEXT_PUBLIC_SUPABASE_*` legado.

Upstash no se configura con `vercel env add`. En Vercel Dashboard abre
**Storage**, selecciona `summit-rate-limit-production` y confirma que el
proyecto esté conectado únicamente al ambiente Production. El recurso Redis
anterior permanece archivado: no lo reconectes ni restaures sus variables. La
integración activa aprovisiona y rota
`KV_REST_API_URL`/`KV_REST_API_TOKEN`, que son el único par consumido por la
aplicación. Puede crear además `KV_URL`, `REDIS_URL` y
`KV_REST_API_READ_ONLY_TOKEN`: son salidas provider-managed, no pertenecen al
contrato de código y no se renombran, duplican, borran ni rotan a mano.
Los aliases manuales `UPSTASH_REDIS_REST_URL` y
`UPSTASH_REDIS_REST_TOKEN` están retirados y el validador los rechaza.

Audita el inventario completo, no solo las variables que consume el código.
Preview no debe conservar ninguna variable de la conexión Upstash, tampoco sus
salidas provider-managed. Variables ajenas como `ADMIN_SESSION_SECRET`,
`BROWSERBASE_API_KEY` o `EDGE_CONFIG` requieren inventario y propietario
separados; no se incorporan al contrato por coincidencia histórica.

### Incidente de alcance al retirar un target

Nunca ejecutes `vercel env rm NAME preview` sobre una entrada multi-target.
Ese comando puede retirar la entrada completa, incluida Production, en lugar
de limitarse a quitar Preview.

Antes de cambiar cualquier alcance:

1. haz un inventario de nombres, IDs, tipo, targets y origen de cada entrada
   desde Dashboard/API, sin descifrar ni copiar valores a tickets;
2. respalda esa metadata y registra la conexión de Vercel Storage, deployments
   vigentes, propietario y plan de rollback;
3. identifica si la entrada es manual o provider-managed;
4. edita el arreglo de targets en Dashboard/API conservando Production; para
   Upstash, cambia los ambientes de la conexión del recurso en Vercel Storage;
5. verifica que Production conserve el par REST y que Preview no tenga ninguna
   salida KV/Redis;
6. reconstruye el deployment y ejecuta `check-env`, health y un smoke
   controlado.

Si una entrada administrada fue eliminada por accidente, detén más cambios,
reconecta el recurso o rota sus credenciales desde Vercel Storage y reconstruye
Production. No intentes restaurar valores desde historial de shell, logs o
documentos.

No descargues secretos Production a `.env.local`. Para revisar el contrato sin
persistirlos usa un proceso efímero autorizado, por ejemplo
`vercel env run -e production -- npm run check-env -- --target=production`.

Los cambios de variables solo aplican a deployments nuevos: siempre redeploy
después de agregar o rotar un valor. Un Preview histórico conserva el snapshot
de variables con el que se construyó. Si recibió una credencial compartida,
quitar el scope no la revoca retroactivamente: protege o retira ese deployment,
o rota la credencial con propietario, ventana, actualización de Production,
rebuild y rollback explícitos. No hagas una rotación improvisada que deje fuera
de servicio al sitio vigente.

## 6. CI sin secretos productivos

`.github/workflows/ci.yml` mantiene dos contratos independientes:

1. Calidad de aplicación: ejecuta `npm run env:contract`, typecheck, lint,
   coverage Vitest con umbrales de 85% y build. Solo el paso de build recibe
   `SKIP_ENV_VALIDATION=1`.
2. Base local: usa Supabase CLI `2.110.0`, reconstruye las migraciones, ejecuta
   pgTAP, lint y verifica que regenerar `lib/database.types.ts` no produzca diff.

El job de base usa Docker y credenciales locales generadas por Supabase. No
enlaza ni consulta proyectos remotos.

## 7. Validación local

Con Docker activo:

```bash
npx supabase db start
npx supabase db reset --local
npx supabase test db --local
npx supabase db lint --local --level error --fail-on error
npx supabase gen types --local --lang typescript --schema public > lib/database.types.ts
git diff --exit-code -- lib/database.types.ts
```

Después:

```bash
npm run env:contract
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Playwright apunta a `http://localhost:3000` por defecto. Para un smoke
controlado de un deployment, define `PLAYWRIGHT_BASE_URL` explícitamente.
`NEXT_PUBLIC_SITE_URL` es metadata de la aplicación y nunca debe decidir el
destino E2E.

`package.json` fuerza las versiones corregidas de `postcss` y `sharp` que
Next.js 15.5.22 todavía resuelve de forma transitiva. No uses
`npm audit fix --force` ni retires esos overrides hasta que una versión estable
de Next.js incluya rangos corregidos y pasen lockfile, audit, build,
optimización de imágenes y E2E sin ellos.

Llena `.env.local` solo con Supabase loopback y valores no hospedados. Usa
`ENFORCE_ENV_VALIDATION=1 npm run build` para la verificación local; no copies
Resend, Upstash, cron o marketing y no uses el bypass.

## 8. Preview visual desconectado

Antes de desplegar, confirma que el scope Preview no contiene:

- Supabase, incluidos aliases `SUPABASE_SERVICE_ROLE_KEY` y
  `NEXT_PUBLIC_SUPABASE_*`;
- Resend y `CONTACT_EMAIL`;
- la conexión Upstash y todas sus salidas: `KV_REST_API_URL`,
  `KV_REST_API_TOKEN`, `KV_URL`, `REDIS_URL` y
  `KV_REST_API_READ_ONLY_TOKEN`;
- `CRON_SECRET`;
- Sentry: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`,
  `SENTRY_PROJECT` y `SENTRY_AUTH_TOKEN`;
- GTM, GA4, Meta Pixel o LinkedIn Insight.

Después comprueba:

- ambos formularios están deshabilitados con mensaje ES/EN;
- `/api/health` devuelve `503` sin detalles;
- la Server Action devuelve fallo cerrado sin leer el formulario;
- no salen requests de marketing, Vercel Analytics, Speed Insights ni
  integraciones de negocio;
- navegación, contenido y diseño funcionan en móvil/escritorio.

Las pruebas de dominio usan Supabase loopback, pgTAP, Vitest y adaptadores
controlados en CI. Preview no es un staging operativo: la UI no recopila ni
envía datos. Una llamada fabricada se descarta antes de leer, validar,
registrar, persistir o invocar integraciones, sin falso éxito.

Sentry, Vercel Analytics, Speed Insights, `InteractionTracker` y la atribución
de marketing no se montan en Preview. El job `Preview isolation` de CI congela
este contrato con navegador real.

No promociones ni reutilices el artefacto construido para Preview: contiene la
política desconectada. El mismo commit aprobado debe construirse nuevamente con
target Production y variables Production; después se ejecutan los smoke tests
controlados.

## 9. Production

1. Congela cambios y designa un único operador de base.
2. Crea y verifica el backup inmediatamente anterior.
3. Comprueba historial y advisors.
4. Confirma que solo estén pendientes las tres versiones `20260730...` y
   aplícalas en el orden exacto indicado en “Corte único del webhook legado”.
   Nunca vuelvas a aplicar el baseline ni sus quince marcadores históricos.
5. Vuelve a ejecutar pruebas y advisors.
6. Confirma `CRON_SECRET`, `ENFORCE_ENV_VALIDATION=1`, URLs permitidas, plan
   Pro y `summit-rate-limit-production` conectado solo a Production con el par
   REST presente.
7. Despliega el mismo commit, reconstruido como target Production; no promuevas
   el artefacto Preview.
8. Envía una solicitud corporate y una sponsor controladas.
9. Confirma `inquiries`, outbox, intento, evento y correo.
10. Monitorea intensivamente durante 24 horas.

El cron de `vercel.json` llama en Production a
`/api/cron/inquiry-notifications` cada cinco minutos. Vercel puede entregar un
evento más de una vez; el worker debe conservar idempotencia y bloqueo de
concurrencia.

## 10. Rollback

Si falla la aplicación:

1. Promueve el deployment verde anterior.
2. Conserva las tablas y solicitudes nuevas.
3. Deshabilita el cron desde Vercel si está generando reintentos incorrectos.
4. Exporta únicamente las solicitudes de la ventana si existe autorización.
5. Corrige con una migración nueva; nunca edites una ya aplicada.

Un Instant Rollback de Vercel no actualiza automáticamente la configuración de
crons. Revisa el cron de forma separada.

No uses `DROP` como rollback automático y nunca ejecutes
`supabase db reset --linked` contra Production.

## 11. Agregar una variable

1. Añádela solo a `scripts/env-spec.mjs`.
2. Define alcance, secreto, ambientes, formato y placeholders.
3. Ejecuta `node scripts/check-env.mjs --print-template`.
4. Actualiza `.env.local.example` con la salida.
5. Ejecuta `npm run env:contract`.
6. Configura los ambientes Vercel necesarios.
7. Actualiza este documento solo si cambia la operación.

Excepción: una salida provider-managed que la aplicación no consume no se
añade al SSOT. Las variables consumidas de Upstash sí se validan en el
contrato, pero sus valores, conexión y rotación pertenecen a Vercel Storage.
