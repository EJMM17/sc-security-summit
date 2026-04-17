import { BookOpen, Mic2, Target, Globe } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const WHY_ATTEND = [
  {
    icon: BookOpen,
    title: "Actualización Estratégica",
    desc: "Temas actuales y especializados sobre seguridad, logística, comercio exterior y cumplimiento.",
  },
  {
    icon: Mic2,
    title: "Expertos del Sector",
    desc: "Speakers y panelistas con experiencia práctica en operaciones, compliance y estrategia.",
  },
  {
    icon: Target,
    title: "Impacto Real",
    desc: "Ideas, herramientas y contactos que pueden traducirse en mejoras concretas para tu empresa.",
  },
  {
    icon: Globe,
    title: "Visión Binacional y Comercial",
    desc: "Perspectiva binacional para impulsar comercio, colaboración y crecimiento.",
  },
];

export default function WhyAttendSection() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="accent-line" />
              <span className="section-label">PORQUE SER PARTE DEL SUMMIT</span>
              <div className="accent-line" />
            </div>
            <h2 className="section-title">Lo Que Te Espera</h2>
            <p className="text-slate-500 max-w-2xl mx-auto mt-4 text-lg">
              Más que un congreso. Una experiencia de capacitación, networking e innovación
              diseñada para transformar tu operación.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 gap-6">
          {WHY_ATTEND.map((item, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div className="group relative p-8 rounded-2xl border border-slate-100 bg-white hover:bg-blue-50/50 hover:border-blue-200 transition-all duration-500 hover:shadow-lg">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-oswald text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
