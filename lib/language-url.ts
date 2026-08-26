// =============================================================
// Language URL helpers (client-safe)
// =============================================================
// `lib/language.ts` reads cookies and headers, so it is server-only and a
// Client Component cannot import a value from it. These helpers are pure,
// so they live here and both sides can use them.
// =============================================================

import type { Language } from "@/lib/language";

/**
 * Where the in-app toggle has to send the reader to actually switch language.
 *
 * `?lang=` outranks the cookie, so on a URL that carries it, writing the
 * cookie and re-rendering leaves the page in the language the param names —
 * the toggle looks broken. Every hreflang alternate, every social share and
 * every pricing CTA (`/checkout?lang=en&tier=...`) carries that param, so
 * this is the common case, not the corner one.
 *
 * Returns the same URL with `lang` rewritten when the param is present, or
 * `null` when it is absent and the freshly written cookie already decides.
 */
export function languageSwitchTarget(
  currentUrl: string,
  next: Language,
): string | null {
  let url: URL;
  try {
    url = new URL(currentUrl);
  } catch {
    return null;
  }
  if (!url.searchParams.has("lang")) return null;
  url.searchParams.set("lang", next);
  return `${url.pathname}${url.search}${url.hash}`;
}
