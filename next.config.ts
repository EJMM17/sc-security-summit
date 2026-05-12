import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
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
  webpack: (config) => {
    // @sentry/node bundles @opentelemetry/instrumentation, which uses dynamic
    // require() to load platform code. Webpack flags this as a critical
    // dependency. The runtime behavior is safe (Sentry-documented), so silence
    // the warning to keep build logs clean.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { module: /@opentelemetry\/instrumentation/, message: /Critical dependency/ },
      { module: /@prisma\/instrumentation/, message: /Critical dependency/ },
    ];
    return config;
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
          // Blocks legacy Adobe Flash / PDF cross-domain-policy files.
          { key: "X-Permitted-Cross-Origin-Policies", value: "none" },
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

// Sentry wraps the Next config so source maps upload at build time and the
// /monitoring tunnel route proxies events around ad blockers (and keeps
// ingest.sentry.io off the CSP allowlist).
//
// Source map uploads only happen when SENTRY_AUTH_TOKEN is present in the
// environment (set in Vercel → Project Settings → Environment Variables).
// Local builds skip the upload step.
const sentryEnabled = Boolean(process.env.SENTRY_DSN);

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      sourcemaps: { deleteSourcemapsAfterUpload: true },
      disableLogger: true,
      tunnelRoute: "/monitoring",
      automaticVercelMonitors: false,
    })
  : nextConfig;
