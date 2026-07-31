-- SC Security Summit 2026
-- Reproducible, data-free consolidated baseline for the retired registration
-- domain. Its version matches the first migration already recorded remotely.
--
-- Forward plan:
--   This migration exists so a fresh local database has the known legacy
--   objects that remain in the hosted project. New features must not depend on
--   these objects.
--
-- Operational rollback:
--   Do not drop legacy objects automatically. Revert the application
--   deployment and correct schema differences with a new migration.
--
-- IMPORTANT:
--   This hand-consolidated baseline must be reconciled against a verified
--   remote dump before any `supabase db push`. It intentionally installs no
--   data and does not install the historical `pg_net` extension.

begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table public.registros (
  id uuid primary key default gen_random_uuid(),
  folio text not null,
  nombre text not null,
  apellido text not null,
  email text not null,
  telefono text,
  empresa text not null,
  cargo text not null,
  tipo_acceso text not null,
  monto_mxn integer not null,
  estado_pago text not null default 'pendiente',
  credencial_estudiantil boolean not null default false,
  requiere_cfdi boolean not null default false,
  rfc text,
  razon_social text,
  codigo_postal_fiscal text,
  metodo_pago text default 'transferencia_manual',
  conekta_order_id text,
  conekta_charge_id text,
  conekta_checkout_url text,
  spei_clabe text,
  spei_reference text,
  oxxo_barcode_url text,
  oxxo_expires_at timestamptz,
  conekta_payment_status text default 'pending',
  idempotency_key text,
  pagado_at timestamptz,
  pagado_en timestamptz,
  pagado_por text,
  pago_nota text,
  cancelado_en timestamptz,
  cancelado_por text,
  cancelacion_nota text,
  notas_internas text,
  ip_registro text,
  ip_address text,
  user_agent text,
  referer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  gclid text,
  gbraid text,
  wbraid text,
  fbclid text,
  li_fat_id text,
  msclkid text,
  landing_page text,
  referrer text,
  first_touch_timestamp timestamptz,
  last_touch_timestamp timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint registros_folio_unique unique (folio),
  constraint registros_email_unique unique (email),
  constraint registros_idempotency_key_unique unique (idempotency_key),
  constraint registros_tipo_acceso_check
    check (tipo_acceso in ('estudiante', 'general', 'vip')),
  constraint registros_estado_pago_check
    check (estado_pago in ('pendiente', 'pagado', 'cancelado')),
  constraint registros_metodo_pago_check
    check (
      metodo_pago is null
      or metodo_pago in ('spei', 'tarjeta', 'oxxo', 'transferencia_manual')
    ),
  constraint registros_conekta_payment_status_check
    check (
      conekta_payment_status is null
      or conekta_payment_status in (
        'pending',
        'paid',
        'expired',
        'canceled',
        'failed'
      )
    ),
  constraint registros_monto_valido check (
    (tipo_acceso = 'estudiante' and monto_mxn = 850)
    or (tipo_acceso = 'general' and monto_mxn = 2500)
    or (tipo_acceso = 'vip' and monto_mxn = 4800)
  ),
  constraint registros_email_formato check (
    email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  )
);

create index registros_estado_pago_created_at_idx
  on public.registros (estado_pago, created_at desc);
create index registros_estado_pago_idx
  on public.registros (estado_pago, created_at desc);
create index registros_created_at_idx
  on public.registros (created_at desc);
create index registros_email_idx
  on public.registros (email);
create index registros_tipo_acceso_idx
  on public.registros (tipo_acceso);
create index registros_requiere_cfdi_idx
  on public.registros (requiere_cfdi);
create index registros_conekta_order_id_idx
  on public.registros (conekta_order_id);
create index registros_metodo_pago_idx
  on public.registros (metodo_pago);
create index registros_conekta_payment_status_idx
  on public.registros (conekta_payment_status);
create index registros_pagado_at_idx
  on public.registros (pagado_at desc);
create index registros_idempotency_key_idx
  on public.registros (idempotency_key);
