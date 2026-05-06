// =============================================================
// Bilingual transactional email templates
// =============================================================
// Pure functions: take data, return { subject, html, text }.
// Send-side concerns (Resend client, retries) live in lib/email.ts.
// Copy here intentionally diverges from lib/site-content.ts because
// emails need plain-text fallbacks and shorter punchier wording.
// =============================================================

import { EVENT, ORGANIZERS } from "./site-content";
import type { RegistroInput } from "./schemas";

export type EmailLanguage = "es" | "en";

export type RegistrationEmailData = {
  folio: string;
  nombre: string;
  tipoAcceso: RegistroInput["tipo_acceso"];
  montoMxn: number;
  language: EmailLanguage;
};

export type OrganizerEmailData = {
  folio: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  empresa: string;
  cargo: string;
  tipoAcceso: RegistroInput["tipo_acceso"];
  montoMxn: number;
  requiereCfdi: boolean;
  rfc: string | null;
  ipRegistro: string | null;
};

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

// ─── Tier labels per language ────────────────────────────────────────────────
const TIER_LABEL: Record<RegistroInput["tipo_acceso"], Record<EmailLanguage, string>> = {
  estudiante: { es: "Estudiante", en: "Student" },
  general: { es: "General", en: "General" },
  vip: { es: "VIP", en: "VIP" },
};

const formatMxn = (n: number): string =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(n);

