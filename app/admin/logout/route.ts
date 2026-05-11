import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookie } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export async function POST(request: NextRequest) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}
