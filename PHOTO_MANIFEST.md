# Photo Manifest — SC Security Summit 2026
## Drop-in Image Guide

Place all photos inside `/public/images/`. The site will automatically
pick them up — no code changes needed.

---

## Required Images

### Hero & Background Photos

| Filename | Used in | Recommended Size | Notes |
|---|---|---|---|
| `hero-bg.jpg` | HeroSection — full-bleed background | 1920×1080px min | High contrast scene: logistics, warehouse, or border crossing. Dark areas on left/center for text overlay. |
| `networking-hub.jpg` | BusinessHubSection — left photo column | 1200×900px min | People networking, handshakes, corporate event setting. |
| `venue-reynosa.jpg` | RegistroForm — left panel background | 1200×1600px min | Centro de Convenciones Reynosa exterior or interior. Portrait orientation preferred. |

### Speaker Portraits

| Filename | Speaker | Recommended Size | Notes |
|---|---|---|---|
| `speaker-fidel-guerrero.jpg` | Fidel Guerrero (INDEX) | 600×600px min | Square or portrait crop. Professional headshot. |
| `speaker-isidoro-juarez.jpg` | Isidoro Juárez (Mandatario Aduanal) | 600×600px min | Square or portrait crop. Professional headshot. |
| `speaker-julio-suarez.jpg` | Julio César Suárez (Trade Compliance) | 600×600px min | Square or portrait crop. Professional headshot. |
| `speaker-eduardo-luna.jpg` | Eduardo Luna (Innovación) | 600×600px min | Square or portrait crop. Professional headshot. |

---

## Optimal Photo Specs

- **Format:** JPG or WebP (Next.js auto-converts to AVIF/WebP at build time)
- **Color Profile:** sRGB
- **Hero backgrounds:** Minimum 1920×1080px, 72–150 DPI
- **Speaker portraits:** Minimum 600×600px square crop
- **Max file size:** 2–4MB per photo (Next.js optimizes at runtime)

## Image Overlay System

All background photos have programmatic overlays applied in code:
- `hero-bg.jpg` → `rgba(5,15,40,0.92)` gradient (dark navy, AAA contrast)
- `networking-hub.jpg` → `rgba(10,25,47,0.35)` right-to-left fade
- `venue-reynosa.jpg` → `rgba(5,15,45,0.94)` overlay (heavy, for text legibility)

You do NOT need to pre-darken your photos — the overlays handle contrast.

---

## Placeholder During Development

If you don't have photos yet, use a service like:
- `https://picsum.photos/1920/1080` (landscape)
- `https://picsum.photos/600/600` (square headshots)

Or install the `sharp` package for local placeholder generation:
```bash
npm install sharp
```
