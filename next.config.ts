import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "scsecuritysummit.com",
        "www.scsecuritysummit.com",
        "sc-security-summit.vercel.app",
        "sc-security-summit-git-main-wemmanuel2-8516s-projects.vercel.app",
        "sc-security-summit-wemmanuel2-8516s-projects.vercel.app",
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
          // HSTS — prevents HTTPS→HTTP downgrade attacks; required for preload list
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // CSP is handled by middleware.ts (nonce-based per-request).
          // The middleware sets Content-Security-Policy on every response.
        ],
      },
      {
        // 1-year immutable cache for versioned image assets.
        // If an image changes, rename the file to bust the cache.
        source: "/images/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
