"use server";

import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { emailShell, escapeHtml } from "@/lib/email-templates";
import { checkRateLimit, getClientIp, RateLimitError } from "@/lib/rate-limit";

const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? "hola@scsecuritysummit.com";

const corporateSchema = z.object({
  kind: z.literal("corporate"),
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  company: z.string().trim().min(2).max(160),
  role: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
  website: z.string().max(0),
});

const sponsorSchema = z.object({
  kind: z.literal("sponsor"),
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(30),
  interest: z.string().trim().min(10).max(1200),
  website: z.string().max(0),
});

const inquirySchema = z.discriminatedUnion("kind", [corporateSchema, sponsorSchema]);

export type InquiryResult = {
  ok: boolean;
  reason?: "invalid" | "rate_limited" | "email_unavailable";
};

export async function submitInquiry(formData: FormData): Promise<InquiryResult> {
  const parsed = inquirySchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    const website = formData.get("website");
    if (typeof website === "string" && website.length > 0) return { ok: true };
    return { ok: false, reason: "invalid" };
  }

  const data = parsed.data;

  try {
    await checkRateLimit(`inquiry:${data.kind}:${await getClientIp()}`);
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false, reason: "rate_limited" };
    throw error;
  }

  const rows =
    data.kind === "corporate"
      ? [
          ["Nombre", `${data.firstName} ${data.lastName}`],
          ["Correo", data.email],
          ["Empresa", data.company],
          ["Cargo", data.role],
          ["Teléfono", data.phone],
        ]
      : [
          ["Nombre", data.name],
          ["Empresa", data.company],
          ["Correo", data.email],
          ["Teléfono", data.phone],
          ["Interés", data.interest],
        ];

  const result = await sendEmail({
    to: CONTACT_EMAIL,
    subject:
      data.kind === "corporate"
        ? `Solicitud de pase corporativo · ${data.company}`
        : `Solicitud de patrocinio · ${data.company}`,
    html: inquiryEmailHtml(
      data.kind === "corporate" ? "Nueva solicitud de pase corporativo" : "Nueva solicitud de patrocinio",
      rows,
    ),
  });

  return result.ok ? { ok: true } : { ok: false, reason: "email_unavailable" };
}

function inquiryEmailHtml(title: string, rows: string[][]) {
  const details = rows
    .map(
      ([label, value]) =>
        `<tr><th style="padding:10px 14px;text-align:left;vertical-align:top;color:#475569">${escapeHtml(label)}</th><td style="padding:10px 14px;color:#0f172a">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return emailShell(
    title,
    `<h1 style="margin:0 0 16px;font-size:20px;color:#0f172a">${escapeHtml(title)}</h1><table style="width:100%;border-collapse:collapse;background:#f8fafc">${details}</table>`,
  );
}
