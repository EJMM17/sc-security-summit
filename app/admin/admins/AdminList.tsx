"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Loader2, Pencil, Trash2, X, Check, UserCheck, UserX } from "lucide-react";
import { deleteAdmin, updateAdmin, type AdminCrudState } from "@/app/actions/admin";

interface Admin {
  id: string;
  email: string;
  nombre: string;
  active: boolean;
  created_at: string;
}

export default function AdminList({ admins }: { admins: Admin[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="border border-slate-800 rounded-md overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-slate-900 text-slate-400">
          <tr>
            <th className="text-left px-3 py-2 font-medium">Nombre</th>
            <th className="text-left px-3 py-2 font-medium">Correo</th>
            <th className="text-left px-3 py-2 font-medium">Estado</th>
            <th className="text-left px-3 py-2 font-medium">Creado</th>
            <th className="text-left px-3 py-2 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <AdminListRow
              key={admin.id}
              admin={admin}
              isEditing={editingId === admin.id}
              onEdit={() => setEditingId(admin.id)}
              onCancel={() => setEditingId(null)}
            />
          ))}
          {admins.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                No hay administradores registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AdminListRow({
  admin,
  isEditing,
  onEdit,
  onCancel,
}: {
  admin: Admin;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}) {
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteAdmin,
    { ok: false, message: "" } as AdminCrudState,
  );

  const [updateState, updateAction, updatePending] = useActionState(
    updateAdmin,
    { ok: false, message: "" } as AdminCrudState,
  );

  if (isEditing) {
    return (
      <tr className="border-t border-slate-800 bg-slate-900/40">
        <td className="px-3 py-2" colSpan={5}>
          <form action={updateAction} className="space-y-2">
            <input type="hidden" name="id" value={admin.id} />
            <div className="grid grid-cols-2 gap-2">
              <input
                name="nombre"
                defaultValue={admin.nombre}
                placeholder="Nombre"
                className="px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
              <select
                name="active"
                defaultValue={admin.active ? "true" : "false"}
                className="px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
            <input
              name="password"
              type="password"
              placeholder="Nueva contraseña (opcional)"
              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={updatePending}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded text-[10px] font-medium text-white"
              >
                {updatePending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Guardar
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-medium"
              >
                <X className="w-3 h-3" />
                Cancelar
              </button>
            </div>
            {updateState.message && (
              <p className={`text-[10px] ${updateState.ok ? "text-emerald-400" : "text-red-400"}`}>
                {updateState.message}
              </p>
            )}
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-slate-800 hover:bg-slate-900/30">
      <td className="px-3 py-2 font-medium text-slate-200">{admin.nombre}</td>
      <td className="px-3 py-2 text-slate-300">{admin.email}</td>
      <td className="px-3 py-2">
        {admin.active ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
            <UserCheck className="w-3 h-3" /> Activo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
            <UserX className="w-3 h-3" /> Inactivo
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-slate-400 text-[11px]">
        {new Date(admin.created_at).toLocaleDateString("es-MX")}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            title="Editar"
            className="inline-flex items-center justify-center w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <form action={deleteAction} className="inline">
            <input type="hidden" name="id" value={admin.id} />
            <button
              type="submit"
              disabled={deletePending}
              title="Eliminar"
              className="inline-flex items-center justify-center w-7 h-7 rounded bg-slate-800 hover:bg-red-900/40 hover:text-red-300 text-slate-300 disabled:opacity-50"
            >
              {deletePending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </form>
        </div>
        {deleteState.message && (
          <p className={`text-[10px] mt-1 ${deleteState.ok ? "text-emerald-400" : "text-red-400"}`}>
            {deleteState.message}
          </p>
        )}
      </td>
    </tr>
  );
}
