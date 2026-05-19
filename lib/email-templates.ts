const BRAND_COLOR = "#0f172a";
const ACCENT_COLOR = "#3b82f6";

function base(title: string, body: string): string {
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
    <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Reynosa, México · 24–25 Septiembre 2026</p>
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

const TIER_LABEL: Record<string, string> = {
  estudiante: "Estudiante",
  general: "General",
  vip: "VIP",
};

function mxn(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function confirmationEmailHtml(params: {
  nombre: string;
  folio: string;
  tipo_acceso: string;
  monto_mxn: number;
  language: "es" | "en";
}): string {
  const { nombre, folio, tipo_acceso, monto_mxn, language } = params;
  const tier = TIER_LABEL[tipo_acceso] ?? tipo_acceso;

  if (language === "en") {
    const body = `
      <p style="margin:0 0 16px;color:#1e293b;font-size:16px;font-weight:600;">Your registration is confirmed!</p>
      <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">Hi <strong>${nombre}</strong>, thank you for registering for SC Security Summit 2026. Your confirmation folio is:</p>
      <div style="background:#f8fafc;border:2px dashed #cbd5e1;border-radius:8px;padding:20px;text-align:center;margin:0 0 24px;">
        <p style="margin:0 0 4px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Confirmation Folio</p>
        <p style="margin:0;color:#0f172a;font-size:22px;font-weight:700;font-family:monospace;letter-spacing:1px;">${folio}</p>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#f8fafc;border-radius:6px;overflow:hidden;">
        <tr style="background:#e2e8f0;">
          <td style="padding:8px 12px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Detail</td>
          <td style="padding:8px 12px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Value</td>
        </tr>
        <tr><td style="padding:10px 12px;font-size:13px;color:#475569;border-top:1px solid #e2e8f0;">Event</td><td style="padding:10px 12px;font-size:13px;color:#1e293b;font-weight:500;border-top:1px solid #e2e8f0;">SC Security Summit 2026</td></tr>
        <tr><td style="padding:10px 12px;font-size:13px;color:#475569;border-top:1px solid #e2e8f0;">Date</td><td style="padding:10px 12px;font-size:13px;color:#1e293b;font-weight:500;border-top:1px solid #e2e8f0;">September 24–25, 2026</td></tr>
        <tr><td style="padding:10px 12px;font-size:13px;color:#475569;border-top:1px solid #e2e8f0;">Access Tier</td><td style="padding:10px 12px;font-size:13px;color:#1e293b;font-weight:500;border-top:1px solid #e2e8f0;">${tier}</td></tr>
        <tr><td style="padding:10px 12px;font-size:13px;color:#475569;border-top:1px solid #e2e8f0;">Amount</td><td style="padding:10px 12px;font-size:13px;color:#1e293b;font-weight:500;border-top:1px solid #e2e8f0;">${mxn(monto_mxn)} MXN</td></tr>
      </table>
      <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">Payment is via manual bank transfer. Once your payment is confirmed, you'll receive a follow-up email. Keep this folio for your records.</p>`;
    return base("Registration Confirmed — SC Security Summit 2026", body);
  }

  const body = `
    <p style="margin:0 0 16px;color:#1e293b;font-size:16px;font-weight:600;">¡Tu registro ha sido confirmado!</p>
    <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">Hola <strong>${nombre}</strong>, gracias por registrarte al SC Security Summit 2026. Tu folio de confirmación es:</p>
    <div style="background:#f8fafc;border:2px dashed #cbd5e1;border-radius:8px;padding:20px;text-align:center;margin:0 0 24px;">
      <p style="margin:0 0 4px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Folio de Confirmación</p>
      <p style="margin:0;color:#0f172a;font-size:22px;font-weight:700;font-family:monospace;letter-spacing:1px;">${folio}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#f8fafc;border-radius:6px;overflow:hidden;">
      <tr style="background:#e2e8f0;">
        <td style="padding:8px 12px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Detalle</td>
        <td style="padding:8px 12px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Valor</td>
      </tr>
      <tr><td style="padding:10px 12px;font-size:13px;color:#475569;border-top:1px solid #e2e8f0;">Evento</td><td style="padding:10px 12px;font-size:13px;color:#1e293b;font-weight:500;border-top:1px solid #e2e8f0;">SC Security Summit 2026</td></tr>
      <tr><td style="padding:10px 12px;font-size:13px;color:#475569;border-top:1px solid #e2e8f0;">Fecha</td><td style="padding:10px 12px;font-size:13px;color:#1e293b;font-weight:500;border-top:1px solid #e2e8f0;">24–25 de Septiembre, 2026</td></tr>
      <tr><td style="padding:10px 12px;font-size:13px;color:#475569;border-top:1px solid #e2e8f0;">Tipo de Acceso</td><td style="padding:10px 12px;font-size:13px;color:#1e293b;font-weight:500;border-top:1px solid #e2e8f0;">${tier}</td></tr>
      <tr><td style="padding:10px 12px;font-size:13px;color:#475569;border-top:1px solid #e2e8f0;">Monto</td><td style="padding:10px 12px;font-size:13px;color:#1e293b;font-weight:500;border-top:1px solid #e2e8f0;">${mxn(monto_mxn)} MXN</td></tr>
    </table>
    <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">El pago es mediante transferencia bancaria manual. Una vez confirmado tu pago recibirás un correo de seguimiento. Guarda este folio para tus registros.</p>`;
  return base("Registro Confirmado — SC Security Summit 2026", body);
}

export function confirmationEmailSubject(language: "es" | "en", folio: string): string {
  return language === "en"
    ? `Registration Confirmed — ${folio} · SC Security Summit 2026`
    : `Registro Confirmado — ${folio} · SC Security Summit 2026`;
}
