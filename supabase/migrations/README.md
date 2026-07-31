# Cadena de migraciones

Esta carpeta contiene una cadena alineada por **versión** con el historial que
Supabase ya registra para el proyecto Summit.

## Baseline consolidado

`20260417050203_add_cfdi_columns_to_registros.sql` recrea en una base vacía,
sin datos, el esquema histórico conocido. Usa la primera versión remota para
evitar que el baseline aparezca como una migración nueva pendiente.

Las siguientes quince migraciones hasta `20260529035632` son marcadores no-op.
Sus efectos de esquema ya están incluidos en el baseline consolidado. Los SQL
locales originales, que estaban incompletos y tenían nombres/versiones
incompatibles, se conservan en
`docs/history/supabase-migrations-legacy/`.

Esta técnica cumple dos objetivos:

1. `supabase db reset` puede recrear el esquema desde cero.
2. `supabase migration list` puede comparar las mismas dieciséis versiones que
   producción ya considera aplicadas, sin reparar ni reescribir el historial
   remoto.

## Migraciones nuevas

Las migraciones posteriores son funcionales y deben aparecer como pendientes
antes de su primer despliegue:

- `20260730024502_add_inquiry_persistence.sql`: solicitudes y outbox.
- `20260730030134_harden_legacy_grants.sql`: retira ACLs heredadas y convierte
  la vista administrativa en `security_invoker`.
- `20260730030137_retire_legacy_registration_webhook.sql`: elimina el trigger,
  la función con autenticación obsoleta y `pg_net` mediante `RESTRICT`.

El tombstone versionado de la Edge Function retirada vive en
`supabase/functions/send-confirmation-email/index.ts` y exige JWT en
`supabase/config.toml`.

Reglas:

- Nunca cambiar una migración después de aplicarla.
- Nunca ejecutar `supabase db reset --linked`.
- No hacer `db push` hasta comprobar backup, lista alineada, reset local, diff
  vacío del baseline y advisors según
  `docs/SUPABASE_INQUIRIES_IMPLEMENTATION_PLAN.md`.
- Los marcadores no son una copia del SQL remoto; son anclas de historial. La
  igualdad de esquema debe verificarse con un dump/diff controlado.
- Datos y secretos remotos no pertenecen a migraciones ni seeds.
