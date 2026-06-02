# Auditoría de repositorio — SC Security Summit 2026

Fecha: 2026-04-25 (UTC)

## Resumen ejecutivo

El proyecto está bien encaminado para un landing + registro productivo (Next.js 15, validación con Zod, Server Actions, honeypot, rate limiting con Upstash, headers de seguridad y hardening de DB). Aun así, para acercarlo a un estado “casi perfecto” en contexto de evento con captura de datos personales, faltan varios componentes de excelencia operativa.

## Hallazgos priorizados

### P0 — Bloqueantes / alto riesgo

1. **Linting no automatizable en CI actualmente**
   - `npm run lint` solicita configuración interactiva de ESLint porque no existe configuración final en repo.
   - Impacto: no se puede ejecutar lint en modo no interactivo en pipelines, se pierde control de calidad automático.
   - Evidencia: el script existe, pero no hay setup de ESLint en el repo. (`package.json` usa `next lint`).

2. **Migración SQL con referencias potencialmente inválidas**
   - `002_hardening.sql` intenta ejecutar `ALTER FUNCTION public.set_updated_at()` y `ALTER FUNCTION public.notify_new_registro()`.
   - En la migración principal se crea `update_updated_at_column()` (otro nombre), y no hay evidencia de `notify_new_registro()` en el repositorio.
   - Impacto: la migración puede fallar en entornos nuevos o inconsistentes.

3. **Sin suite de pruebas automatizadas**
   - Está documentado que no hay test runner.
   - Impacto: regresiones en reglas críticas (registro, antifraude, validación CFDI, i18n, SEO técnico) podrían llegar a producción.

### P1 — Importante (recomendado antes de escalar)

4. **Dependencias con alerta de seguridad reportada por `npm audit`**
   - Se reporta vulnerabilidad moderada de PostCSS (`<8.5.10`) transitiva de `next` actual.
   - Impacto: aunque sea transitive, conviene monitorear release de Next que suba PostCSS y actualizar en cuanto sea compatible.

5. **Falta de CI/CD declarativo visible en repo**
   - No hay workflow de GitHub Actions (lint/build/typecheck/audit básico).
   - Impacto: calidad y seguridad dependen de ejecución manual.

6. **Documentación de respuesta a incidentes y continuidad**
   - No hay playbook versionado para incidentes (caídas de Supabase/Upstash/correo transaccional, fallback de registro, backups/export de registros).
   - Impacto: riesgo operativo durante campaña y días cercanos al evento.

7. **Gobernanza de datos personales incompleta**
   - Se almacenan IP, user-agent y referer para auditoría, pero no está versionada una política técnica de retención/anominización.
   - Impacto: exposición legal/privacidad si no se define ciclo de vida de datos.

### P2 — Mejora de excelencia

8. **Endurecer configuración de orígenes permitidos para Server Actions**
   - Actualmente hay varios dominios hardcodeados (incluyendo previews concretos de Vercel).
   - Recomendación: centralizar por variables de entorno y automatizar dominio canónico + preview pattern controlado.

9. **Observabilidad y métricas de negocio/técnicas**
   - Hay logs estructurados vía `console.log`, pero falta trazabilidad centralizada (errores por etapa del flujo, saturación rate limit, conversión por UTM).

10. **Validaciones de accesibilidad y performance con presupuesto formal**
    - Recomendado incorporar auditorías automatizadas (Lighthouse CI / axe) con umbrales mínimos.

## Plan sugerido (2 semanas)

### Semana 1
- Configurar ESLint no interactivo y fijar comandos de calidad (`lint`, `typecheck`).
- Agregar pipeline CI (PR + main): install, lint, build, checks de seguridad básicos.
- Corregir migración `002_hardening.sql` para referenciar funciones existentes o crear guards idempotentes.
- Definir política de retención de PII (IP/user-agent/referer) y documentarla.

### Semana 2
- Implementar pruebas mínimas:
  - unitarias para `lib/schemas.ts`
  - integración para `app/actions/registro.ts` (casos: honeypot, RL, email duplicado, CFDI)
- Agregar dashboard de observabilidad (errores por etapa + métricas de registro).
- Formalizar runbook de operación para ventana del evento.

## Definición de “repo casi perfecta” para este proyecto

- CI verde obligatorio en cada PR.
- Cobertura mínima en flujo de registro (objetivo inicial 70% en módulos críticos).
- Migraciones reproducibles 100% desde cero (sin pasos manuales ambiguos).
- Checklist de privacidad/seguridad operativo y firmado por responsables.
- Playbook de incidentes y monitoreo con alertas activas.

## Quick wins inmediatos

1. Reemplazar `next lint` por ESLint CLI configurado para ejecución no interactiva.
2. Arreglar `supabase/migrations/002_hardening.sql` para evitar `ALTER FUNCTION` sobre funciones inexistentes.
3. Agregar workflow CI básico de 5-10 minutos (lint + build + audit en modo informativo).
4. Crear `RUNBOOK.md` con fallback de registro manual y protocolo de comunicación.
