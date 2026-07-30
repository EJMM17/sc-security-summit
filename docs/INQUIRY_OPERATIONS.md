# Operación de solicitudes

Última revisión: 2026-07-30.
Ámbito: pases corporativos y patrocinio.  
Herramienta inicial: Supabase Studio.

Este documento permite que una persona no desarrolladora gestione solicitudes
sin modificar el esquema ni depender de SQL. Eventbrite sigue siendo la fuente
de verdad para accesos individuales.

## 1. Acceso

Cada operador debe usar:

- cuenta individual;
- MFA habilitado;
- permisos mínimos necesarios;
- dispositivo administrado;
- sesión cerrada al terminar.

No compartas claves de API, contraseñas o sesiones. La
`SUPABASE_SECRET_KEY` pertenece a la aplicación y no es una credencial humana.

## 2. Tablas

| Tabla | Uso |
|---|---|
| `public.inquiries` | Solicitud y seguimiento comercial |
| `public.inquiry_notifications` | Estado actual de la notificación |
| `public.inquiry_notification_attempts` | Intentos técnicos append-only |
| `public.inquiry_events` | Auditoría de creación y cambios relevantes |

No uses para este flujo las tablas históricas `registros`, `admins`,
`app_config`, `app_secrets`, `audit_log` o `email_events`.

Durante el corte inicial, una persona designada verifica en modo lectura que
`public.registros` conserve sus siete filas históricas antes y después de
retirar el webhook legado. Operaciones no modifica esas filas. La función
`send-confirmation-email` queda como tombstone HTTP 410 con verificación JWT;
no intentes reactivarla ni recuperar su secreto anterior.

## 3. Campos que puede editar Operaciones

Solo se permite editar en `public.inquiries`:

| Campo | Regla |
|---|---|
| `status` | Usar únicamente los estados definidos abajo |
| `owner` | Slug corto sin espacios ni datos de contacto, por ejemplo `sales-01` |
| `internal_notes` | Nota operativa breve; no copiar datos innecesarios |
| `next_follow_up_at` | Fecha y hora del siguiente contacto |

No edites IDs, `submission_id`, hash, tipo, datos enviados por la persona,
consentimiento, atribución, retención o timestamps. Si un dato de contacto es
incorrecto, conserva el original y documenta el dato corregido mediante el
canal operativo autorizado; no reescribas silenciosamente la evidencia
recibida.

Nunca edites manualmente `inquiry_notifications`,
`inquiry_notification_attempts` o `inquiry_events`.

## 4. Estados

| Estado | Significado | Siguiente acción típica |
|---|---|---|
| `new` | Recibida, aún sin contacto | Asignar owner y fecha |
| `contacted` | Primer contacto realizado | Esperar respuesta |
| `qualified` | Oportunidad válida | Preparar propuesta |
| `proposal_sent` | Propuesta enviada | Programar seguimiento |
| `won` | Aceptada/cerrada | Continuar proceso contractual |
| `lost` | No continuará | Registrar motivo no sensible |
| `archived` | Fuera de operación activa | Conservar hasta retención |

No saltes a `won` o `lost` sin que exista evidencia en el sistema comercial
autorizado.

## 5. Auditoría automática

Los siguientes cambios desde Studio crean un evento:

| Acción | Evento |
|---|---|
| Crear solicitud | `created` |
| Cambiar `status` | `status_changed` o `archived` |
| Cambiar `owner` | `assigned` |
| Cambiar `internal_notes` | `note_updated` |
| Notificación aceptada | `notification_sent` |
| Notificación fallida | `notification_failed` |

Cambiar `next_follow_up_at` no genera por sí solo un evento. Hazlo junto con la
actualización operativa correspondiente cuando sea necesario conservar
contexto.

Los eventos no deben contener nombre, correo, teléfono, mensaje libre ni notas.

## 6. Filtros de Supabase Studio

No existen vistas SQL adicionales. Esto evita mantener otra API y otra capa de
permisos. Crea filtros personales en Table Editor con estas recetas:

### Nuevas