create index registros_ip_address_idx
  on public.registros (ip_address);
create index registros_gclid_idx
  on public.registros (gclid)
  where gclid is not null;
create index registros_utm_campaign_idx
  on public.registros (utm_campaign)
  where utm_campaign is not null;

create table public.admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  nombre text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.app_secrets (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  evento text not null,
  folio text,
  usuario_email text,
  ip text,
  user_agent text,
  detalles jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_folio_idx
  on public.audit_log (folio);
create index audit_log_created_at_idx
  on public.audit_log (created_at desc);

create table public.email_events (
  id uuid primary key default gen_random_uuid(),
  folio text,
  email text not null,
  type text not null,
  provider text not null default 'resend',
  status text not null,
  provider_message_id text,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index email_events_folio_idx
  on public.email_events (folio);
create index email_events_email_idx
  on public.email_events (email);
create index email_events_type_status_idx
  on public.email_events (type, status);
create unique index email_events_registration_sent_once_idx
  on public.email_events (folio, type)
  where status = 'sent' and type = 'registration_confirmation';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

create trigger trg_registros_updated_at
before update on public.registros
for each row execute function public.set_updated_at();

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

create or replace function public.get_cupos_disponibles()
returns integer
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_capacity integer := 500;
  v_paid integer;
begin
  select coalesce((c.value)::text::integer, 500)
  into v_capacity
  from public.app_config as c
  where c.key = 'capacity_total';

  select count(*)::integer
  into v_paid
  from public.registros as r
  where r.estado_pago = 'pagado';

  return greatest(v_capacity - v_paid, 0);
end;
$function$;

create or replace view public.admin_registros_view
as
select
  r.id,
  r.folio,
  r.nombre,
  r.apellido,
  r.email,
  r.telefono,
  r.empresa,
  r.cargo,
  r.tipo_acceso,
  r.monto_mxn,
  r.estado_pago,
  r.metodo_pago,
  r.conekta_payment_status,
  r.conekta_order_id,
  r.spei_clabe,
  r.spei_reference,
  r.pagado_at,
  r.created_at,
  r.requiere_cfdi,
  r.rfc,
  r.razon_social,
  r.ip_address
from public.registros as r
order by r.created_at desc;

alter table public.registros enable row level security;
alter table public.admins enable row level security;
alter table public.app_config enable row level security;
alter table public.app_secrets enable row level security;
alter table public.audit_log enable row level security;
alter table public.email_events enable row level security;

revoke all on table public.registros
  from public, anon, authenticated, service_role;
revoke all on table public.admins
  from public, anon, authenticated, service_role;
revoke all on table public.app_config
  from public, anon, authenticated, service_role;
revoke all on table public.app_secrets
  from public, anon, authenticated, service_role;
revoke all on table public.audit_log
  from public, anon, authenticated, service_role;
revoke all on table public.email_events
  from public, anon, authenticated, service_role;
revoke all on table public.admin_registros_view
  from public, anon, authenticated, service_role;

grant select, insert, update on table public.registros to service_role;
grant select, insert, update on table public.admins to service_role;
grant select, insert, update on table public.app_config to service_role;
grant select, insert, update on table public.app_secrets to service_role;
grant select, insert on table public.audit_log to service_role;
grant select, insert on table public.email_events to service_role;
grant select on table public.admin_registros_view to service_role;

revoke all on function public.set_updated_at()
  from public, anon, authenticated, service_role;
revoke all on function public.update_updated_at_column()
  from public, anon, authenticated, service_role;
revoke all on function public.get_cupos_disponibles()
  from public, anon, authenticated, service_role;

grant execute on function public.get_cupos_disponibles() to service_role;

comment on table public.registros is
  'Retired individual-registration domain. Preserved for historical records only.';
comment on table public.admins is
  'Retired custom administrator credentials. Not used by the current site.';
comment on table public.app_secrets is
  'Retired secret fallback. Never use for new application secrets.';
comment on extension pgcrypto is
  'Cryptographic helpers; version intentionally follows the platform default.';

commit;
