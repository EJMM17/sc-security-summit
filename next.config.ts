import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allow both local dev and all production/preview Vercel domains
      allowedOrigins: [
        "localhost:3000",
        "scsecuritysummit.com",
        "www.scsecuritysummit.com",
        "*.vercel.app",
      ],
    },
  },
  images: {
    // All images served locally from /public — no remote domains needed.
    // If you add a CDN later (Cloudinary, Imgix, etc.), add its hostname here.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              "frame-src https://www.google.com https://maps.google.com",
              "connect-src 'self' https://*.supabase.co https://vitals.vercel-insights.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
