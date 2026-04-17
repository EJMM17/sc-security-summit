import { Calendar } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { AgendaBadge } from "./_shared";

const AGENDA_DIA1 = [
  { time: "08:00 — 09:00", title: "Registro y Welcome Coffee", type: "break" },
  { time: "09:00 — 09:30", title: "Ceremonia de Inauguración", type: "keynote" },
  { time: "09:30 — 10:30", title: "Panorama Actual de la Seguridad en Supply Chain", type: "keynote" },
  { time: "10:30 — 11:00", title: "Coffee Break & Networking", type: "break" },
  { time: "11:00 — 12:30", title: "Panel: Certificaciones Internacionales de Seguridad — Retos y Beneficios", type: "panel" },
  { time: "12:30 — 13:30", title: "Workshop: Gestión de Riesgos en Comercio Exterior", type: "workshop" },
  { time: "13:30 — 15:00", title: "Comida & Business Hub B2B", type: "break" },
  { time: "15:00 — 16:30", title: "Tecnologías de Trazabilidad y Monitoreo Logístico", type: "talk" },
  { time: "16:30 — 17:30", title: "Sesión de Networking Dirigida", type: "networking" },
];

const AGENDA_DIA2 = [
  { time: "08:30 — 09:00", title: "Welcome Coffee", type: "break" },
  { time: "09:00 — 10:30", title: "Trade Compliance: Normativas y Cumplimiento", type: "keynote" },
  { time: "10:30 — 11:00", title: "Coffee Break", type: "break" },
  { time: "11:00 — 12:00", title: "Ciberseguridad Aplicada a la Cadena de Suministros", type: "talk" },
  { time: "12:00 — 13:00", title: "Panel: Innovación y Aprendizaje Estratégico", type: "panel" },
  { time: "13:00 — 14:30", title: "Comida & Rondas B2B", type: "break" },
  { time: "14:30 — 16:00", title: "Workshops Simultáneos — Track A & B", type: "workshop" },
  { time: "16:00 — 17:00", title: "Ceremonia de Clausura y Reconocimientos", type: "keynote" },
];

export default function AgendaSection() {
  return (
    <section id="agenda" className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="section-label">AGENDA DEL EVENTO</span>
            <h2 className="section-title mt-3">Programa Preliminar</h2>
            <p className="text-slate-500 max-w-2xl mx-auto mt-4">
              Dos días intensivos de capacitación, paneles de expertos, workshops prácticos y
              sesiones de networking dirigidas.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-12">
          <ScrollReveal>
            <div className="card-elevated p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-oswald text-xl font-bold text-slate-900">Día 1</h3>
                  <p className="text-xs text-slate-400">Miércoles, 24 de septiembre</p>
                </div>
              </div>
              <div>
                {AGENDA_DIA1.map((item, i) => (
                  <div key={i} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <span className="text-xs font-mono text-blue-600 font-semibold whitespace-nowrap">{item.time}</span>
                      <AgendaBadge type={item.type} />
                    </div>
                    <p className="text-sm text-slate-700 font-medium mt-1">{item.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="card-elevated p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-oswald text-xl font-bold text-slate-900">Día 2</h3>
                  <p className="text-xs text-slate-400">Jueves, 25 de septiembre</p>
                </div>
              </div>
              <div>
                {AGENDA_DIA2.map((item, i) => (
                  <div key={i} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <span className="text-xs font-mono text-blue-600 font-semibold whitespace-nowrap">{item.time}</span>
                      <AgendaBadge type={item.type} />
                    </div>
                    <p className="text-sm text-slate-700 font-medium mt-1">{item.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={300}>
          <p className="text-center text-xs text-slate-400 mt-8">
            * Programa sujeto a ajustes menores. La agenda final se publicará 30 días antes del evento.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
