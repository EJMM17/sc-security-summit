import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface ConfirmationEmailData {
  to: string;
  nombre: string;
  folio: string;
  tipoAcceso: "estudiante" | "general" | "vip";
  monto: number;
  requiereCfdi: boolean;
}

const TIPO_LABELS = {
  estudiante: "Acceso Estudiante",
  general: "Acceso General",
  vip: "Acceso VIP",
} as const;

export async function sendConfirmationEmail(data: ConfirmationEmailData) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY no configurada, skip envío");
    return { ok: false, reason: "no_api_key" };
  }

  const html = confirmationTemplate(data);

  try {
    const { error } = await resend.emails.send({
      from: "SC Security Summit <no-reply@scsecuritysummit.com>",
      to: data.to,
      replyTo: "Contacto@LanzLogistics.com",
      subject: `Registro confirmado — Folio ${data.folio}`,
      html,
    });

    if (error) {
      console.error("[email] Resend error", error);
      return { ok: false, reason: "send_failed" };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] unexpected error", err);
    return { ok: false, reason: "exception" };
  }
}

function confirmationTemplate(d: ConfirmationEmailData): string {
  const tipoLabel = TIPO_LABELS[d.tipoAcceso];
  const cfdiBlock = d.requiereCfdi
    ? `<p style="margin:12px 0;color:#475569;">Registraste solicitud de <strong>CFDI</strong>. Recibirás tu factura dentro de 72 hrs después de confirmar pago.</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Registro Confirmado</title></head>
<body style="margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#f8faff;color:#0f172a;">
  <div style="max-width:600px;margin:0 auto;background:#fff;">
    <div style="background:linear-gradient(135deg,#1E3A8A 0%,#2563EB 100%);padding:40px 32px;color:#fff;text-align:center;">
      <h1 style="margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">SC SECURITY SUMMIT 2026</h1>
      <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">24 y 25 de Septiembre · Reynosa, Tamaulipas</p>
    </div>
    <div style="padding:40px 32px;">
      <h2 style="margin:0 0 16px;font-size:20px;">Hola ${d.nombre},</h2>
      <p style="margin:0 0 20px;color:#475569;line-height:1.6;">Tu registro fue recibido correctamente. Abajo encontrarás tu folio de confirmación y los próximos pasos.</p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
        <p style="margin:0 0 8px;font-size:12px;color:#2563EB;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;">Tu folio</p>
        <p style="margin:0;font-size:26px;font-weight:700;color:#1E3A8A;letter-spacing:0.05em;">${d.folio}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr><td style="padding:8px 0;color:#64748b;">Tipo de acceso</td><td style="padding:8px 0;text-align:right;font-weight:600;">${tipoLabel}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Monto</td><td style="padding:8px 0;text-align:right;font-weight:600;">$${d.monto.toLocaleString("es-MX")} MXN + IVA</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Estado de pago</td><td style="padding:8px 0;text-align:right;"><span style="background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;">PENDIENTE</span></td></tr>
      </table>
      ${cfdiBlock}
      <h3 style="margin:28px 0 12px;font-size:16px;">Próximos pasos</h3>
      <ol style="margin:0 0 20px 20px;padding:0;color:#475569;line-height:1.8;">
        <li>Un representante de Lanz Logistics te contactará en las próximas <strong>24–48 hrs hábiles</strong> con instrucciones de pago.</li>
        <li>Tu lugar queda reservado al confirmar el pago (transferencia SPEI, depósito o tarjeta).</li>
        <li>Recibirás tu pase digital y coordenadas del evento.</li>
      </ol>
      <div style="background:#f8faff;border-left:4px solid #2563EB;padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0;color:#475569;font-size:14px;">¿Tienes preguntas? Escríbenos a <a href="mailto:Contacto@LanzLogistics.com" style="color:#2563EB;text-decoration:none;font-weight:600;">Contacto@LanzLogistics.com</a> o al <a href="tel:+19565158070" style="color:#2563EB;text-decoration:none;font-weight:600;">+1 (956) 515-8070</a>.</p>
      </div>
    </div>
    <div style="background:#0f172a;color:#94a3b8;padding:24px 32px;text-align:center;font-size:12px;">
      <p style="margin:0 0 8px;">Organizado por <strong style="color:#fff;">Lanz Logistics</strong> + <strong style="color:#fff;">Thynk Unlimited</strong></p>
      <p style="margin:0;">Centro de Convenciones de Reynosa · Blvd. Morelos 190, Col. Longoria</p>
    </div>
  </div>
</body>
</html>`;
}
