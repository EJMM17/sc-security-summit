// =============================================================
// Enhanced Conversions helper (client-side)
// =============================================================
// Prepares user-provided data for Google Ads / GA4 Enhanced Conversions.
//
// Privacy posture: we NEVER push raw PII to the dataLayer. On form submit
// we stash NORMALIZED values in sessionStorage (same-origin, this tab
// only). On the success page we SHA-256 hash them, push only the hashes
// to the dataLayer, then immediately clear the sessionStorage entry.
//
// Hashing uses Web Crypto (crypto.subtle) and Google's normalization
// rules: trim everything, lowercase email + names, strip spaces/format
// chars from phone (keep a leading "+").
//
// GTM note: the Google Ads Enhanced Conversions / GA4 user-provided-data
// tag should be configured to accept the ALREADY-HASHED fields below.
// Field names follow Google's documented dataLayer convention.
// =============================================================

export type RawUserData = {
  email?: string | null;
  phone_number?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

export type HashedUserData = {
  sha256_email_address?: string;
  sha256_phone_number?: string;
  sha256_first_name?: string;
  sha256_last_name?: string;
};

const EC_KEY = "scss:ec_user_data";

function trimAll(value?: string | null): string {
  return (value ?? "").trim();
}

function normalizeEmail(value?: string | null): string {
  return trimAll(value).toLowerCase();
}

function normalizePhone(value?: string | null): string {
  // Keep digits and a leading "+", drop spaces, dashes, parentheses, dots.
  return trimAll(value).replace(/[\s()\-.]/g, "");
}

function normalizeName(value?: string | null): string {
  return trimAll(value).toLowerCase();
}

/** Stash normalized (un-hashed) user data for the success page to hash. */
export function stashUserData(data: RawUserData): void {
  if (typeof window === "undefined") return;
  const clean = {
    email: normalizeEmail(data.email),
    phone_number: normalizePhone(data.phone_number),
    first_name: normalizeName(data.first_name),
    last_name: normalizeName(data.last_name),
  };
  try {
    window.sessionStorage.setItem(EC_KEY, JSON.stringify(clean));
  } catch {
    /* storage blocked — Enhanced Conversions simply won't be populated */
  }
}

async function sha256Hex(value: string): Promise<string> {
  if (!value) return "";
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Reads + clears the stashed user data and returns SHA-256 hashes.
 * Returns undefined when there is nothing to send or Web Crypto is
 * unavailable (e.g. non-secure context).
 */
export async function popHashedUserData(): Promise<HashedUserData | undefined> {
  if (typeof window === "undefined") return undefined;

  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(EC_KEY);
    window.sessionStorage.removeItem(EC_KEY);
  } catch {
    return undefined;
  }
  if (!raw) return undefined;
  if (typeof crypto === "undefined" || !crypto.subtle) return undefined;

  let parsed: RawUserData;
  try {
    parsed = JSON.parse(raw) as RawUserData;
  } catch {
    return undefined;
  }

  const [email, phone, firstName, lastName] = await Promise.all([
    sha256Hex(parsed.email ?? ""),
    sha256Hex(parsed.phone_number ?? ""),
    sha256Hex(parsed.first_name ?? ""),
    sha256Hex(parsed.last_name ?? ""),
  ]);

  const out: HashedUserData = {};
  if (email) out.sha256_email_address = email;
  if (phone) out.sha256_phone_number = phone;
  if (firstName) out.sha256_first_name = firstName;
  if (lastName) out.sha256_last_name = lastName;

  return Object.keys(out).length ? out : undefined;
}
