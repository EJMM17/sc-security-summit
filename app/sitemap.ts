import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.scsecuritysummit.com";
  const lastModified = new Date();

  return [
    { url: base, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/aviso-de-privacidad`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terminos-y-condiciones`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
