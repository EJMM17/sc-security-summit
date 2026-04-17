import Image from "next/image";
import { Mic2 } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const SPEAKERS = [
  {
    name: "Fidel Guerrero",
    role: "Subdirector, Comité Nacional de Aduanas y Comercio Exterior",
    org: "INDEX",
    topic: "Aduanas & Comercio Exterior",
    image: "/images/speaker-fidel.webp",
  },
  {
    name: "Isidoro Juárez",
    role: "Mandatario Aduanal Certificado",
    org: "Especialista en Comercio Exterior",
    topic: "Aduanas & Compliance",
    image: "/images/speaker-isidoro.webp",
  },
  {
    name: "Julio César Suárez",
    role: "Líder en Trade Compliance e Innovación",
    org: "Sector Automotriz e Industrial",
    topic: "Trade Compliance",
    image: "/images/speaker-julio.webp",
  },
  {
    name: "Eduardo Luna",
    role: "Especialista en Innovación Estratégica",
    org: "Certificación Internacional en Enseñanza",
    topic: "Innovación & Aprendizaje",
    image: "/images/speaker-eduardo.webp",
  },
];

export default function SpeakersSection() {
  return (
    <section id="speakers" className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="section-label flex items-center justify-center gap-2">
              <Mic2 className="w-4 h-4" /> CONFERENCISTAS CONFIRMADOS
            </span>
            <h2 className="section-title mt-3">Especialistas de Primer Nivel</h2>
            <p className="text-slate-500 max-w-2xl mx-auto mt-4">
              Líderes en estándares internacionales, comercio exterior, cumplimiento operativo e
              innovación estratégica.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {SPEAKERS.map((s, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div className="speaker-card group text-center">
                <div className="relative w-44 h-44 mx-auto mb-5 rounded-2xl overflow-hidden shadow-xl shadow-blue-500/10 group-hover:shadow-blue-500/20 transition-shadow bg-slate-100">
                  <Image
                    src={s.image}
                    alt={`${s.name} — ${s.role}`}
                    fill
                    loading="lazy"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    quality={80}
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-blue-900/90 to-transparent pt-8 pb-3 px-3">
                    <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">{s.topic}</span>
                  </div>
                </div>
                <h3 className="font-oswald text-lg font-bold text-slate-900">{s.name}</h3>
                <p className="text-sm text-slate-500 mt-1 leading-snug">{s.role}</p>
                <p className="text-xs text-blue-600 font-medium mt-1">{s.org}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={500}>
          <p className="text-center text-sm text-slate-400 mt-12">
            Más conferencistas serán anunciados pronto.{" "}
            <a href="#registro" className="text-blue-600 font-semibold hover:underline">
              Regístrate para recibirlos primero →
            </a>
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
