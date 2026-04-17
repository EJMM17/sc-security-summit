/**
 * Rate limiter in-memory simple para Server Actions.
 * Ventana: 5 registros por IP cada 15 minutos.
 *
 * TODO: migrar a Vercel KV (@vercel/kv) o Upstash Redis para rate limiting
 * distribuido real. En Vercel con múltiples regiones, cada lambda tiene su
 * propio estado en memoria — este limiter bloquea spam básico pero NO ataques
 * distribuidos desde múltiples IPs o regiones distintas.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

const WINDOW_MS = 15 * 60 * 1000; // 15 min
const MAX_REQUESTS = 5;

export function checkRateLimit(ip: string): {
  ok: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: MAX_REQUESTS - 1, resetAt: now + WINDOW_MS };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count++;
  return { ok: true, remaining: MAX_REQUESTS - bucket.count, resetAt: bucket.resetAt };
}

// Limpieza periódica para evitar leak de memoria
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, bucket] of buckets.entries()) {
      if (bucket.resetAt < now) buckets.delete(ip);
    }
  }, 60 * 1000);
}
