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
