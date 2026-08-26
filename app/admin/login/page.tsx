import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { hasAdminSession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await hasAdminSession()) redirect("/admin");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
          SC Security Summit 2026
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Panel de operación
        </h1>
        <p className="mt-2 mb-6 text-sm text-slate-600">
          Acceso restringido. Aquí se consultan las solicitudes recibidas por
          los formularios del sitio, las órdenes de compra y los boletos
          vendidos.
        </p>
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-xs text-slate-500">
        Sesión de 8 horas. Cerrar sesión no revoca el enlace de acceso.
      </p>
    </main>
  );
}
