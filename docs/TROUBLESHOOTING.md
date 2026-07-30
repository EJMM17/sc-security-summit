# Troubleshooting

Última revisión: 2026-07-29.

Diagnóstico de la aplicación y las solicitudes persistidas. Para operación
diaria usa `docs/INQUIRY_OPERATIONS.md`; para incidentes usa
`docs/RUNBOOK.md`.

## 1. Resultado del formulario

| Resultado | Significado | Acción |
|---|---|---|
| `ok`, `notification: sent` | Persistida y Resend aceptó el correo | Seguimiento normal |
| `ok`, `notification: queued` | Persistida; correo pendiente/retry | Revisar outbox, no pedir reenvío |
| `invalid` | Zod rechazó campos o consentimiento | Corregir datos; no tocar la base |
| `rate_limited` | Ventana Upstash excedida | Esperar 15 min y revisar abuso |
| `storage_unavailable` | No se pudo persistir | No fue recibida; revisar Supabase |
| `idempotency_conflict` | Mismo UUID con payload distinto | Evento de seguridad; no sobrescribir |
| `unexpected` | Excepción no clasificada | Correlacionar Sentry/logs sin PII |

Una respuesta de éxito significa que la solicitud ya existe en
`public.inquiries`. El correo nunca define por sí solo la recepción.

### La persona recibió éxito pero no llegó correo

1. Busca la solicitud en `public.inquiries`.
2. Busca su notificación en `public.inquiry_notifications`.
3. Si está `pending` o `retry`, el comportamiento es recuperable y el cron debe
   volver a intentar.
4. Si está `sent`, revisa Resend y Spam/Promociones.
5. Si está `dead`, escala como SEV-2.

No pidas reenviar mientras exista la fila: el problema es de notificación, no
de captura.

### La persona recibió `storage_unavailable`

1. Confirma `SUPABASE_URL` y `SUPABASE_SECRET_KEY` en ese ambiente.
2. Verifica que Preview no apunte a Production.
3. Revisa disponibilidad de Supabase.
4. Revisa la RPC `create_inquiry` y el error técnico sanitizado.
5. Cuando vuelva, ejecuta una solicitud controlada.

La aplicación no intenta Resend si la persistencia falla.

### `idempotency_conflict`

El `submission_id` ya existe con otro `payload_hash`. La fila original se
preserva.

1. Conserva `submission_id` e `inquiryId` solo en el canal técnico autorizado.
2. Revisa si hubo manipulación, un bug de cliente o datos obsoletos.
3. No actualices el hash ni la fila original.
4. Añade un caso de regresión antes de cambiar la canonicalización.

### Honeypot

Un bot que llena `website` recibe un éxito falso y no persiste. Si una persona
legítima reporta éxito sin fila, revisa extensiones de autofill que completen
campos ocultos.

### Botón detenido en “Enviando…”

Los formularios liberan el estado en `finally`. Si queda detenido:

1. revisa errores JavaScript y la petición de Server Action;
2. prueba sin extensiones;
3. confirma que el deployment contiene la versión actual;
4. abre un bug con navegador, hora y ambiente, sin copiar PII.

## 2. Notificaciones

### `pending` o `retry` no avanza

1. Confirma cron cada cinco minutos en Vercel Production.
2. Confirma Vercel Pro y `CRON_SECRET`.
3. Revisa respuestas del route:
   - `401 unauthorized`: bearer incorrecto;
   - `503 cron_unavailable`: falta `CRON_SECRET`;
   - `500 processing_unavailable`: repositorio o worker falló.
4. Revisa `next_attempt_at` y el lease de filas `processing`.
5. Confirma que `CONTACT_EMAIL` y `RESEND_API_KEY` sean utilizables.

### Resend rechaza el mensaje

1. Revisa el código sanitizado en el último intento.
2. Confirma que `EMAIL_FROM` use un dominio verificado.
3. Confirma SPF, DKIM y DMARC según `docs/DNS.md`.
4. Confirma que `CONTACT_EMAIL` sea una bandeja monitoreada.
5. No copies el cuerpo o destinatario a logs.

Errores permanentes o cinco intentos llevan la notificación a `dead`.

### El cron envía duplicados

Vercel puede entregar la misma invocación más de una vez. Revisa:

- reclamación atómica mediante las RPC de notificación;
- lease de `processing`;
- restricción única de outbox;
- `provider_message_id` y número de intento;
- ausencia de cambios manuales de estado.

No resuelvas duplicados deshabilitando idempotencia.

## 3. Rate limiting

### `rate_limited`

El límite es cinco solicitudes por 15 minutos por IP.

1. Espera la ventana.
2. Revisa métricas agregadas de Upstash.
3. No almacenes la IP en Supabase, Sentry o tickets.
4. Si hay falsos positivos repetidos, cambia límite y pruebas en el mismo PR.

### Todos reciben error en Preview/Production

Upstash falla cerrado:

1. confirma URL y token como par;
2. revisa conectividad y estado del proveedor;
3. valida que las credenciales pertenezcan al ambiente;
4. redeploy después de rotarlas.

No agregues un fallback allow-all en Production.

## 4. Entorno y builds

### Falla `npm run env:contract`

El contrato no usa secretos. El mensaje indica uno de estos problemas:

- variable duplicada o con alcance inválido;
- secreto marcado como público;
- `.env.local.example` fuera de sincronía;
- reaparición de `.env.example`;
- regla de grupo hacia una variable inexistente.

Actualiza `scripts/env-spec.mjs`, inspecciona:

```bash
node scripts/check-env.mjs --print-template
```

y sincroniza `.env.local.example`.

### Falla `npm run check-env`

- En local, llena `.env.local` o acepta las advertencias durante desarrollo.
- En Vercel Preview/Production, todos los faltantes obligatorios bloquean.
- `ENFORCE_ENV_VALIDATION` debe valer `1` en Preview/Production.
- Placeholders y formatos inválidos bloquean en modo estricto.

Para validar localmente un archivo traído de Vercel, usa
`npm run check-env -- --target=preview` o `--target=production`.

`SKIP_ENV_VALIDATION=1` solo funciona en el paso build de GitHub Actions. Si
aparece en Vercel o en una terminal local, el validador falla de forma
intencional.

### Vercel rechaza `vercel.json`

El cron `*/5 * * * *` requiere Pro. Confirma el plan del equipo. Hobby solo
permite una ejecución diaria y rechazará el deployment.

### CI falla en “Database contract”

Ejecuta localmente con Docker:

```bash
npx supabase db start
npx supabase db reset --local
npx supabase test db --local
npx supabase db lint --local --level error --fail-on error
```

Si falla el diff de tipos:

```bash
npx supabase gen types --local --lang typescript --schema public > lib/database.types.ts
git diff -- lib/database.types.ts
```

Revisa y confirma el cambio generado; no edites los tipos manualmente.

## 5. Base de datos

### `db reset --local` falla

1. Identifica la primera migración que falla.
2. Comprueba orden y dependencias.
3. Si la migración aún no se aplicó remotamente, corrígela.
4. Si ya se aplicó, crea otra migración; nunca edites la aplicada.
5. Repite reset, pgTAP, lint y tipos.

Nunca pruebes la corrección con `db reset --linked` en Production.

### La aplicación recibe permission denied

La aplicación debe usar `SUPABASE_SECRET_KEY` server-only. Comprueba:

- no se importó cliente Supabase en un componente;
- no se usó una clave `NEXT_PUBLIC_`;
- la RPC existe con firma coincidente;
- grants y `search_path` siguen como en la migración;
- Preview/Production tienen la clave del proyecto correcto.

No crees una policy permisiva de `anon` o `authenticated` como arreglo rápido.

### `anon` puede leer o escribir

Trata el hallazgo como SEV-1:

1. conserva evidencia mínima;
2. limita el acceso afectado;
3. revisa RLS y grants, incluidas funciones/secuencias;
4. corrige con migración separada y pgTAP negativo;
5. ejecuta Security Advisor.

## 6. Health, CSP y ticketing

`/api/health` comprueba la aplicación y una lectura privacy-safe de
`inquiries`, con timeout de tres segundos. Un `503` puede indicar configuración
Supabase ausente, storage inaccesible o timeout; su cuerpo nunca incluye PII ni
errores del proveedor. Un `200` no prueba Resend, Upstash, cron o Eventbrite.

Los errores CSP requieren actualizar la directiva mínima en `middleware.ts`;
no añadas `'unsafe-inline'` a `script-src`.

Pedidos, pagos y boletos se investigan exclusivamente en Eventbrite.

## 7. Señales

| Señal | Interpretación |
|---|---|
| Tres `storage_unavailable` en 15 min | SEV-1 de persistencia |
| Una notificación `dead` | SEV-2 de entrega |
| Cron sin ejecución >15 min | SEV-2 |
| Solicitud `new` >24 h | Incumplimiento operativo |
| `idempotency_conflict` | Seguridad o bug de canonicalización |
| `401` en cron | `CRON_SECRET` desalineado |
| Diff de tipos en CI | Migración y cliente fuera de sincronía |
