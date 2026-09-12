# Photo Manifest — SC Security Summit 2026

Última revisión: 2026-07-29.

Todas las imágenes activas se sirven localmente desde `public/images/`. Los
nombres utilizados por la aplicación se definen en `lib/content.ts` o
directamente en los componentes de marketing. Agregar un archivo nuevo no hace
que el sitio lo use automáticamente: también hay que referenciarlo en código o
contenido.

## Inventario activo

### Marca y metadatos

| Archivo | Uso |
|---|---|
| `logo-full-blue.png`, `logo-full-navy.png`, `logo-full-white.png` | Logotipo completo en distintos fondos |
| `logo-symbol-blue.png`, `logo-symbol-white.png`, `logo-symbol-square.png` | Isotipo y aplicaciones compactas |
| `og-image.png`, `og-image.webp` | Imagen social estática y respaldo |

Los favicons y los iconos PWA viven directamente en `public/`, no en
`public/images/`.

### Hero y galería

| Archivo | Uso |
|---|---|
| `hero-bg.webp`, `hero-bg-1200.webp`, `hero-bg-800.webp` | Hero responsive |
| `gallery-hall.webp` | Auditorio |
| `gallery-hub.webp` | Networking |
| `gallery-keynote.webp` | Conferencia |
| `gallery-registro.webp` | Recepción del evento |
| `photo-conference-audience.webp` | Audiencia |
| `photo-conference-networking.webp` | Networking |
| `photo-conference-speaker.webp` | Ponente |
| `photo-logistics-operations.webp` | Operación logística |
| `photo-logistics-team.webp` | Equipo de logística |

### Conferencistas

Cada ponente tiene una imagen web optimizada y una fuente de mayor resolución:

- `speaker-eduardo.webp` / `speaker-eduardo-4k.webp`
- `speaker-fidel.webp` / `speaker-fidel-4k.webp`
- `speaker-isidoro.webp` / `speaker-isidoro-4k.webp`
- `speaker-julio.webp` / `speaker-julio-4k.webp`
- `speaker-sandra.webp` / `speaker-sandra-4k.webp`
- `speaker-sandra.src.png` se conserva como fuente original.

### Presentadores

Las versiones en blanco (`presenter-*.png`) que usaba el hero quedaron
retiradas. La sección `#presentadores` usa los logos a color, en
`public/images/presenters/`, con fondo blanco plano y sin margen sobrante
(el fondo original venía en `#f7f7f7` con ruido de compresión; se normalizó
a blanco puro para que la caja del logo se funda con la tarjeta):

- `lanz-logistics.png`
- `villa-florida.png`
- `iies.png`
- `blanquita.png`
- `laboratorios-eloisa.png`
- `vigilancia-intramuros.png`
- `spi.png`
- `innovalab.png`

Cada archivo se enlaza desde `PRESENTERS` en `lib/content.ts`. Un presentador
con `logo: null` se muestra como wordmark tipográfico hasta que su archivo
exista, para no publicar imágenes rotas.

Las tres marcas que se sumaron después llegaron sin recortar y se les aplicó
el mismo tratamiento:

- `vigilancia-intramuros.png` — venía con plato `#f7f7f7`; se normalizó a
  blanco puro y se recortó al lockup visible. La palabra «Reynosa» del
  original está compuesta en blanco sobre ese plato casi blanco, así que no
  era legible ni en la fuente y quedó fuera del recorte; si la marca entrega
  una versión con esa línea en un color legible, se reemplaza conservando el
  nombre del archivo.
- `spi.png` — fondo transparente; se recortó al lockup y se dejó fuera la
  regla azul y el claim «Seguridad y telecomunicaciones para tu empresa», que
  a tamaño de mosaico es microtipografía ilegible. Conserva el descriptor
  «Servicios Profesionales Integrados».
- `innovalab.png` — fondo transparente; solo se recortó el margen sobrante.

Los dos con transparencia se dejaron con canal alfa en lugar de aplanarlos a
blanco: sobre la tarjeta el resultado es idéntico y no quedan atados al color
de la superficie.

### Proporción del lienzo

Los logos de la alineación van de casi cuadrados (escudo municipal, 0.95) a
más de tres veces más anchos que altos (Villa Florida, 3.29). Un solo lienzo
no puede darles el mismo peso óptico —el ancho limita a los horizontales y la
altura a los verticales—, así que cada marca declara un `shape` en
`lib/content.ts` (`horizontal`, `balanced` o `stacked`) que elige la altura de
lienzo con la que todas cubren un área comparable. Al reemplazar un archivo
por otro de proporción distinta hay que actualizar ese `shape`;
`tests/brand-logos.test.ts` mide cada PNG y falla si la declaración dejó de
corresponder al archivo.

El orden de `PRESENTERS` es parte del diseño: la alineación envuelve en dos,
tres o cuatro columnas, así que Laboratorios Eloisa e InnovaLab se mantienen
en extremos opuestos de la lista para que nunca queden contiguos.
`tests/brand-logos.test.ts` verifica esa distancia.

### Instituciones

Las marcas de gobierno encabezan la misma alineación: comparten la primera
fila entre ellas, con una tarjeta y un lienzo de logo más altos, porque son
la identidad institucional del Summit. Se enlazan desde `INSTITUTIONS` en
`lib/content.ts`, con `lead: true`:

- `gobierno-reynosa.png`
- `secretaria-desarrollo-economico.png`

Ambos archivos vienen de originales en alta y se muestran sin ampliar.

### Patrocinadores

Los patrocinadores también presentan el Summit: comparten carpeta,
tratamiento y tarjeta con los demás y se muestran en la misma alineación
única de la sección `#presentadores`, sin separación visual:

- `ford.png`
- `palco.png`
- `mundo-gps-reynosa.png`

Se enlazan desde `SPONSORS` en `lib/content.ts` —que `PRESENTING_BRANDS` une
con `PRESENTERS` para render— con el mismo comportamiento de wordmark cuando
falta el archivo. Las tres fuentes llegaron en JPG con fondo
plano; se normalizó todo pixel casi blanco (≥ 236 en los tres canales) a blanco
puro, se recortó el margen sobrante y se guardaron como PNG sRGB. `palco.png`
es el activo de menor resolución disponible (200 px de ancho): si el patrocinador
entrega un original mayor, conviene reemplazarlo conservando el nombre.

## Reglas para reemplazos

- Mantener exactamente el nombre cuando el reemplazo deba ser transparente.
- Preferir WebP para fotografías y PNG cuando se necesite transparencia.
- Mantener perfil sRGB.
- Conservar la relación de aspecto del recurso sustituido para evitar saltos de
  layout y recortes inesperados.
- Optimizar antes de subir; usar `npm run build` para verificar que Next.js
  pueda procesar el recurso.
- Si cambia un nombre, actualizar todas sus referencias y las variantes `es` y
  `en` de `lib/content.ts` cuando corresponda.

## Herramientas

- `scripts/optimize-hero.mjs`: genera las variantes responsive del hero.
- `scripts/optimize-images.mjs`: utilidades de optimización para el inventario.

Después de cualquier cambio visual, revisar al menos la landing en móvil y
escritorio y ejecutar las pruebas E2E.
