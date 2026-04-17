import { ShieldCheck, Network, Handshake, CheckCircle2 } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const PILARES = [
  {
    icon: ShieldCheck,
    title: "Actualización Estratégica",
    desc: "Accede a contenido de alto valor sobre certificaciones de seguridad, comercio exterior, gestión de riesgos y cumplimiento operativo con enfoque en estándares internacionales.",
    bullets: [
      "Tendencias y regulaciones vigentes",
      "Mejores prácticas internacionales",
      "Gestión de riesgos y controles",
    ],
    number: "01",
  },
  {
    icon: Network,
    title: "Soluciones e Innovación",
    desc: "Descubre tecnologías, herramientas y servicios especializados para la seguridad de tu cadena: trazabilidad, monitoreo inteligente y ciberseguridad aplicada.",
    bullets: [
      "Tecnologías de seguridad avanzada",
      "Monitoreo logístico en tiempo real",
      "Ciberseguridad para supply chain",
    ],
    number: "02",
  },
  {
    icon: Handshake,
    title: "Business Hub B2B",
    desc: "Conecta con empresas, especialistas y tomadores de decisión. Impulsa relaciones de negocio en el entorno aduanal y logístico del norte de México.",
    bullets: [
      "Networking dirigido por industria",
      "Generación de leads calificados",
      "Alianzas comerciales estratégicas",
    ],
    number: "03",
  },
];

export default function PilaresSection() {
  return (
    <section id="enfoque" className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="section-label">EJES TEMÁTICOS</span>
            <h2 className="section-title mt-3">Tres Pilares, Un Objetivo</h2>
            <p className="text-slate-500 max-w-2xl mx-auto mt-4">
              Cada eje del Summit fue diseñado para cubrir las necesidades reales
              de los profesionales de la cadena de suministros.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-8">
          {PILARES.map((p, i) => (
            <ScrollReveal key={i} delay={i * 150}>
              <div className="card-elevated p-8 h-full group">
                <span className="number-accent text-6xl font-oswald font-bold opacity-20 group-hover:opacity-40 transition-opacity">{p.number}</span>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
                  <p.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-oswald text-xl font-bold text-slate-900 mb-3">{p.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-5">{p.desc}</p>
                <ul className="space-y-2">
                  {p.bullets.map((b, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
