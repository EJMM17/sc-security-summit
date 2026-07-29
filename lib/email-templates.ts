const BRAND_COLOR = "#0f172a";
const ACCENT_COLOR = "#3b82f6";

/**
 * Escape user-controlled text before interpolating it into email HTML.
 * Prevents HTML/attribute injection via fields like `nombre`.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Branded email shell. Wraps a body fragment in the summit's header/footer
 * chrome so every transactional email looks the same.
 */
export function emailShell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;max-width:560px;width:100%;">
  <tr><td style="background:${BRAND_COLOR};padding:24px 32px;">
    <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">SC Security Summit 2026</p>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Reynosa, México · 24 de Septiembre 2026</p>
  </td></tr>
  <tr><td style="padding:32px;">${body}</td></tr>
  <tr><td style="background:#f1f5f9;padding:16px 32px;border-top:1px solid #e2e8f0;">
    <p style="margin:0;color:#64748b;font-size:11px;text-align:center;">
      SC Security Summit 2026 · Reynosa, Tamaulipas, México<br/>
      ¿Preguntas? Escríbenos a <a href="mailto:hola@scsecuritysummit.com" style="color:${ACCENT_COLOR};">hola@scsecuritysummit.com</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