// ─── Shared HTML shell ───────────────────────────────────────────────────────
// Table-based layout for max email-client compat (Outlook, Gmail, iCloud).
function htmlShell(opts: { previewText: string; bodyHtml: string }): string {
  return `<!doctype html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${EVENT.title}</title>
</head>
<body style="margin:0;padding:0;background:#0b0d12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e6e8ee;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;visibility:hidden;opacity:0;color:transparent;height:0;width:0;">${opts.previewText}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0b0d12;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#11141b;border:1px solid #1f2430;border-radius:12px;overflow:hidden;">
<tr><td style="padding:28px 32px;border-bottom:1px solid #1f2430;">
<div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#9aa3b2;margin-bottom:6px;">SC Security Summit · ${EVENT.year}</div>
<div style="font-size:18px;font-weight:600;color:#ffffff;line-height:1.3;">${EVENT.title}</div>
</td></tr>
<tr><td style="padding:32px;">${opts.bodyHtml}</td></tr>
<tr><td style="padding:20px 32px;background:#0d1017;border-top:1px solid #1f2430;font-size:12px;color:#7a8294;line-height:1.6;">
<div style="margin-bottom:6px;">${EVENT.dates} · ${EVENT.venue} · ${EVENT.venueCity}</div>
<div>Lanz Logistics · <a href="mailto:${EVENT.contact}" style="color:#9aa3b2;text-decoration:underline;">${EVENT.contact}</a> · <a href="https://${EVENT.website}" style="color:#9aa3b2;text-decoration:underline;">${EVENT.website}</a></div>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// =============================================================
// 1. Registration confirmation (sent to attendee)
// =============================================================
export function buildRegistrationConfirmation(
  data: RegistrationEmailData
): RenderedEmail {
  const tier = TIER_LABEL[data.tipoAcceso][data.language];
  const monto = formatMxn(data.montoMxn);

  if (data.language === "en") {
    const subject = `Registration confirmed · Folio ${data.folio}`;
    const greeting = `Hi ${data.nombre},`;
    const intro = `Your registration for the ${EVENT.title} is confirmed. Below is your folio number — keep it for the day of the event.`;
    const folioLabel = "Your folio";
    const tierLabel = "Access tier";
    const amountLabel = "Amount due";
    const eventLabel = "Event";
    const venueLabel = "Venue";
    const datesLabel = "Dates";
    const paymentTitle = "Next step: payment";
    const paymentBody = `In the next 5 minutes you will receive a separate email with the secure payment link (Conekta — credit/debit card or OXXO). If you don't see it within 30 minutes, check spam or reply to this email.`;
    const checkinTitle = "Day of the event";
    const checkinBody = `On Sept 24 bring your ID and the QR code we'll send you the week of the event. Doors open at ${EVENT.schedule}. ${EVENT.venueDetail}.`;
    const closing = `Questions? Just reply to this email. We read every one.`;
    const sign = `— ${ORGANIZERS.presented_by.join(" & ")}`;

    const text = [
      greeting,
      "",
      intro,
      "",
      `${folioLabel}: ${data.folio}`,
      `${tierLabel}: ${tier}`,
      `${amountLabel}: ${monto}`,
      "",
      `${eventLabel}: ${EVENT.title}`,
      `${datesLabel}: ${EVENT.dates}`,
      `${venueLabel}: ${EVENT.venue}, ${EVENT.venueCity}`,
      "",
      `${paymentTitle}`,
      paymentBody,
      "",
      `${checkinTitle}`,
      checkinBody,
      "",
      closing,
      sign,
    ].join("\n");

    const bodyHtml = `
<div style="font-size:15px;line-height:1.6;color:#e6e8ee;">
  <p style="margin:0 0 14px;">${greeting}</p>
  <p style="margin:0 0 22px;color:#c5cad4;">${intro}</p>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0d1017;border:1px solid #1f2430;border-radius:8px;margin-bottom:24px;">
    <tr><td style="padding:18px 20px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9aa3b2;margin-bottom:4px;">${folioLabel}</div>
      <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:18px;font-weight:600;color:#ffffff;letter-spacing:0.04em;">${data.folio}</div>
    </td></tr>
    <tr><td style="padding:0 20px 18px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding-top:10px;border-top:1px solid #1f2430;font-size:13px;color:#9aa3b2;">${tierLabel}</td>
          <td style="padding-top:10px;border-top:1px solid #1f2430;font-size:13px;color:#ffffff;text-align:right;">${tier}</td>
        </tr>
        <tr>
          <td style="padding-top:8px;font-size:13px;color:#9aa3b2;">${amountLabel}</td>
          <td style="padding-top:8px;font-size:13px;color:#ffffff;text-align:right;font-weight:600;">${monto}</td>
        </tr>
      </table>
    </td></tr>
  </table>
  <h3 style="margin:0 0 8px;font-size:14px;color:#ffffff;text-transform:uppercase;letter-spacing:0.08em;">${paymentTitle}</h3>
  <p style="margin:0 0 24px;color:#c5cad4;font-size:14px;">${paymentBody}</p>
  <h3 style="margin:0 0 8px;font-size:14px;color:#ffffff;text-transform:uppercase;letter-spacing:0.08em;">${checkinTitle}</h3>
  <p style="margin:0 0 24px;color:#c5cad4;font-size:14px;">${checkinBody}</p>
  <p style="margin:0 0 4px;color:#c5cad4;font-size:14px;">${closing}</p>
  <p style="margin:0;color:#9aa3b2;font-size:13px;">${sign}</p>
</div>`;

    return {
      subject,
      html: htmlShell({ previewText: `Folio ${data.folio} · ${tier} · ${monto}`, bodyHtml }),
      text,
    };
  }

  // ─── Spanish (default) ──────────────────────────────────────────────────────
  const subject = `Registro confirmado · Folio ${data.folio}`;
  const greeting = `Hola ${data.nombre},`;
  const intro = `Tu registro para el ${EVENT.title} está confirmado. Abajo encontrarás tu folio — guárdalo para el día del evento.`;
  const folioLabel = "Tu folio";
  const tierLabel = "Tipo de acceso";
  const amountLabel = "Monto a pagar";
  const datesLabel = "Fechas";
  const venueLabel = "Sede";
  const eventLabel = "Evento";
  const paymentTitle = "Siguiente paso: pago";
  const paymentBody = `En los próximos minutos recibirás un correo separado con el link de pago seguro (Conekta — tarjeta crédito/débito u OXXO). Si no llega en 30 minutos, revisa spam o responde este correo.`;
  const checkinTitle = "El día del evento";
  const checkinBody = `El 24 de septiembre trae una identificación oficial y el código QR que enviaremos la semana del evento. Apertura ${EVENT.schedule}. ${EVENT.venueDetail}.`;
  const closing = `¿Dudas? Responde este correo. Leemos cada uno.`;
  const sign = `— ${ORGANIZERS.presented_by.join(" & ")}`;

  const text = [
    greeting,
    "",
    intro,
    "",
    `${folioLabel}: ${data.folio}`,
    `${tierLabel}: ${tier}`,
    `${amountLabel}: ${monto}`,
    "",
    `${eventLabel}: ${EVENT.title}`,
    `${datesLabel}: ${EVENT.dates}`,
    `${venueLabel}: ${EVENT.venue}, ${EVENT.venueCity}`,
    "",
    `${paymentTitle}`,
    paymentBody,
    "",
    `${checkinTitle}`,
    checkinBody,
    "",
    closing,
    sign,
  ].join("\n");

  const bodyHtml = `
<div style="font-size:15px;line-height:1.6;color:#e6e8ee;">
  <p style="margin:0 0 14px;">${greeting}</p>
  <p style="margin:0 0 22px;color:#c5cad4;">${intro}</p>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0d1017;border:1px solid #1f2430;border-radius:8px;margin-bottom:24px;">
    <tr><td style="padding:18px 20px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9aa3b2;margin-bottom:4px;">${folioLabel}</div>
      <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:18px;font-weight:600;color:#ffffff;letter-spacing:0.04em;">${data.folio}</div>
    </td></tr>
    <tr><td style="padding:0 20px 18px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding-top:10px;border-top:1px solid #1f2430;font-size:13px;color:#9aa3b2;">${tierLabel}</td>
          <td style="padding-top:10px;border-top:1px solid #1f2430;font-size:13px;color:#ffffff;text-align:right;">${tier}</td>
        </tr>
        <tr>
          <td style="padding-top:8px;font-size:13px;color:#9aa3b2;">${amountLabel}</td>
          <td style="padding-top:8px;font-size:13px;color:#ffffff;text-align:right;font-weight:600;">${monto}</td>
        </tr>
      </table>
    </td></tr>
  </table>
  <h3 style="margin:0 0 8px;font-size:14px;color:#ffffff;text-transform:uppercase;letter-spacing:0.08em;">${paymentTitle}</h3>
  <p style="margin:0 0 24px;color:#c5cad4;font-size:14px;">${paymentBody}</p>
  <h3 style="margin:0 0 8px;font-size:14px;color:#ffffff;text-transform:uppercase;letter-spacing:0.08em;">${checkinTitle}</h3>
  <p style="margin:0 0 24px;color:#c5cad4;font-size:14px;">${checkinBody}</p>
  <p style="margin:0 0 4px;color:#c5cad4;font-size:14px;">${closing}</p>
  <p style="margin:0;color:#9aa3b2;font-size:13px;">${sign}</p>
</div>`;

  return {
    subject,
    html: htmlShell({ previewText: `Folio ${data.folio} · ${tier} · ${monto}`, bodyHtml }),
    text,
  };
}

