export function WaveSeparator({ color = "#EFF6FF", flip = false }: { color?: string; flip?: boolean }) {
  return (
    <div className={`wave-separator ${flip ? "wave-separator-flip" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" role="presentation">
        <path
          d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,40 1440,30 L1440,80 L0,80 Z"
          fill={color}
        />
      </svg>
    </div>
  );
}

export function AgendaBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    keynote: "bg-blue-100 text-blue-700",
    panel: "bg-indigo-100 text-indigo-700",
    workshop: "bg-cyan-100 text-cyan-700",
    talk: "bg-sky-100 text-sky-700",
    networking: "bg-emerald-100 text-emerald-700",
    break: "bg-slate-100 text-slate-500",
  };
  const labels: Record<string, string> = {
    keynote: "Keynote",
    panel: "Panel",
    workshop: "Workshop",
    talk: "Conferencia",
    networking: "Networking",
    break: "Break",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles[type] || styles.break}`}>
      {labels[type] || type}
    </span>
  );
}
