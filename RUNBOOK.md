# RUNBOOK — SC Security Summit 2026

## Objetivo

Definir la operación mínima para continuidad de la captación de leads (pase corporativo y
patrocinio) y de la venta de accesos cuando fallen servicios críticos: Eventbrite, Resend,
Upstash o el despliegue web.

## Servicios críticos

- Frontend/App: Next.js (Vercel)
- Venta de accesos individuales: **Eventbrite** (fuera del sitio)
- Correo transaccional de solicitudes: Resend → `CONTACT_EMAIL`
- Anti-bot: honeypot + rate limiting distribuido + validación server-side (Zod)
- Rate limiting: Upstash Redis

El sitio no tiene base de datos en runtime: si el formulario responde, no hay nada que
persistir más allá del correo.

## Señales de incidente

- Errores en la Server Action `submitInquiry` (Sentry).
- Caída de solicitudes recibidas en `CONTACT_EMAIL`.
- Errores 5xx en Vercel o timeouts en Server Action.
- Rebotes o fallos de entrega en el panel de Resend.
- CTA de accesos que no abre Eventbrite, o evento de Eventbrite despublicado/agotado.

## Niveles de severidad

- **SEV-1:** el sitio está caído, o los CTA de compra no llegan a Eventbrite, por más de 10 minutos.
- **SEV-2:** degradación parcial (las solicitudes no llegan por correo, intermitencia, rechazos anómalos).
- **SEV-3:** incidencias menores sin impacto significativo de conversión.

## Protocolo de respuesta

1. **Confirmar el alcance (5 min):**
   - Revisar logs de despliegue y errores de Server Action.
   - Verificar estado de Vercel, Resend, Upstash, Eventbrite y DNS.
2. **Mitigar (10 min):**
   - Si Resend falla, publicar temporalmente el correo de contacto directo junto al formulario.
   - Si el rate limiting bloquea tráfico legítimo, comunicarlo y revisar la ventana en `lib/rate-limit.ts`.
   - Si Eventbrite está caído, sustituir el CTA por captura de interés al correo de contacto.
3. **Comunicar (inmediato):**
   - Publicar aviso interno al equipo operativo/comercial.
   - Ajustar copy de CTA en la web si aplica (`lib/content.ts`).
4. **Recuperar (hasta resolución):**
   - Restaurar el flujo normal y validar de punta a punta.
5. **Postmortem (24-48 h):**
   - Documentar causa raíz, impacto, tiempo de resolución y acciones preventivas.

## Fallback de captación manual

Cuando el envío por Resend no esté disponible:

1. Habilitar un canal temporal de captura (Google Form o Typeform interno).
2. Campos mínimos requeridos (los mismos del formulario corporativo):
   - nombre(s), apellidos
   - correo corporativo
   - empresa
   - cargo
   - teléfono móvil
3. Al recuperar el servicio, cargar esos leads al CRM/hoja del equipo comercial y evitar
   duplicados por correo.

## Checklist operativo pre-evento

- [ ] Validar que `npm run lint`, `npm test` y `npm run build` pasan en CI.
- [ ] Confirmar variables de entorno de producción (`RESEND_API_KEY`, `CONTACT_EMAIL`, `UPSTASH_*`).
- [ ] Enviar una solicitud de prueba de pase corporativo y otra de patrocinio, y confirmar recepción.
- [ ] Verificar que cada CTA de accesos abre el evento correcto en Eventbrite y que los 4 niveles
      (VIP, Plus, General, Estudiante) existen ahí con el precio publicado en el sitio.
- [ ] Verificar monitoreo y contactos de escalamiento.

## Contactos de escalamiento (completar)

- Responsable técnico:
- Responsable comercial/evento:
- Soporte plataforma:
- Ventana de guardia:
