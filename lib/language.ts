// =============================================================
// Language detection (server-side)
// =============================================================
// Source-of-truth chain (highest priority first):
//   1. NEXT_LOCALE cookie set by the user via the in-app toggle
//   2. ?lang=es|en URL search param (one-shot override, e.g. social
//      shares "view this in EN")
//   3. Accept-Language request header — basic en/es prefix match
//   4. Default "es" — site is Spanish-first
//
// Components on the client mirror the same value via localStorage so
// the SSR-rendered <html lang=...> agrees with the client's first
// render (no hydration mismatch).
// =============================================================

import { cookies, headers } from "next/headers";

export type Language = "es" | "en";
export const LANGUAGE_COOKIE = "NEXT_LOCALE";
export const LANGUAGE_COOKIE_MAX_AGE_S = 60 * 60 * 24 * 365; // 1 year
export const SUPPORTED: readonly Language[] = ["es", "en"] as const;

export function isLanguage(value: unknown): value is Language {
  return value === "es" || value === "en";
}

export function resolveRequestLanguage(
  searchParam?: string | null,
  cookieValue?: string,
  acceptLanguage?: string | null,
): Language {
  if (isLanguage(searchParam)) return searchParam;
  if (isLanguage(cookieValue)) return cookieValue;
  if (acceptLanguage && /^en\b/i.test(acceptLanguage)) return "en";
  return "es";
}

export async function getRequestLanguage(searchParam?: string | null): Promise<Language> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LANGUAGE_COOKIE)?.value;

  const h = await headers();
  // Layouts can't access searchParams — the middleware forwards ?lang= as
  // the x-lang header so <html lang> matches the rendered language.
  const param = searchParam ?? h.get("x-lang");
  return resolveRequestLanguage(param, cookieValue, h.get("accept-language"));
}
