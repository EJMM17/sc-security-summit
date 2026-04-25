import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-auth";
import AdminLoginForm from "./AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const current = await getCurrentAdmin();
  if (current) redirect("/admin/registros");

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-2">Panel administrativo</h1>
        <p className="text-sm text-slate-400 mb-8">
          Recibirás un link de acceso por correo. El link expira en 15 minutos.
        </p>
        <AdminLoginForm />
      </div>
    </main>
  );
}
