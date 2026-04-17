export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-[3px] border-[var(--blue-100)] border-t-[var(--blue-600)] animate-spin mx-auto mb-4" />
        <p className="text-sm text-[var(--text-muted)] tracking-wide font-inter">
          Cargando...
        </p>
      </div>
    </div>
  );
}
