import type { MetadataRoute } from "next";

const BASE_URL = "https://www.scsecuritysummit.com";

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
    {
      url: `${BASE_URL}/recuperar-folio`,
      lastModified: new Date("2026-05-19"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/aviso-de-privacidad`,
      lastModified: new Date("2026-04-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terminos-y-condiciones`,
      lastModified: new Date("2026-04-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
