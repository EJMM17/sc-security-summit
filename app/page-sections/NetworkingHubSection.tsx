import { Users, Clock, Handshake, Award, CheckCircle2, ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

export default function NetworkingHubSection() {
  return (
    <section className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)`,
        backgroundSize: "40px 40px"
      }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-3/5">
            <ScrollReveal>
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-2 text-xs text-white/90 font-semibold tracking-wider uppercase mb-6">
                OPORTUNIDAD COMERCIAL
              </span>
              <h2 className="font-oswald text-3xl sm:text-4xl font-bold text-white leading-[1.15] mb-4">
                Sala de Networking & Business Hub
              </h2>
              <p className="text-blue-100/80 max-w-lg text-base leading-relaxed mb-6">
                Un espacio físico dedicado al encuentro de negocios. Diseñado
                para conectar compradores, proveedores y decisores en reuniones
                de alto valor.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  "Mesas B2B por industria",
                  "Directorio de asistentes",
                  "Área de presentaciones",
                  "Acceso prioritario VIP",
                  "Coffee break en sesiones",
                  "Networking los 2 días",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <a href="#registro" className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors shadow-lg">
                RESERVAR MI LUGAR <ArrowRight className="w-4 h-4" />
              </a>
            </ScrollReveal>
          </div>

          <div className="md:w-2/5">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Users, number: "300", label: "LUGARES DISPONIBLES" },
                { icon: Clock, number: "15+", label: "HORAS DE NETWORKING" },
                { icon: Handshake, number: "2", label: "DÍAS DE EVENTO" },
                { icon: Award, number: "4", label: "SECTORES" },
              ].map((stat, i) => (
                <ScrollReveal key={i} delay={i * 100}>
                  <div className="card-dark p-5 text-center group hover:-translate-y-1 transition-transform">
                    <stat.icon className="w-6 h-6 text-cyan-300 mx-auto mb-2" />
                    <span className="font-oswald text-2xl font-bold text-white block">{stat.number}</span>
                    <span className="text-[10px] text-blue-200/60 tracking-widest font-semibold">{stat.label}</span>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