// =============================================================
// 2. Organizer notification (sent to CONTACT_EMAIL on every registration)
// =============================================================
// Always Spanish — the organizer team operates in ES.
export function buildOrganizerNotification(
  data: OrganizerEmailData
): RenderedEmail {
  const tier = TIER_LABEL[data.tipoAcceso].es;
  const monto = formatMxn(data.montoMxn);

  const subject = `[REGISTRO] ${data.nombre} ${data.apellido} · ${tier} · ${monto}`;

  const cfdiLine = data.requiereCfdi
    ? `\nFactura CFDI: SÍ (RFC ${data.rfc ?? "—"})`
    : "\nFactura CFDI: no";

  const text = [
    `Nuevo registro recibido — folio ${data.folio}`,
    "",
    `Nombre:    ${data.nombre} ${data.apellido}`,
    `Email:     ${data.email}`,
    `Teléfono:  ${data.telefono ?? "—"}`,
    `Empresa:   ${data.empresa}`,
    `Cargo:     ${data.cargo}`,
    `Tier:      ${tier}`,
    `Monto:     ${monto}`,
    `Estado:    pendiente de pago`,
    cfdiLine.trimStart(),
    "",
    `IP: ${data.ipRegistro ?? "unknown"}`,
  ].join("\n");

  const bodyHtml = `
<div style="font-size:14px;line-height:1.6;color:#e6e8ee;">
  <p style="margin:0 0 18px;color:#c5cad4;">Nuevo registro recibido. Folio <strong style="color:#fff;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">${data.folio}</strong>.</p>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #1f2430;border-radius:8px;background:#0d1017;">
    ${row("Nombre", `${data.nombre} ${data.apellido}`)}
    ${row("Email", `<a href="mailto:${data.email}" style="color:#9aa3b2;">${data.email}</a>`)}
    ${row("Teléfono", data.telefono ?? "—")}
    ${row("Empresa", data.empresa)}
    ${row("Cargo", data.cargo)}
    ${row("Tier", tier)}
    ${row("Monto", monto)}
    ${row("Estado", "pendiente de pago")}
    ${row("CFDI", data.requiereCfdi ? `Sí · RFC ${data.rfc ?? "—"}` : "No")}
    ${row("IP origen", data.ipRegistro ?? "unknown")}
  </table>
</div>`;

  return {
    subject,
    html: htmlShell({
      previewText: `Folio ${data.folio} · ${tier} · ${monto} · ${data.empresa}`,
      bodyHtml,
    }),
    text,
  };
}

