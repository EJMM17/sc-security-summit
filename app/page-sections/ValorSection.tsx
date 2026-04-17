import { CheckCircle2, Users, ArrowRight, Building2, Truck, Globe, ShieldCheck, ShoppingCart, Monitor } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const VALUE_HIGHLIGHTS = [
  "Contenido especializado con aplicación directa en tu operación diaria",
  "Networking estratégico con más de 300 profesionales de la industria",
  "Acceso a soluciones tecnológicas de vanguardia en seguridad y logística",
  "Vinculación directa con tomadores de decisión y compradores",
  "Certificaciones y estándares internacionales con enfoque práctico",
  "Workshops y paneles dirigidos por expertos con experiencia real",
  "Business Hub B2B para generación de alianzas comerciales",
  "Perspectiva binacional para impulsar el comercio seguro y eficiente",
];

const ASISTENTES_SHORT = [
  { title: "Operaciones & Supply Chain", icon: Building2 },
  { title: "Logística & Transporte", icon: Truck },
  { title: "Aduanas & Comercio Exterior", icon: Globe },
  { title: "Compliance & Seguridad", icon: ShieldCheck },
];

export default function ValorSection() {
  return (
    <section className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-5 gap-12 items-start">
          <div className="lg:col-span-3">
            <ScrollReveal>
              <span className="section-label">LO QUE OBTENDRÁS</span>
              <h2 className="section-title mt-3 mb-8">Valor Real Para Tu Empresa</h2>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className="space-y-3">
                {VALUE_HIGHLIGHTS.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-[15px] text-slate-700 font-medium leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          <div className="lg:col-span-2">
            <ScrollReveal delay={200}>
              <div className="sticky top-24 p-8 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-md">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-oswald text-xl font-bold text-slate-900">Perfil de Asistentes</h3>
                </div>
                <p className="text-[15px] text-slate-600 leading-relaxed mb-6">
                  Personal de la industria maquiladora, transportistas, agencias aduanales,
                  compliance y seguridad de cadena de suministro.
                </p>
                <div className="space-y-3">
                  {ASISTENTES_SHORT.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                      <a.icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="font-medium">{a.title}</span>
                    </div>
                  ))}
                </div>
                <a href="#registro" className="btn-primary w-full mt-8 py-3 text-sm justify-center">
                  Registrarme Ahora <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
