export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[turnstile] TURNSTILE_SECRET_KEY is required in production");
    }
    console.warn("[turnstile] TURNSTILE_SECRET_KEY no configurada, validación deshabilitada en dev");
    return true;
  }

  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  body.append("remoteip", ip);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body }
    );
    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error("[turnstile] verification error", err);
    return false; // fail-closed en producción
  }
}
