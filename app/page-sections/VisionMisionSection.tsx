import { Compass, Crosshair, Lightbulb } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

export default function VisionMisionSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 py-20 sm:py-28 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)`,
        backgroundSize: "28px 28px"
      }} />
      <div className="absolute top-10 right-10 w-40 h-40 border border-white/5 rounded-full float-shape" />
      <div className="absolute bottom-10 left-10 w-28 h-28 border border-cyan-400/8 rounded-2xl float-shape-reverse" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-2 text-xs text-white/90 font-semibold tracking-wider uppercase mb-6">
              <Compass className="w-3.5 h-3.5 text-cyan-300" /> PROPÓSITO
            </span>
            <h2 className="font-oswald text-3xl sm:text-4xl font-bold text-white leading-tight">
              Visión y Misión
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8">
          <ScrollReveal>
            <div className="relative p-8 sm:p-10 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <Crosshair className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-oswald text-2xl font-bold text-white">Misión</h3>
              </div>
              <div className="space-y-4 text-blue-100/75 text-sm leading-relaxed">
                <p>
                  Reunir en un solo espacio a los sectores clave de la cadena de suministro para fortalecer las estrategias de seguridad, compartir mejores prácticas, difundir actualizaciones relevantes en certificaciones internacionales, y generar oportunidades de vinculación estratégica entre empresas, especialistas y proveedores de soluciones.
                </p>
                <p>
                  Nuestra misión es impulsar el desarrollo de cadenas de suministro más seguras, informadas y competitivas, mediante experiencias de alto valor como conferencias, paneles, talleres y networking especializado.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="relative p-8 sm:p-10 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-oswald text-2xl font-bold text-white">Visión</h3>
              </div>
              <div className="space-y-4 text-blue-100/75 text-sm leading-relaxed">
                <p>
                  Ser el Summit líder en el norte de México en temas de seguridad en la cadena de suministro, comercio exterior, logística y cumplimiento normativo, reconocido por conectar a empresas, expertos y proveedores estratégicos en un ecosistema de aprendizaje, innovación y crecimiento colaborativo.
                </p>
                <p>
                  Aspiramos a consolidarnos como el evento de referencia para impulsar una cultura de prevención, cumplimiento y excelencia operativa que fortalezca el comercio seguro y eficiente a nivel regional y binacional.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={300}>
          <div className="mt-12 p-8 sm:p-10 rounded-2xl bg-white/[0.04] border border-white/8 text-center max-w-4xl mx-auto">
            <p className="text-blue-100/70 text-sm leading-relaxed">
              El 1er Summit de Seguridad en la Cadena de Suministro es un espacio especializado creado para reunir a los principales actores de la industria maquiladora, transporte, aduanas, seguridad y compliance, con el propósito de fortalecer la seguridad, la eficiencia y la competitividad del comercio en la región. A través de conferencias, paneles, workshops y espacios de vinculación comercial como el Business Hub, buscamos impulsar alianzas estratégicas, promover soluciones de alto impacto y contribuir al desarrollo de una cadena de suministro más segura, resiliente y eficiente.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
