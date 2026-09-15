# Verificación de carga, CI y pagos — 2026-09-15

## Alcance

Revisión del árbol de trabajo local, conservando los cambios que ya existían.
No se desplegó, no se modificó la base remota y no se hicieron cargos reales.

## Hallazgos y correcciones

- El último CI consultado, [34716023006](https://github.com/EJMM17/sc-security-summit/actions/runs/34716023006), falló por auditoría de dependencias y por firmas antiguas de RPC en la prueba 004. La corrección de esas firmas ya existía en el árbol de trabajo al iniciar esta revisión.
- La auditoría local inicial encontró nueve vulnerabilidades. Se actualizaron Next y eslint-config-next a 15.5.25, Sharp a 0.35.4, brace-expansion a 5.0.12 y Vitest/cobertura a 4.1.11, junto con las correcciones transitivas compatibles. Se conservaron los overrides; no se usó `audit fix --force`.
- El checkout omitía la aclaración de descuento opcional exigida por E2E. Se restauró en ambos idiomas.
- La prueba de participante vacío ahora acepta la validación nativa de WebKit y verifica que no salga una Server Action. Los otros navegadores siguen comprobando la normalización y el mensaje de la aplicación.
- La prueba de recarga desplaza los elementos animados antes de comprobar su visibilidad, sin esperar primero a que su geometría sea estable.

## Evidencia

- Auditoría de dependencias: cero vulnerabilidades.
- Vitest con Node 22.23.2: 44 archivos, 528 pruebas aprobadas; cobertura de líneas 96.55%, ramas 90.02%.
- Compilación de Next 15.5.25 con Node 22: aprobada.
- ESLint y contrato de entorno: aprobados.
- Sitio publicado: tres GET a cada una de `/`, `/checkout` y `/api/health`, todos HTTP 200. Tiempo de respuesta observado entre 241 y 1549 ms; no representa el tiempo de renderizado ni una prueba de carga concurrente.

## Límites pendientes

- No hay Docker disponible en este equipo: no se ejecutaron reset local, pgTAP, lint de base ni comparación de tipos generados. El job de base de datos debe confirmar el cambio previo de firmas.
- No se ejecutó una nueva corrida remota de CI ni Lighthouse sobre un despliegue de estos cambios.
- Las pruebas de pagos usan adaptadores controlados: verifican cálculo, persistencia, reintentos, webhook, conciliación y recuperación, pero no confirman una transacción real con MercadoPago.
- El contexto vigente registra aprobación pendiente del consentimiento para ventas y un incidente intermitente PGRST303 mitigado por reintentos. No se cerraron esos pendientes en esta revisión.
- Ninguna prueba garantiza disponibilidad permanente del banco, MercadoPago, Supabase o la red.