- Tabla: `inquiries`
- Filtro: `status = new`
- Orden: `created_at ASC`
- Columnas útiles: `created_at`, `kind`, `company`, `requested_seats`,
  `owner`, `next_follow_up_at`

### Seguimiento vencido

- Tabla: `inquiries`
- Filtro: `next_follow_up_at` anterior a la hora de revisión
- Excluir estados: `won`, `lost`, `archived`
- Orden: `next_follow_up_at ASC`

Si Studio no permite una fecha relativa, introduce la fecha/hora actual al
comenzar la revisión.

### Notificación pendiente

- Tabla: `inquiry_notifications`
- Filtro separado por `status = pending`, `status = processing` y
  `status = retry`
- Orden: `next_attempt_at ASC`

Una fila `processing` que supera el lease definido por la base puede ser
reclamada de nuevo por el worker. No la liberes manualmente.

### Notificación muerta

- Tabla: `inquiry_notifications`
- Filtro: `status = dead`
- Orden: `last_error_at DESC`
- Acción: escalar como SEV-2

### Corporate por accesos

- Tabla: `inquiries`
- Filtro: `kind = corporate`
- Orden: `requested_seats DESC`, después `created_at ASC`

### Patrocinio por estado

- Tabla: `inquiries`
- Filtro: `kind = sponsor`
- Orden: `status ASC`, después `created_at ASC`

### Retención próxima

Solo después de aprobación legal:

- Tabla: `inquiries`
- Filtro: `retention_until` dentro de los próximos 30 días
- Orden: `retention_until ASC`

## 7. Rutina diaria

1. Abre el filtro **Nuevas**.
2. Asigna `owner`.
3. Define `next_follow_up_at`.
4. Contacta por el canal autorizado.
5. Cambia `status` y añade solo la nota necesaria.
6. Revisa **Seguimiento vencido**.
7. Revisa notificaciones pendientes y muertas.
8. Registra en el control operativo únicamente conteos, responsable y hora.

Objetivo: ninguna solicitud `new` permanece sin contacto más de 24 horas.

## 8. Notificaciones

Estados:

- `pending`: creada y lista para intento;
- `processing`: reclamada por un worker;
- `sent`: aceptada por Resend;
- `retry`: fallo transitorio con próximo intento;
- `dead`: fallo permanente o máximo de intentos.

El intento inmediato y el cron usan el mismo procesador. El cron corre cada
cinco minutos en Vercel Production y procesa un lote de 1 a 25 (10 por
defecto). No cambies estados para “forzar” un correo: revisa el código
sanitizado y sigue `docs/RUNBOOK.md`.

`sent` significa que Resend aceptó el mensaje; no garantiza que la bandeja
destinataria lo haya mostrado.

## 9. Exportaciones

Solo una persona autorizada puede exportar datos. Antes:

1. documenta propósito y campos mínimos;
2. limita el rango de fechas;
3. evita intentos, eventos y columnas técnicas innecesarias;
4. guarda el archivo únicamente en el repositorio corporativo autorizado;
5. define su fecha de eliminación;
6. registra quién exportó, cuándo y cuántas filas, sin copiar PII al log.

No guardes exportaciones en equipos personales, correo personal o chats.

## 10. Retención y ARCO

La propuesta técnica es 18 meses, pero sigue pendiente de aprobación legal. No
elimines ni anonimices filas hasta que el procedimiento definitivo esté
aprobado.

Para una solicitud ARCO:

1. verifica identidad por el procedimiento legal aprobado;
2. localiza por correo y empresa;
3. preserva el identificador interno para trazabilidad;
4. no envíes capturas de Studio;
5. escala a la persona responsable de privacidad;
6. documenta fechas y resultado sin duplicar los datos solicitados.

## 11. Cambios técnicos

Operaciones nunca:

- crea o altera tablas, vistas, funciones, triggers o policies;
- ejecuta SQL no versionado;
- aplica migraciones;
- cambia RLS o grants;
- comparte secretos;
- ejecuta `db reset --linked`.

Todo cambio técnico sigue:

```text
migración versionada → pgTAP → db reset local → lint → tipos → Preview visual
→ rebuild Production → smoke controlado
```
