// SC Security Summit 2026 — minimal service worker.
// Strategy:
//   • Static assets (/_next/static, /images/) → cache-first, long TTL.
//   • Navigations (HTML) → network-first with cache fallback (offline grace).
//   • Everything else (API, /admin, /api/webhooks, POSTs) → bypass.
//
// Versioning: bump CACHE_VERSION to invalidate. Old caches are pruned in
// `activate`. Cache size is capped via opportunistic eviction.

const CACHE_VERSION = "scss2026-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGES_CACHE = `${CACHE_VERSION}-pages`;
const MAX_PAGES_ENTRIES = 30;

self.addEventListener("install", (event) => {
  // Activate immediately on first install — no waiting for old SW.
  self.skipWaiting();
  event.waitUntil(caches.open(STATIC_CACHE));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/fonts/") ||
    /\.(?:css|js|woff2?|png|jpg|jpeg|webp|svg|ico)$/.test(url.pathname)
  );
}

function isBypass(url, request) {
  if (request.method !== "GET") return true;
  if (url.pathname.startsWith("/api/")) return true;
  if (url.pathname.startsWith("/admin")) return true;
  if (url.pathname.startsWith("/pago")) return true;
  if (url.pathname.startsWith("/registro-exitoso")) return true;
  return false;
}

async function trimCache(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (isBypass(url, event.request)) return;

  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const hit = await cache.match(event.request);
        if (hit) return hit;
        try {
          const res = await fetch(event.request);
          if (res.ok) cache.put(event.request, res.clone());
          return res;
        } catch (err) {
          if (hit) return hit;
          throw err;
        }
      })(),
    );
    return;
  }

  // Navigations / HTML — network-first.
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(event.request);
          // Only cache successful pages — never error responses.
          if (res.ok) {
            const cache = await caches.open(PAGES_CACHE);
            cache.put(event.request, res.clone());
            trimCache(PAGES_CACHE, MAX_PAGES_ENTRIES);
          }
          return res;
        } catch {
          const cache = await caches.open(PAGES_CACHE);
          const hit = await cache.match(event.request);
          if (hit) return hit;
          return new Response("Offline — vuelve a conectarte para registrarte.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }
      })(),
    );
  }
});