// =============================================================
// 3. Payment confirmation (sent to attendee after Conekta webhook)
// =============================================================
export type PaymentConfirmationData = RegistrationEmailData;

export function buildPaymentConfirmation(
  data: PaymentConfirmationData,
): RenderedEmail {
  const tier = TIER_LABEL[data.tipoAcceso][data.language];
  const monto = formatMxn(data.montoMxn);

  if (data.language === "en") {
    const subject = `Payment received · Folio ${data.folio}`;
    const greeting = `Hi ${data.nombre},`;
    const intro = `Your payment is confirmed. You're all set for the ${EVENT.title}.`;
    const paidLabel = "Status";
    const paidValue = "PAID";
    const folioLabel = "Your folio";
    const tierLabel = "Access tier";
    const amountLabel = "Amount";
    const checkinTitle = "Day of the event";
    const checkinBody = `On Sept 24 bring your ID and the QR code we'll send you the week of the event. Doors open at ${EVENT.schedule}. ${EVENT.venueDetail}.`;
    const sign = `— ${ORGANIZERS.presented_by.join(" & ")}`;

    const text = [
      greeting,
      "",
      intro,
      "",
      `${paidLabel}: ${paidValue}`,
      `${folioLabel}: ${data.folio}`,
      `${tierLabel}: ${tier}`,
      `${amountLabel}: ${monto}`,
      "",
      checkinTitle,
      checkinBody,
      "",
      sign,
    ].join("\n");

    const bodyHtml = `
<div style="font-size:15px;line-height:1.6;color:#e6e8ee;">
  <p style="margin:0 0 14px;">${greeting}</p>
  <p style="margin:0 0 22px;color:#c5cad4;">${intro}</p>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0d1017;border:1px solid #22c55e;border-radius:8px;margin-bottom:24px;">
    <tr><td style="padding:18px 20px;">
      <div style="display:inline-block;padding:4px 10px;border-radius:999px;background:#14532d;color:#86efac;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;">${paidValue}</div>
      <div style="margin-top:12px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:18px;font-weight:600;color:#ffffff;letter-spacing:0.04em;">${data.folio}</div>
    </td></tr>
    <tr><td style="padding:0 20px 18px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td style="padding-top:10px;border-top:1px solid #1f2430;font-size:13px;color:#9aa3b2;">${tierLabel}</td>
            <td style="padding-top:10px;border-top:1px solid #1f2430;font-size:13px;color:#ffffff;text-align:right;">${tier}</td></tr>
        <tr><td style="padding-top:8px;font-size:13px;color:#9aa3b2;">${amountLabel}</td>
            <td style="padding-top:8px;font-size:13px;color:#ffffff;text-align:right;font-weight:600;">${monto}</td></tr>
      </table>
    </td></tr>
  </table>
  <h3 style="margin:0 0 8px;font-size:14px;color:#ffffff;text-transform:uppercase;letter-spacing:0.08em;">${checkinTitle}</h3>
  <p style="margin:0 0 24px;color:#c5cad4;font-size:14px;">${checkinBody}</p>
  <p style="margin:0;color:#9aa3b2;font-size:13px;">${sign}</p>
</div>`;

    return {
      subject,
      html: htmlShell({ previewText: `Pago confirmado · ${data.folio}`, bodyHtml }),
      text,
    };
  }

  const subject = `Pago confirmado · Folio ${data.folio}`;
  const greeting = `Hola ${data.nombre},`;
  const intro = `Tu pago está confirmado. Tu lugar en el ${EVENT.title} está asegurado.`;
  const paidLabel = "Estado";
  const paidValue = "PAGADO";
  const folioLabel = "Folio";
  const tierLabel = "Tipo de acceso";
  const amountLabel = "Monto";
  const checkinTitle = "El día del evento";
  const checkinBody = `El 24 de septiembre trae una identificación oficial y el código QR que enviaremos la semana del evento. Apertura ${EVENT.schedule}. ${EVENT.venueDetail}.`;
  const sign = `— ${ORGANIZERS.presented_by.join(" & ")}`;

  const text = [
    greeting,
    "",
    intro,
    "",
    `${paidLabel}: ${paidValue}`,
    `${folioLabel}: ${data.folio}`,
    `${tierLabel}: ${tier}`,
    `${amountLabel}: ${monto}`,
    "",
    checkinTitle,
    checkinBody,
    "",
    sign,
  ].join("\n");

  const bodyHtml = `
<div style="font-size:15px;line-height:1.6;color:#e6e8ee;">
  <p style="margin:0 0 14px;">${greeting}</p>
  <p style="margin:0 0 22px;color:#c5cad4;">${intro}</p>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0d1017;border:1px solid #22c55e;border-radius:8px;margin-bottom:24px;">
    <tr><td style="padding:18px 20px;">
      <div style="display:inline-block;padding:4px 10px;border-radius:999px;background:#14532d;color:#86efac;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;">${paidValue}</div>
      <div style="margin-top:12px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:18px;font-weight:600;color:#ffffff;letter-spacing:0.04em;">${data.folio}</div>
    </td></tr>
    <tr><td style="padding:0 20px 18px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td style="padding-top:10px;border-top:1px solid #1f2430;font-size:13px;color:#9aa3b2;">${tierLabel}</td>
            <td style="padding-top:10px;border-top:1px solid #1f2430;font-size:13px;color:#ffffff;text-align:right;">${tier}</td></tr>
        <tr><td style="padding-top:8px;font-size:13px;color:#9aa3b2;">${amountLabel}</td>
            <td style="padding-top:8px;font-size:13px;color:#ffffff;text-align:right;font-weight:600;">${monto}</td></tr>
      </table>
    </td></tr>
  </table>
  <h3 style="margin:0 0 8px;font-size:14px;color:#ffffff;text-transform:uppercase;letter-spacing:0.08em;">${checkinTitle}</h3>
  <p style="margin:0 0 24px;color:#c5cad4;font-size:14px;">${checkinBody}</p>
  <p style="margin:0;color:#9aa3b2;font-size:13px;">${sign}</p>
</div>`;

  return {
    subject,
    html: htmlShell({ previewText: `Pago confirmado · ${data.folio}`, bodyHtml }),
    text,
  };
}

function row(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #1f2430;font-size:12px;color:#9aa3b2;width:120px;">${label}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #1f2430;font-size:13px;color:#ffffff;">${value}</td>
    </tr>`;
}


