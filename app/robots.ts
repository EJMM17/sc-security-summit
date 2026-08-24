import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/_next/",
          "/admin", // Internal operations panel
          "/checkout", // Transactional pages; order state must not be indexed
          "/monitoring", // Sentry tunnel route (next.config tunnelRoute)
        ],
      },
    ],
    sitemap: "https://scsecuritysummit.com/sitemap.xml",
    host: "https://scsecuritysummit.com",
  };
}
