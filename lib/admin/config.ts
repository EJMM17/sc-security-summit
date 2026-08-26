import "server-only";

/**
 * The operations panel is opt-in. Without both secrets configured every
 * `/admin` route answers 404, so a deployment that never received the
 * credentials — every visual-only Preview, for instance — exposes no panel at
 * all instead of exposing an unprotected one.
 */
const MIN_SECRET_LENGTH = 16;

function readSecret(name: string): string | null {
  const value = process.env[name];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < MIN_SECRET_LENGTH || /\s/.test(trimmed)) return null;
  return trimmed;
}

export function adminPassword(): string | null {
  return readSecret("ADMIN_PASSWORD");
}

export function adminSessionSecret(): string | null {
  return readSecret("ADMIN_SESSION_SECRET");
}

export function isAdminPanelConfigured(): boolean {
  return adminPassword() !== null && adminSessionSecret() !== null;
}

/**
 * Optional second lock in front of the panel: an unguessable access key that
 * has to arrive once through `/admin/acceso?k=...` before any `/admin` URL
 * answers with anything but 404. It is a link, not a credential — the password
 * is still required afterwards — so it only has to be long enough that nobody
 * reaches the panel by typing a URL or following a stray reference.
 */
const MIN_ACCESS_KEY_LENGTH = 32;

export function adminAccessKey(): string | null {
  const value = process.env.ADMIN_ACCESS_KEY;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < MIN_ACCESS_KEY_LENGTH || /\s/.test(trimmed)) return null;
  return trimmed;
}

/**
 * The gate is opt-in: a deployment that never set the key keeps the previous
 * behaviour (configured panel, password login), so enabling it is a decision
 * and never an accidental lockout.
 */
export function isAdminLinkGateEnabled(): boolean {
  return adminAccessKey() !== null;
}
