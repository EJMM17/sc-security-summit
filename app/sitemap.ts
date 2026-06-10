import type { MetadataRoute } from "next";

const BASE_URL = "https://scsecuritysummit.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: {
        languages: {
          "es-MX": `${BASE_URL}/?lang=es`,
          "en-US": `${BASE_URL}/?lang=en`,
        },
      },
    },
    // ── Acquisition / SEO landing pages ──────────────────────────────
    {
      url: `${BASE_URL}/sponsors`,
      lastModified: new Date("2026-05-29"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/media-kit`,
      lastModified: new Date("2026-05-29"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/ctpat-oea`,
      lastModified: new Date("2026-05-29"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/seguridad-cadena-suministro`,
      lastModified: new Date("2026-05-29"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/evento-logistica-reynosa`,
      lastModified: new Date("2026-05-29"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    // /recuperar-folio, /aviso-de-privacidad and /terminos-y-condiciones are
    // intentionally omitted: they're noindex, and a sitemap must only list
    // indexable URLs (Search Console flags "submitted URL marked noindex").
  ];
}
