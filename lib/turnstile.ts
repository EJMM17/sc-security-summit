import "server-only";

let _warned = false;
function warnDisabledOnce() {
  if (_warned) return;
  _warned = true;
  console.warn(
    "[turnstile] TURNSTILE_SECRET_KEY no configurado — verificación bot omitida (honeypot + rate limit siguen activos)",
  );
}

function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    process.env.VERCEL_ENV === "production"
  );
}

export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  // Read directly from process.env at call-time. The previous implementation
  // depended on the `features.turnstile` singleton in env.ts, which is
  // evaluated once at module load. If the secret was empty after trim() at
  // that moment (or the module was warmed before env injection), the gate
  // would silently fall through to the warn-path even on Vercel.
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim() ?? "";
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  const enabled = secret.length > 0 && siteKey.length > 0;

  if (!enabled) {
    if (isProductionRuntime()) {
      throw new Error(
        "[turnstile] TURNSTILE_SECRET_KEY y NEXT_PUBLIC_TURNSTILE_SITE_KEY son requeridos en producción — configurar en variables de entorno",
      );
    }
    warnDisabledOnce();
    return true;
  }

  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  body.append("remoteip", ip);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });

    if (!res.ok) {
      throw new Error(`Turnstile verification HTTP ${res.status}`);
    }

    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error("[turnstile] verification error", err);
    return false;
  }
}
