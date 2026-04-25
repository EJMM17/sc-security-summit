import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · SC Security Summit 2026",
  robots: { index: false, follow: false, nocache: true },
};

// All /admin/* pages render outside the marketing layout's chrome (no
// AmbientCanvas, no Toaster, no marketing fonts). The root layout still
// applies because Next.js nests layouts; we just keep this layout minimal.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-950 text-slate-100">{children}</div>;
}
