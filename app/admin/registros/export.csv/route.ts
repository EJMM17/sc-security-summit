import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Row = {
  folio: string;
  nombre: string;
  apellido: string;
  email: string;
  empresa: string;
  cargo: string;
  telefono: string | null;
  tipo_acceso: string;
  monto_mxn: number;
  estado_pago: string;
  metodo_pago: string | null;
  conekta_order_id: string | null;
  conekta_payment_status: string | null;
  pagado_at: string | null;
  requiere_cfdi: boolean;
  rfc: string | null;
  razon_social: string | null;
  codigo_postal_fiscal: string | null;
  created_at: string;
};

const HEADERS = [
  "folio",
  "nombre",
  "apellido",
  "email",
  "empresa",
  "cargo",
  "telefono",
  "tipo_acceso",
  "monto_mxn",
  "estado_pago",
  "metodo_pago",
  "conekta_order_id",
  "conekta_payment_status",
  "pagado_at",
  "requiere_cfdi",
  "rfc",
  "razon_social",
  "codigo_postal_fiscal",
  "created_at",
];

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // RFC 4180: quote when the field contains comma, quote, or newline; double inner quotes.
  if (/[",\r\n]/.test(str)) return `"${str.replaceAll('"', '""')}"`;
  return str;
}

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const estado = url.searchParams.get("estado");
  const tipo = url.searchParams.get("tipo");
  const metodo = url.searchParams.get("metodo");
  const pagoStatus = url.searchParams.get("pago_status");
  const fromDate = url.searchParams.get("from");
  const toDate = url.searchParams.get("to");
  const q = url.searchParams.get("q")?.trim();

  const supabase = createAdminClient();
  let query = supabase
    .from("registros")
    .select(HEADERS.join(","))
    .order("created_at", { ascending: false });

  if (estado) query = query.eq("estado_pago", estado);
  if (tipo) query = query.eq("tipo_acceso", tipo);
  if (metodo) query = query.eq("metodo_pago", metodo);
  if (pagoStatus) query = query.eq("conekta_payment_status", pagoStatus);
  if (fromDate && /^\d{4}-\d{2}-\d{2}$/.test(fromDate)) {
    query = query.gte("created_at", `${fromDate}T00:00:00-06:00`);
  }
  if (toDate && /^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
    query = query.lte("created_at", `${toDate}T23:59:59-06:00`);
  }
  if (q && q.length > 0) {
    query = query.or(
      `folio.ilike.%${q}%,email.ilike.%${q}%,nombre.ilike.%${q}%,apellido.ilike.%${q}%,empresa.ilike.%${q}%`,
    );
  }

  const { data, error } = await query.returns<Row[]>();
  if (error) {
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }

  // Excel reads UTF-8 CSVs correctly only if there's a BOM. Without it, é/ñ
  // render as mojibake on Excel for Windows.
  const BOM = "﻿";
  const lines = [
    HEADERS.join(","),
    ...(data ?? []).map((row) => HEADERS.map((h) => csvEscape(row[h as keyof Row])).join(",")),
  ];
  const body = BOM + lines.join("\r\n");

  const filename = `registros-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
