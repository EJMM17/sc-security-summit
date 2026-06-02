# RUNBOOK — SC Security Summit 2026

## Objetivo

Definir la operación mínima para continuidad del registro cuando fallen servicios críticos (Supabase, Upstash, correo transaccional o despliegue web).

## Servicios críticos

- Frontend/App: Next.js (Vercel)
- Base de datos: Supabase
- Anti-bot: honeypot + rate limiting distribuido + validación server-side
- Rate limiting: Upstash Redis

## Señales de incidente

- Incremento de errores en `registrarAsistente`.
- Caída de conversiones a registro exitoso.
- Errores 5xx en Vercel o timeouts en Server Action.
- Errores de inserción a Supabase.

## Niveles de severidad

- **SEV-1:** registro completamente caído por más de 10 minutos.
- **SEV-2:** degradación parcial (intermitencia, latencia alta, rechazos anómalos).
- **SEV-3:** incidencias menores sin impacto significativo de conversión.

## Protocolo de respuesta

1. **Confirmar el alcance (5 min):**
   - Revisar logs de despliegue y errores de Server Action.
   - Verificar estado de Supabase, Upstash, Vercel y DNS.
2. **Mitigar (10 min):**
   - Si el rate limiting o validaciones anti-spam bloquean tráfico legítimo, comunicar y activar plan temporal de registro manual.
   - Si falla DB, habilitar captura temporal offline (formulario alterno).
3. **Comunicar (inmediato):**
   - Publicar aviso interno al equipo operativo/comercial.
   - Ajustar copy de CTA en la web si aplica.
4. **Recuperar (hasta resolución):**
   - Restaurar flujo normal de registro y validar fin a fin.
5. **Postmortem (24-48 h):**
   - Documentar causa raíz, impacto, tiempo de resolución y acciones preventivas.

## Fallback de registro manual

Cuando el flujo automatizado no esté disponible:

1. Habilitar un canal temporal de captura (Google Form o Typeform interno).
2. Campos mínimos requeridos:
   - nombre
   - apellido
   - email
   - empresa
   - cargo
   - tipo_acceso
   - requiere_cfdi + datos fiscales (si aplica)
3. Confirmar recepción por correo con folio temporal `MANUAL-YYYYMMDD-####`.
4. Al recuperar sistema:
   - importar registros manuales a Supabase,
   - marcar origen como `manual_fallback`,
   - evitar duplicados por email.

## Checklist operativo pre-evento

- [ ] Validar que `npm run lint` y `npm run build` pasan en CI.
- [ ] Confirmar variables de entorno de producción.
- [ ] Probar registro de punta a punta (incluyendo CFDI).
- [ ] Probar escenario de duplicado de email.
- [ ] Verificar monitoreo y contactos de escalamiento.

## Contactos de escalamiento (completar)

- Responsable técnico:
- Responsable comercial/evento:
- Soporte plataforma:
- Ventana de guardia:
