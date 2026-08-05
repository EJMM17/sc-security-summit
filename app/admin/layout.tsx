import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAdminPanelConfigured } from "@/lib/admin/config";

export const metadata: Metadata = {
  title: "Operación · SC Security Summit",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // A deployment without both admin secrets has no panel at all, not a login
  // screen that advertises one.
  if (!isAdminPanelConfigured()) notFound();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">{children}</div>
  );
}
