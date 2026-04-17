import { Building2, Truck, Globe, ShieldCheck, ShoppingCart, Monitor, Eye, Satellite, ScanLine, BookOpen, ArrowRight, Users } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const ASISTENTES = [
  { title: "Operaciones & Supply Chain", desc: "Directores, gerentes y coordinaciones", icon: Building2 },
  { title: "Logística & Transporte", desc: "Responsables de tráfico y distribución", icon: Truck },
  { title: "Aduanas & Comercio Exterior", desc: "Import-export y cumplimiento operativo", icon: Globe },
  { title: "Compliance & Seguridad", desc: "Seguridad patrimonial y control interno", icon: ShieldCheck },
  { title: "Abastecimiento & Compras", desc: "Decisores de compra y proveedores", icon: ShoppingCart },
  { title: "Sistemas & Tecnología", desc: "Monitoreo e innovación IT", icon: Monitor },
];

const PROVEEDORES = [
  { title: "Transportistas", icon: Truck },
  { title: "Agencias Aduanales", icon: Globe },
  { title: "Videovigilancia CCTV", icon: Eye },
  { title: "Telemetría GPS", icon: Satellite },
  { title: "Control de Acceso", icon: ScanLine },
  { title: "Consultoría", icon: BookOpen },
];

export default function AudienciaSection() {
  return (
    <section id="audiencia" className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="section-label">PARTICIPANTES</span>
            <h2 className="section-title mt-3">¿A Quién Va Dirigido?</h2>
            <p className="text-slate-500 max-w-2xl mx-auto mt-4">
              Para quienes mueven, protegen y fortalecen la cadena de suministro. Un punto de
              encuentro para líderes y especialistas en áreas clave.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {ASISTENTES.map((a, i) => (
            <ScrollReveal key={i} delay={i * 80}>
              <div className="flex items-center gap-4 p-5 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                  <a.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{a.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{a.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div className="card-elevated p-8 sm:p-10">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="md:w-2/5">
                <span className="section-label text-xs">PROVEEDORES</span>
                <h3 className="font-oswald text-2xl font-bold text-slate-900 mt-2">Ecosistema B2B</h3>
                <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                  Empresas especializadas en tecnología, seguridad y servicios para la industria y la cadena de suministro.
                </p>
              </div>
              <div className="md:w-3/5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PROVEEDORES.map((prov, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-all text-sm font-medium text-slate-700">
                    <prov.icon className="w-4 h-4 text-blue-500" />
                    {prov.title}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
