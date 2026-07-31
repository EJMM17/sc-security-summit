// =============================================================
// Sentry data minimization
// =============================================================
// `scrubValue` remains useful for local, bounded structures. Sentry events,
// however, are handled by the stricter `sanitizeSentryEvent`: it builds a new
// allowlisted error event and never forwards arbitrary request, user, context,
// breadcrumb, message, tag or stack-variable data.
// =============================================================

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// Mexican RFC: 3-4 alpha (org or natural person), 6 digits (DOB), 3 alphanum (homoclave).
const RFC_RE = /\b[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}\b/g;
// Phone numbers — international, with optional + and 7-15 digits with separators.
const PHONE_RE = /(?:\+?\d[\s\-().]?){7,15}/g;
// Common credit-card patterns (PAN). Not perfect Luhn but enough as a heuristic.
const CARD_RE = /\b(?:\d[ -]?){13,19}\b/g;

const PII_FIELDS = new Set([
  "email",
  "rfc",
  "telefono",
  "phone",
  "razon_social",
  "codigo_postal_fiscal",
  "ip",
  "ip_registro",
  "user_agent",
  "password",
  "authorization",
  "cookie",
  "set-cookie",
  "x-forwarded-for",
]);

export function scrubString(value: string): string {
  return value
    .replace(EMAIL_RE, "[REDACTED:email]")
    .replace(RFC_RE, "[REDACTED:rfc]")
    .replace(CARD_RE, "[REDACTED:card]")
    .replace(PHONE_RE, "[REDACTED:phone]");
}

export function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[TRUNCATED:depth]";
  if (typeof value === "string") return scrubString(value);
  if (Array.isArray(value)) return value.map((v) => scrubValue(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (PII_FIELDS.has(k.toLowerCase())) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = scrubValue(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}

type UnknownRecord = Record<string, unknown>;

const SAFE_LEVELS = new Set(["fatal", "error", "warning"]);
const SAFE_PLATFORMS = new Set(["javascript", "node"]);
const SAFE_TAGS = new Set(["router_kind", "route_type"]);
const TECHNICAL_IDENTIFIER_RE = /^[A-Za-z0-9_$@./:[\]<>-]{1,160}$/;
const EVENT_ID_RE = /^[a-f0-9]{16,64}$/i;
const RELEASE_RE = /^[a-f0-9]{7,64}$/i;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeTechnicalIdentifier(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return TECHNICAL_IDENTIFIER_RE.test(value) ? value : undefined;
}

function safeInteger(value: unknown): number | undefined {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
    ? value
    : undefined;
}

function safeCodeLocation(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;

  let pathname = value.split(/[?#]/, 1)[0].replaceAll("\\", "/");
  try {
    const url = new URL(value);
    pathname = url.pathname;
  } catch {
    // Bundler paths are not necessarily URLs.
  }
  pathname = pathname.replaceAll("\\", "/");

  const compact = pathname
    .split("/")
    .filter(Boolean)
    .slice(-4)
    .join("/");
  return safeTechnicalIdentifier(compact);
}

function sanitizeFrame(value: unknown): UnknownRecord | null {
  if (!isRecord(value)) return null;

  const frame: UnknownRecord = {};
  const filename = safeCodeLocation(value.filename);
  const functionName = safeTechnicalIdentifier(value.function);
  const moduleName = safeTechnicalIdentifier(value.module);
  const lineno = safeInteger(value.lineno);
  const colno = safeInteger(value.colno);

  if (filename) frame.filename = filename;
  if (functionName) frame.function = functionName;
  if (moduleName) frame.module = moduleName;
  if (lineno !== undefined) frame.lineno = lineno;
  if (colno !== undefined) frame.colno = colno;
  if (typeof value.in_app === "boolean") frame.in_app = value.in_app;

  return Object.keys(frame).length > 0 ? frame : null;
}

function sanitizeException(value: unknown): UnknownRecord | null {
  if (!isRecord(value)) return null;

  const exception: UnknownRecord = {
    value: "[REDACTED:error-message]",
  };
  const type = safeTechnicalIdentifier(value.type);
  if (type) exception.type = type;

  if (isRecord(value.stacktrace) && Array.isArray(value.stacktrace.frames)) {
    const frames = value.stacktrace.frames
      .map(sanitizeFrame)
      .filter((frame): frame is UnknownRecord => frame !== null)
      .slice(-100);
    if (frames.length > 0) exception.stacktrace = { frames };
  }

  if (isRecord(value.mechanism)) {
    const mechanism: UnknownRecord = {};
    const mechanismType = safeTechnicalIdentifier(value.mechanism.type);
    if (mechanismType) mechanism.type = mechanismType;
    if (typeof value.mechanism.handled === "boolean") {
      mechanism.handled = value.mechanism.handled;
    }
    if (Object.keys(mechanism).length > 0) exception.mechanism = mechanism;
  }

  return type || exception.stacktrace ? exception : null;
}

/**
 * Rebuilds a Sentry event from a narrow technical allowlist.
 *
 * Free-form error messages, request URLs and headers, user data, breadcrumbs,
 * contexts, extras, fingerprint values, source context and local variables are
 * deliberately omitted. Message-only events are dropped: Sentry is configured
 * for errors, not logs or product analytics.
 */
export function sanitizeSentryEvent<T>(event: T): T | null {
  if (!isRecord(event)) return null;

  const values =
    isRecord(event.exception) && Array.isArray(event.exception.values)
      ? event.exception.values
          .map(sanitizeException)
          .filter((value): value is UnknownRecord => value !== null)
          .slice(0, 10)
      : [];
  if (values.length === 0) return null;

  const sanitized: UnknownRecord = {
    exception: { values },
  };

  if (typeof event.event_id === "string" && EVENT_ID_RE.test(event.event_id)) {
    sanitized.event_id = event.event_id;
  }
  if (typeof event.timestamp === "number" && Number.isFinite(event.timestamp)) {
    sanitized.timestamp = event.timestamp;
  }
  if (typeof event.platform === "string" && SAFE_PLATFORMS.has(event.platform)) {
    sanitized.platform = event.platform;
  }
  if (typeof event.level === "string" && SAFE_LEVELS.has(event.level)) {
    sanitized.level = event.level;
  }
  if (event.environment === "production") {
    sanitized.environment = "production";
  }
  if (typeof event.release === "string" && RELEASE_RE.test(event.release)) {
    sanitized.release = event.release;
  }

  if (isRecord(event.tags)) {
    const tags: Record<string, string> = {};
    for (const key of SAFE_TAGS) {
      const value = safeTechnicalIdentifier(event.tags[key]);
      if (value) tags[key] = value;
    }
    if (Object.keys(tags).length > 0) sanitized.tags = tags;
  }

  return sanitized as T;
}
