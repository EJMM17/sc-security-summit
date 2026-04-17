import AnimatedCounter from "@/components/AnimatedCounter";

const HERO_STATS = [
  { number: 2, suffix: "", label: "Días de Capacitación" },
  { number: 4, suffix: "+", label: "Conferencistas Confirmados" },
  { number: 300, suffix: "", label: "Lugares Disponibles" },
  { number: 4, suffix: "", label: "Sectores Industriales" },
];

export default function StatsBar() {
  return (
    <section className="py-8 bg-white border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-8 sm:gap-16">
        {HERO_STATS.map((s, i) => (
          <div key={i} className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <AnimatedCounter target={s.number} className="number-accent text-3xl sm:text-4xl" />
              {s.suffix && <span className="number-accent text-2xl">{s.suffix}</span>}
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mt-1">
              {s.label}
            </p>
          </div>
        ))}
        <div className="hidden sm:block text-center border-l border-slate-200 pl-8">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Presentado por</p>
          <p className="font-bold text-slate-700 text-sm mt-1">Lanz Logistics <span className="text-blue-500">+</span> Thynk Unlimited</p>
        </div>
      </div>
    </section>
  );
}
