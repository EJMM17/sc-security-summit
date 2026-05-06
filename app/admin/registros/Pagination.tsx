"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page,
  totalPages,
  totalItems,
  perPage,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  perPage?: number;
}) {
  void perPage; // current page size is rendered server-side via the per_page select.
  const buildHref = (p: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(p));
    return `?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-xs text-slate-400">
        Mostrando página {page} de {totalPages} · {totalItems} registro(s) en total
      </p>
      <div className="flex items-center gap-2">
        <a
          href={page > 1 ? buildHref(page - 1) : undefined}
          aria-disabled={page <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none rounded-md text-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Anterior
        </a>
        <a
          href={page < totalPages ? buildHref(page + 1) : undefined}
          aria-disabled={page >= totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none rounded-md text-xs"
        >
          Siguiente
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
