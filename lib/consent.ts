export const COOKIE_CONSENT_STORAGE_KEY = "scss2026:cookie-consent";
export const COOKIE_CONSENT_EVENT = "scss2026:consent";

export type CookieConsentDecision = "all" | "essential";

export function isCookieConsentDecision(
  value: unknown,
): value is CookieConsentDecision {
  return value === "all" || value === "essential";
}

export function readCookieConsentDecision(): CookieConsentDecision | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "decision" in parsed &&
      isCookieConsentDecision(parsed.decision)
    ) {
      return parsed.decision;
    }
  } catch {
    // Missing, blocked or malformed storage means no marketing consent.
  }

  return null;
}

export function hasMarketingConsent(): boolean {
  return readCookieConsentDecision() === "all";
}
