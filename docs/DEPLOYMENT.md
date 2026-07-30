# Deployment — Vercel + Supabase

Última revisión: 2026-07-29.

Este documento es el procedimiento canónico de despliegue. La aplicación y la
base se despliegan por separado y en este orden:

```text
migración compatible → verificación de base → aplicación → smoke tests
```

No ejecutes `supabase db reset --linked` ni uses datos o secretos de Production
en GitHub Actions, pruebas locales o Preview.

## 1. Gates antes de desplegar

No se activa la persistencia hasta completar todos estos puntos:

- [ ] El aviso `2026-07-29-draft` fue revisado y aprobado por la persona
      responsable legal/privacidad.
- [ ] El plazo de retención y el procedimiento de eliminación fueron aprobados.
- [ ] Preview usa un proyecto o branch de Supabase distinto de Production.
- [ ] Existe un backup reciente y verificado de Production.
- [ ] El historial de migraciones local y remoto está reconciliado.
- [ ] Security Advisor y Performance Advisor no tienen errores críticos sin
      resolver.
- [ ] Vercel Preview y Production tienen sus variables completas.
- [ ] El equipo de Vercel sigue en plan Pro. El cron de cinco minutos no es
      compatible con Hobby.
- [ ] El operador y la ventana para retirar el webhook legado están
      confirmados según el corte controlado de la siguiente sección.

El plan Vercel Pro fue confirmado durante la revisión del 2026-07-29. Debe
confirmarse otra vez si cambia la suscripción: en Hobby, `*/5 * * * *` hace que
el deployment falle.

### Corte único del webhook legado

El retiro ocurre dentro del mismo bloque controlado de las tres migraciones
nuevas, respetando siempre su timestamp. Una sola persona designada debe:

1. Crear backup y comprobar que `public.registros` contiene los siete registros
   históricos esperados.
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
6. Confirmar nuevamente que los siete registros históricos siguen intactos y
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
| `SUPABASE_URL` | local/autorizada | requerida, aislada | requerida |
| `SUPABASE_SECRET_KEY` | local/autorizada | requerida, `sb_secret_…` | requerida, `sb_secret_…` |
| `RESEND_API_KEY` | recomendada | requerida | requerida |
| `CONTACT_EMAIL` | recomendada | requerida, inbox de prueba | requerida |
| `UPSTASH_REDIS_REST_URL` | opcional | requerida | requerida |
| `UPSTASH_REDIS_REST_TOKEN` | opcional | requerida | requerida |
| `CRON_SECRET` | opcional | opcional para smoke manual | requerida |
| `NEXT_PUBLIC_SITE_URL` | opcional | opcional | requerida |
| `ENFORCE_ENV_VALIDATION` | `0` o ausente | `1` | `1` |

Upstash se configura siempre como par. `SUPABASE_URL` y
`SUPABASE_SECRET_KEY` también. Preview nunca apunta al proyecto productivo.

`SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `UPSTASH_REDIS_REST_TOKEN`,
`CRON_SECRET` y `SENTRY_AUTH_TOKEN` son server-only. Ninguno lleva el prefijo
`NEXT_PUBLIC_`.

## 5. Configurar Vercel

Vincula el checkout al proyecto existente:

```bash
vercel link
```

Agrega o rota secretos de forma interactiva para no dejarlos en el historial
del shell:

```bash
vercel env add SUPABASE_URL preview
vercel env add SUPABASE_SECRET_KEY preview --sensitive
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SECRET_KEY production --sensitive
```

Repite para las variables de la tabla anterior. Usa valores distintos para
Preview y Production.

`vercel env pull .env.local --environment=preview --yes` reemplaza el archivo
completo. Guarda cualquier override local en `.env.development.local` o vuelve
a añadirlo después del pull. Nunca confirmes esos archivos.

Los cambios de variables solo aplican a deployments nuevos: siempre redeploy
después de agregar o rotar un valor.

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

Llena `.env.local` y usa `ENFORCE_ENV_VALIDATION=1 npm run build` para la
verificación local previa al despliegue; no uses el bypass.

## 8. Preview

La persona designada para base de datos:

1. Verifica que el proyecto enlazado sea Preview, nunca Production.
2. Ejecuta `supabase migration list` y revisa el resultado.
3. Ejecuta `supabase db push --dry-run`.
4. Revisa manualmente el SQL y el plan de rollback.
5. Ejecuta `supabase db push`.
6. Ejecuta Security Advisor y Performance Advisor.

Después despliega la aplicación a Preview y comprueba:

- una solicitud corporate y una sponsor;
- fila persistida antes de la notificación;
- replay con el mismo `submission_id` sin duplicado;
- fallo de Resend que deja la notificación en cola;
- fallo de Supabase que devuelve error sin falso éxito;
- acceso de `anon` y `authenticated` denegado;
- cron manual autenticado con un secreto de Preview;
- ausencia de PII en logs y respuestas técnicas.

El gate de Preview es 48 horas sin errores no explicados.

## 9. Production

1. Congela cambios y designa un único operador de base.
2. Crea y verifica el backup inmediatamente anterior.
3. Comprueba historial y advisors.
4. Confirma que solo estén pendientes las tres versiones `20260730...` y
   aplícalas en el orden exacto indicado en “Corte único del webhook legado”.
   Nunca vuelvas a aplicar el baseline ni sus quince marcadores históricos.
5. Vuelve a ejecutar pruebas y advisors.
6. Confirma `CRON_SECRET`, `ENFORCE_ENV_VALIDATION=1` y plan Pro.
7. Despliega la aplicación.
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
