import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/_next/", "/pago", "/registro-exitoso"],
      },
    ],
    sitemap: "https://www.scsecuritysummit.com/sitemap.xml",
    host: "https://www.scsecuritysummit.com",
  };
}
