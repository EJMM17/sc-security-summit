import { NextResponse, type NextRequest } from "next/server";
import { hasAdminSession } from "@/lib/admin/auth";
import { TIER_LABELS } from "@/lib/admin/labels";
import { TICKET_TIER_VALUES, type AdminTicketTier } from "@/lib/admin/types";
import { listSoldTickets } from "@/server/repositories/admin-ticket-order-repository";

export const dynamic = "force-dynamic";

/**
 * The sold-access list as a file, for the check-in desk and for the DC-3
 * certificates. It carries participant data, so it is behind the same session
 * as the panel and is never cached: an unauthenticated request answers 404,
 * not a redirect that would confirm the panel exists.
 */
const HEADERS = [
  "folio",
  "asistente",
  "asiento",
  "asientos_en_orden",
  "tipo_acceso",
  "comprador",
  "correo",
  "telefono",
  "empresa",
  "idioma",
  "importe_mxn",
  "pagado_en",
  "cfdi",
  "como_nos_encontraron",
  "orden",
];

/**
 * RFC 4180 quoting, plus a leading apostrophe for anything a spreadsheet would
 * otherwise evaluate as a formula.
 */
function csvCell(value: string | number | null): string {
  const raw = value === null ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await hasAdminSession())) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "cache-control": "no-store" },
    });
  }

  const tierParam = request.nextUrl.searchParams.get("tier") ?? "all";
  const tier: AdminTicketTier | "all" = (
    TICKET_TIER_VALUES as readonly string[]
  ).includes(tierParam)
    ? (tierParam as AdminTicketTier)
    : "all";
  const search = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 120);

  const tickets = await listSoldTickets({ tier, search });

  const rows = tickets.map((ticket) =>
    [
      ticket.ticket_code,
      ticket.attendee_name ?? ticket.buyer_name,
      ticket.seat_number,
      ticket.seats_in_order,
      TIER_LABELS[ticket.tier],
      ticket.buyer_name,
      ticket.email,
      ticket.phone,
      ticket.company,
      ticket.language,
      (ticket.amount_cents / 100).toFixed(2),
      ticket.paid_at ?? ticket.created_at,
      ticket.invoice_status,
      ticket.referral_source,
      ticket.order_id,
    ]
      .map(csvCell)
      .join(","),
  );

  // Excel on Windows needs the BOM to read the accents as UTF-8.
  const body = `﻿${[HEADERS.map(csvCell).join(","), ...rows].join("\r\n")}\r\n`;
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="boletos-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
