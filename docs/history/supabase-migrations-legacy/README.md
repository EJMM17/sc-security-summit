# Migraciones Supabase archivadas

Estos archivos pertenecen al flujo retirado de venta individual, folios, pagos y
administración. Se conservaron el 2026-07-29 como evidencia histórica y están
fuera de `supabase/migrations/`, por lo que la CLI no los ejecuta.

El antiguo `supabase-migration.sql` de la raíz se conserva como
`docs/history/supabase-migration-root-legacy.sql`. También es evidencia
histórica y **no debe ejecutarse**.

Reglas:

- No moverlos de vuelta a la cadena activa.
- No aplicarlos con SQL Editor, `db push` ni automatizaciones.
- No reutilizar `public.registros` para solicitudes corporativas o patrocinio.
- Una corrección al esquema vigente se hace con una migración nueva y
  timestamped.
- El baseline activo se debe certificar contra un dump remoto controlado antes
  del primer despliegue de base de datos.

Cada archivo recibió únicamente una cabecera de advertencia al archivarse. Estos
son los SHA-256 del contenido original, antes de añadir esa cabecera:

| Archivo | SHA-256 original |
|---|---|
| `002_hardening.sql` | `a986310464236776ed9f33d6e76d2bf5f770656aad95294be0e42e22597a8275` |
| `003_rls_explicit_deny.sql` | `06b30c3731076db0bf5eee0ea710479401cbab9eac515f7540ca536cc03eec73` |
| `004_admin_columns.sql` | `55df14e0d3d76d9f65d9107cc714b019d671b21d4dc7bc1c2d3d53669cd6cc65` |
| `005_admins_table.sql` | `288603f647892249899775f0e39924981d343550e6f8952dd663d1af4e6077d2` |
| `005_update_prices.sql` | `a9f474cf2d1c06010c8ed4ba739749340c800344f480b304433ca0eb8e839e77` |
| `006_capacity_and_price_update.sql` | `ad18f339bd42547624f23b1e69a7fd17020f70aac09ee0ca4fdb5133a326f59c` |
| `007_capacity_trigger.sql` | `cd8c37f8d5027456e1e7b9cb4a4b60ea5992482da55b2efaaf2b5a3461ab1d8a` |
| `008_form_columns_sync.sql` | `dc88e3f5fa330656b566fee40b538affdae4f55c653e0ba0e9b1f93a8fc23ec1` |
| `009_email_events.sql` | `70adaa11203f33b699f3e6459dcaf614e90a09868c60d71b3d5dc62523c31982` |
| `010_attribution_columns.sql` | `8ac52169c6ad657f7dbc03a2076930bee8663065a32ca1ca3bdcfa5557f716e4` |
| `20260505_enterprise_v1.sql` | `c162245bc2fafef2022088b8aecb533e17228c645c89f0fe9d4e8ad9cbe11133` |

## Qué representa el baseline activo

`supabase/migrations/20260417050203_add_cfdi_columns_to_registros.sql`
consolida, sin datos, los objetos heredados conocidos por el repositorio y por
la inspección documentada del proyecto: `registros`, `admins`, `app_config`,
`app_secrets`, `audit_log`, `email_events` y la vista administrativa. Las otras
quince versiones remotas existentes se representan con marcadores no-op en la
cadena activa.

Ese SQL es un baseline reproducible local, no una afirmación de igualdad binaria
con producción. Antes de marcarlo como baseline remoto se deben completar el
backup, `migration list`, el pull controlado y el diff vacío descritos en
`docs/SUPABASE_INQUIRIES_IMPLEMENTATION_PLAN.md`. PostgreSQL remoto fue
confirmado en versión mayor 17. El hallazgo histórico de `pg_net` se retira de
forma fail-safe en una migración posterior.
