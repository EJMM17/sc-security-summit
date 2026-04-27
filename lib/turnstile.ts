import "server-only";

import { env, features } from "@/env";

let _warned = false;
function warnDisabledOnce() {
  if (_warned) return;
  _warned = true;
  console.warn(
    "[turnstile] TURNSTILE_SECRET_KEY no configurado — verificación bot omitida (honeypot + rate limit siguen activos)",
  );
}

export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!features.turnstile) {
    warnDisabledOnce();
    // Fail-open: con honeypot + rate-limit todavía activos, dejamos pasar
    // en vez de bloquear el formulario por completo. Cuando se configure
    // la clave esto vuelve a ser fail-closed automáticamente.
    return true;
  }

  const body = new FormData();
  body.append("secret", env.TURNSTILE_SECRET_KEY!);
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
