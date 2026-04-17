import { CheckCircle2, ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const PRICING = [
  {
    id: "estudiante",
    label: "Acceso Estudiante",
    price: "$1,200",
    featured: false,
    desc: "Perfil académico con credencial vigente",
    features: ["Capacitación 2 días", "Acceso a paneles", "Constancia digital", "Kit básico"],
  },
  {
    id: "general",
    label: "Acceso General",
    price: "$5,800",
    featured: true,
    desc: "Profesionales y operación",
    features: ["Capacitación 2 días", "Acceso a paneles", "Business Hub B2B", "Kit estándar", "Constancia digital", "Coffee break"],
  },
  {
    id: "vip",
    label: "Acceso VIP",
    price: "$7,200",
    featured: false,
    desc: "Ejecutivos y tomadores de decisión",
    features: ["Todo lo de General", "Asientos prioritarios", "Constancia física", "Kit completo", "Plantillas descargables", "Acceso total B2B"],
  },
];

const COMPARISON_ROWS = [
  { feature: "Acceso a capacitación (2 días)", vip: true, general: true, estudiante: true },
  { feature: "Acceso a paneles", vip: true, general: true, estudiante: true },
  { feature: "Nivel de Gafete", vip: "VIP Premium", general: "General", estudiante: "Básico" },
  { feature: "Kit Operativo", vip: "Completo", general: "Estándar", estudiante: "Mínimo" },
  { feature: "Constancia Oficial", vip: "Física", general: "Digital", estudiante: "Digital" },
  { feature: "Business Hub B2B", vip: "Acceso Total", general: true, estudiante: false },
  { feature: "Asientos Prioritarios", vip: true, general: false, estudiante: false },
  { feature: "Plantillas Descargables", vip: true, general: false, estudiante: false },
  { feature: "Coffee Break", vip: true, general: false, estudiante: false },
];

export default function PricingSection() {
  return (
    <section id="accesos" className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-6">
            <span className="section-label">TIPOS DE ACCESO</span>
            <h2 className="section-title mt-3">Elige Tu Acceso</h2>
            <p className="text-slate-500 max-w-xl mx-auto mt-4">
              Dos días de capacitación especializada · 24 y 25 de septiembre de 2026 · Centro de
              Convenciones, Reynosa
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {PRICING.map((plan, i) => (
            <ScrollReveal key={plan.id} delay={i * 100}>
              <div
                className={`relative p-8 rounded-2xl h-full flex flex-col transition-all duration-300 ${plan.featured
                    ? "text-white border-2 border-blue-400 shadow-2xl scale-[1.03]"
                    : "bg-white border-2 border-slate-200 shadow-lg hover:shadow-xl hover:border-blue-300"
                  }`}
                style={plan.featured ? {
                  background: "linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 50%, #172554 100%)",
                  boxShadow: "0 25px 50px -12px rgba(37, 99, 235, 0.35)",
                } : undefined}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg" style={{ background: "linear-gradient(90deg, #22d3ee, #60a5fa)" }}>
                    Más Popular
                  </div>
                )}
                <h3 className={`font-oswald text-xl font-bold ${plan.featured ? "text-white" : "text-slate-900"}`}>
                  {plan.label}
                </h3>
                <p className={`text-sm mt-1 ${plan.featured ? "text-blue-200" : "text-slate-400"}`}>
                  {plan.desc}
                </p>
                <div className="mt-6 mb-6">
                  <span className={`font-oswald text-4xl font-bold ${plan.featured ? "text-white" : "text-slate-900"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ml-1 ${plan.featured ? "text-blue-200" : "text-slate-400"}`}>MXN</span>
                  <p className={`text-xs mt-1 ${plan.featured ? "text-blue-300" : "text-slate-400"}`}>* Más I.V.A.</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className={`flex items-center gap-2 text-sm ${plan.featured ? "text-blue-100" : "text-slate-600"}`}>
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${plan.featured ? "text-cyan-300" : "text-blue-500"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#registro"
                  className={`w-full py-3.5 rounded-lg font-bold text-sm text-center block transition-all ${plan.featured
                      ? "bg-white text-blue-800 hover:bg-blue-50 shadow-lg"
                      : "btn-primary"
                    }`}
                >
                  OBTENER ACCESO
                </a>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={200}>
          <div className="mt-10 p-6 sm:p-8 rounded-2xl bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-oswald text-lg font-bold text-slate-900 mb-1">¿Cómo funciona el proceso de pago?</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Al completar el formulario de registro recibirás un <strong>folio de confirmación</strong> en pantalla y por correo. Un representante de Lanz Logistics te contactará en un plazo de <strong>24–48 horas hábiles</strong> con las instrucciones de pago (transferencia bancaria, depósito o pago en línea). Tu lugar queda reservado una vez confirmado el pago.
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { step: "1", title: "Regístrate", desc: "Llena el formulario y recibe tu folio" },
                    { step: "2", title: "Recibe instrucciones", desc: "Te contactamos en 24-48 hrs hábiles" },
                    { step: "3", title: "Confirma tu lugar", desc: "Realiza el pago y recibes tu confirmación" },
                  ].map((s) => (
                    <div key={s.step} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-blue-100">
                      <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{s.step}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{s.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-4">
                  ¿Preguntas sobre el pago? Escríbenos a{" "}
                  <a href="mailto:Contacto@LanzLogistics.com" className="text-blue-600 hover:underline font-medium">Contacto@LanzLogistics.com</a>
                  {" "}o al <a href="tel:+19565158070" className="text-blue-600 hover:underline font-medium">+1 (956) 515-8070</a>
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <div className="card-elevated mt-16 overflow-x-auto">
            <table className="comparison-table w-full">
              <thead>
                <tr>
                  <th className="text-left p-5 font-oswald text-xs tracking-wider text-slate-400 uppercase">Beneficio</th>
                  <th className="text-center p-5 font-oswald text-sm text-slate-600 uppercase">General</th>
                  <th className="text-center p-5 font-oswald text-sm text-blue-600 uppercase font-bold">VIP</th>
                  <th className="text-center p-5 font-oswald text-xs text-slate-400 uppercase">Estudiante</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={i} className="border-t border-slate-100 hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 text-sm text-slate-700 font-medium">{row.feature}</td>
                    <td className="p-4 text-center">
                      {typeof row.general === "boolean" ? (
                        row.general ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <span className="text-slate-300">—</span>
                      ) : <span className="text-sm text-slate-600">{row.general}</span>}
                    </td>
                    <td className="p-4 text-center">
                      {typeof row.vip === "boolean" ? (
                        row.vip ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <span className="text-slate-300">—</span>
                      ) : <span className="text-sm font-semibold text-blue-600">{row.vip}</span>}
                    </td>
                    <td className="p-4 text-center">
                      {typeof row.estudiante === "boolean" ? (
                        row.estudiante ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <span className="text-slate-300">—</span>
                      ) : <span className="text-sm text-slate-500">{row.estudiante}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
