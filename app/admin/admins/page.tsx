import { ArrowLeft, Shield } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdmins } from "@/app/actions/admin";
import AdminForm from "./AdminForm";
import AdminList from "./AdminList";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  await requireAdmin();
  const admins = await listAdmins();

  return (
    <main className="px-4 sm:px-8 py-8 max-w-screen-lg mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <a
          href="/admin/registros"
          className="inline-flex items-center justify-center w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
          aria-label="Volver a registros"
        >
          <ArrowLeft className="w-4 h-4" />
        </a>
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            Administradores
          </h1>
          <p className="text-xs text-slate-400">
            Gestiona quién puede acceder al panel administrativo.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr,1.5fr]">
        <AdminForm />
        <AdminList admins={admins} />
      </div>
    </main>
  );
}
