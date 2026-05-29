// =============================================================
// First-party marketing attribution capture (client-side)
// =============================================================
// Captures campaign parameters (UTM + ad click IDs) plus landing page
// and referrer, and persists BOTH a first-touch and a last-touch record
// in localStorage AND a first-party cookie. This survives internal
// navigation, so a visitor who arrives from an Ad, browses the site and
// later registers still carries their original acquisition data into the
// registration payload.
//
// Pure module (no React, no "use client"). Every function is SSR-safe —
// it no-ops when `window` is unavailable.
// =============================================================

export const ATTRIBUTION_PARAM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid", // Google Ads click id
  "gbraid", // Google Ads (app → web, iOS)
  "wbraid", // Google Ads (web → app, iOS)
  "fbclid", // Meta click id
  "li_fat_id", // LinkedIn click id
  "msclkid", // Microsoft Ads click id
] as const;

export type AttributionParamKey = (typeof ATTRIBUTION_PARAM_KEYS)[number];

export const ATTRIBUTION_FIELD_KEYS = [
  ...ATTRIBUTION_PARAM_KEYS,
  "landing_page",
  "referrer",
  "first_touch_timestamp",
  "last_touch_timestamp",
] as const;

export type AttributionFieldKey = (typeof ATTRIBUTION_FIELD_KEYS)[number];

export type AttributionPayload = Record<AttributionFieldKey, string>;

type Touch = {
  params: Partial<Record<AttributionParamKey, string>>;
  landing_page: string;
  referrer: string;
  timestamp: string;
};

type Store = { first: Touch; last: Touch };

const LS_KEY = "scss:attribution";
const COOKIE_KEY = "scss_attr";
const COOKIE_MAX_AGE_S = 60 * 60 * 24 * 90; // 90 days

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function parseParams(search: string): Partial<Record<AttributionParamKey, string>> {
  const sp = new URLSearchParams(search);
  const out: Partial<Record<AttributionParamKey, string>> = {};
  for (const key of ATTRIBUTION_PARAM_KEYS) {
    const value = sp.get(key);
    if (value) out[key] = value.slice(0, 512); // defensive length cap
  }
  return out;
}

function readStore(): Store | null {
  if (!hasWindow()) return null;
  // localStorage first (richer/longer lived), cookie as fallback.
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {
    /* private mode / blocked storage */
  }
  try {
    const match = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${COOKIE_KEY}=`));
    if (match) {
      const value = match.slice(COOKIE_KEY.length + 1);
      return JSON.parse(decodeURIComponent(value)) as Store;
    }
  } catch {
    /* malformed cookie */
  }
  return null;
}

function writeStore(store: Store): void {
  if (!hasWindow()) return;
  const json = JSON.stringify(store);
  try {
    window.localStorage.setItem(LS_KEY, json);
  } catch {
    /* ignore */
  }
  try {
    document.cookie = `${COOKIE_KEY}=${encodeURIComponent(
      json,
    )}; Max-Age=${COOKIE_MAX_AGE_S}; Path=/; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

function currentTouch(timestamp: string): Touch {
  return {
    params: parseParams(window.location.search),
    landing_page: window.location.pathname + window.location.search,
    referrer: document.referrer || "",
    timestamp,
  };
}

/**
 * Records the current page view into the attribution store.
 * - First-touch is written exactly once (the very first visit ever).
 * - Last-touch is replaced whenever the current URL carries campaign
 *   params; otherwise only its recency timestamp is refreshed so an
 *   internal navigation never wipes the converting campaign.
 *
 * Idempotent — safe to call on every page load / multiple components.
 */
export function captureAttribution(): void {
  if (!hasWindow()) return;
  const now = new Date().toISOString();
  const touch = currentTouch(now);
  const hasParams = Object.keys(touch.params).length > 0;

  const existing = readStore();
  if (!existing) {
    writeStore({ first: touch, last: touch });
    return;
  }

  const next: Store = { first: existing.first, last: existing.last };
  if (hasParams) {
    next.last = touch;
  } else {
    next.last = { ...existing.last, timestamp: now };
  }
  writeStore(next);
}

function emptyPayload(): AttributionPayload {
  const payload = {} as AttributionPayload;
  for (const key of ATTRIBUTION_FIELD_KEYS) payload[key] = "";
  return payload;
}

/**
 * Flat snapshot suitable for hidden form inputs and the DB.
 * UTM / click IDs use LAST-touch (the converting campaign); landing page
 * and referrer use FIRST-touch (original acquisition). Both timestamps
 * are included.
 */
export function getAttributionPayload(): AttributionPayload {
  const payload = emptyPayload();
  const store = readStore();

  if (!store) {
    // No history yet (e.g. JS just loaded) — return what we can see now.
    if (hasWindow()) {
      const now = new Date().toISOString();
      const touch = currentTouch(now);
      for (const key of ATTRIBUTION_PARAM_KEYS) payload[key] = touch.params[key] ?? "";
      payload.landing_page = touch.landing_page;
      payload.referrer = touch.referrer;
      payload.first_touch_timestamp = now;
      payload.last_touch_timestamp = now;
    }
    return payload;
  }

  for (const key of ATTRIBUTION_PARAM_KEYS) payload[key] = store.last.params[key] ?? "";
  payload.landing_page = store.first.landing_page;
  payload.referrer = store.first.referrer;
  payload.first_touch_timestamp = store.first.timestamp;
  payload.last_touch_timestamp = store.last.timestamp;
  return payload;
}
