export function RegistrosTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-px" aria-busy="true" aria-label="Cargando registros...">
      <div className="h-9 rounded-t-md bg-slate-900" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-11 bg-slate-800/60" />
      ))}
    </div>
  );
}
