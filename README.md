# SC Security Summit 2026

Landing page de registro para el 1er Summit de Seguridad en la Cadena de Suministros — 24 y 25 de septiembre, Reynosa, Tamaulipas.

---

## Stack

| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 15.5 (App Router) | Framework, Server Actions |
| React | 18.3 | UI |
| TypeScript | 5 | Tipado |
| Tailwind CSS | v4 | Estilos |
| Supabase JS | v2.45 | Base de datos (PostgreSQL) |
| Zod | 3.23 | Validación de formularios |
| Resend | 6.x | Email de confirmación |
| Cloudflare Turnstile | — | Anti-bot (gratis) |
| Sonner | 2.0 | Toasts de feedback |
| Vercel Analytics | 2.x | Analytics de tráfico |
| Vercel Speed Insights | 2.x | Core Web Vitals |
| Vitest | 4.x | Tests unitarios |

---

## Setup local

### 1. Clonar e instalar

```bash
git clone https://github.com/EJMM17/sc-security-summit.git
cd sc-security-summit
npm install
```

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus credenciales:

| Variable | Dónde obtenerla | Obligatoria |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | ✅ |
| `RESEND_API_KEY` | resend.com → API Keys | ✅ (emails) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Dashboard → Turnstile | ✅ (anti-bot) |
| `TURNSTILE_SECRET_KEY` | Cloudflare Dashboard → Turnstile | ✅ (anti-bot) |
| `NEXT_PUBLIC_SITE_URL` | — | ✅ (SEO) |
| `CONTACT_EMAIL` | — | ✅ (errores) |

> **Nota:** en desarrollo local, si `TURNSTILE_SECRET_KEY` no está definida, la verificación Turnstile se omite (fail-open). Nunca hagas esto en producción.

### 3. Aplicar migración de base de datos

1. Ve a Supabase Dashboard → SQL Editor
2. Ejecuta `supabase-migration.sql` (migración inicial — crea tabla `registros`)
3. Ejecuta `supabase/migrations/002_hardening.sql` (seguridad — RLS, constraints, columnas de auditoría)

### 4. Servidor de desarrollo

```bash
npm run dev
# → http://localhost:3000
```

---

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción local |
| `npm run lint` | Linter (Next.js ESLint) |
| `npm run test` | Tests en modo watch (Vitest) |
| `npm run test:run` | Tests en modo CI (sin watch) |
| `npm run optimize-images` | Comprime imágenes PNG → WebP + AVIF |

---

## Estructura del proyecto

```
app/
  layout.tsx                ← Metadata SEO global, Analytics, fonts
  page.tsx                  ← Composición de secciones
  page-sections/            ← Secciones de la landing (Server Components)
    _shared.tsx             ← WaveSeparator, AgendaBadge
    HeaderSection.tsx
    HeroSection.tsx
    StatsBar.tsx
    WhyAttendSection.tsx
    VisionMisionSection.tsx
    PilaresSection.tsx
    SpeakersSection.tsx
    ValorSection.tsx
    AgendaSection.tsx
    AudienciaSection.tsx
    NetworkingHubSection.tsx
    PricingSection.tsx
    PatrocinadoresSection.tsx
    UbicacionSection.tsx
    FAQSection.tsx
    RegistroSection.tsx
    FinalCTASection.tsx
    FooterSection.tsx
  actions/
    registro.ts             ← Server Action (Zod + Supabase + Resend + Turnstile)
  sitemap.ts                ← /sitemap.xml automático
  robots.ts                 ← /robots.txt automático
  error.tsx                 ← Error boundary
  not-found.tsx             ← 404

components/
  RegistroForm.tsx          ← Form cliente (useActionState + Turnstile + UTMs)
  FAQAccordion.tsx
  CountdownTimer.tsx
  AnimatedCounter.tsx
  ScrollReveal.tsx
  HeaderScroll.tsx
  MobileNav.tsx
  WhatsAppButton.tsx

lib/
  supabase.ts               ← createPublicClient / createAdminClient
  schemas.ts                ← Zod schema + PRECIOS (derivado de ACCESO_OPTIONS)
  constants.ts              ← ACCESO_OPTIONS, EVENT, STATS (fuente de verdad)
  rate-limit.ts             ← Rate limiter in-memory (5 req/IP/15min)
  turnstile.ts              ← Verificación server-side Cloudflare Turnstile
  email.ts                  ← sendConfirmationEmail() via Resend
  schemas.test.ts           ← Tests unitarios de Zod schema

scripts/
  optimize-images.mjs       ← Compresión PNG → WebP/AVIF con sharp

supabase/
  migrations/
    002_hardening.sql       ← RLS hardening, audit columns, CHECK constraints

public/images/
  hero-bg.webp              ← Imagen hero (120KB, optimizada de 800KB)
  speaker-*.webp            ← Fotos speakers (43–129KB, optimizadas de 5–6MB)
  og-image.webp             ← Open Graph image
```

---

## Base de datos — tabla `registros`

| Campo | Tipo | Descripción |
|---|---|---|
| `folio` | TEXT UNIQUE | `SCSS2026-XXXXX-XXXX` |
| `nombre` | TEXT | |
| `apellido` | TEXT | |
| `email` | TEXT UNIQUE | Previene duplicados |
| `telefono` | TEXT | Opcional |
| `empresa` | TEXT | |
| `cargo` | TEXT | |
| `tipo_acceso` | ENUM | `estudiante \| general \| vip` |
| `monto_mxn` | INTEGER | Precio al momento del registro |
| `estado_pago` | ENUM | `pendiente \| pagado \| cancelado` |
| `credencial_estudiantil` | BOOLEAN | Solo para tipo `estudiante` |
| `requiere_cfdi` | BOOLEAN | |
| `rfc` | TEXT | Solo si `requiere_cfdi = true` |
| `razon_social` | TEXT | Solo si `requiere_cfdi = true` |
| `codigo_postal_fiscal` | TEXT | Solo si `requiere_cfdi = true` |
| `ip_registro` | TEXT | Auditoría |
| `user_agent` | TEXT | Auditoría |
| `referer` | TEXT | Atribución |
| `utm_source` | TEXT | Atribución |
| `utm_medium` | TEXT | Atribución |
| `utm_campaign` | TEXT | Atribución |
| `created_at` | TIMESTAMPTZ | Auto |
| `updated_at` | TIMESTAMPTZ | Auto (trigger) |

### Seguridad

- RLS habilitado — `anon` y `authenticated` no tienen acceso a `registros`
- Solo `service_role` puede insertar/leer (Server Action usa `createAdminClient()`)
- CHECK constraint: `monto_mxn` debe corresponder al `tipo_acceso`
- CHECK constraint: `email` debe tener formato válido
- Rate limit: 5 registros por IP cada 15 minutos (in-memory; migrar a Vercel KV para producción)
- Cloudflare Turnstile valida que el usuario no sea bot antes del insert

---

## Runbook

### Un registro falló (DB error)
1. Revisa logs de Vercel → Functions → `registro`
2. Si es `23505` (duplicate key) → el email ya existe, OK
3. Si es otro código → revisar conexión a Supabase y service_role key

### Un email de confirmación no llegó
1. Email puede estar en spam — pedir al usuario que revise
2. Verificar en Resend Dashboard → Emails → buscar por dirección
3. Si Resend rechazó → verificar que el dominio `scsecuritysummit.com` esté verificado en Resend
4. El registro **ya está en DB** aunque el email falle — contactar manualmente con el folio

### El formulario muestra error de bot (Turnstile)
1. Verificar que `NEXT_PUBLIC_TURNSTILE_SITE_KEY` coincide con el dominio registrado en Cloudflare
2. En dev local sin key → la validación se omite (fail-open)
3. En producción → si falla, el usuario debe recargar la página

### Actualizar estado de pago de un registro
1. Supabase Dashboard → Table Editor → `registros`
2. Buscar por `folio` o `email`
3. Cambiar `estado_pago` de `pendiente` → `pagado`

---

## Deploy en Vercel

1. Conectar repo en vercel.com
2. Agregar todas las variables de entorno del `.env.local.example`
3. Verificar dominio `scsecuritysummit.com` en Cloudflare Turnstile y Resend
4. `git push` → Vercel hace el deploy automáticamente

---

## Siguientes pasos recomendados

1. **Rate limit distribuido** — migrar `lib/rate-limit.ts` a `@vercel/kv` (Upstash Redis). El limiter actual es por-instancia-de-lambda; en multi-región no es efectivo contra ataques distribuidos.
2. **Integración de pago** — agregar Stripe o Mercado Pago para cobro en línea y actualizar `estado_pago` automáticamente.
3. **Dashboard admin** — página protegida con Supabase Auth para ver registros y marcar pagos.
4. **CFDI automático** — integrar Facturama o SW Sapien para emitir facturas automáticamente tras confirmar pago.
5. **Notificación al admin** — enviar email a `Contacto@LanzLogistics.com` en cada nuevo registro.
