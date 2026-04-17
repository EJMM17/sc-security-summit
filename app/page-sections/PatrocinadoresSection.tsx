import { CheckCircle2, ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const SPONSORS = [
  {
    tier: "Patrocinador Platino",
    slots: "Disponibilidad limitada · 8 espacios",
    stand: "Stand 5×6m",
    benefits: [
      "Stand Premium en ubicación privilegiada (5m × 6m)",
      "Logo en material impreso y digital (flyers, banners, sitio web, redes sociales)",
      "Mención destacada en inauguración y clausura del evento",
      "Espacio de presentación comercial ante la audiencia (5 min)",
      "5 accesos VIP a conferencias",
      "Inclusión de material promocional en el kit de bienvenida",
      "Publicación destacada en redes sociales y mailing",
      "Acceso a actividades de vinculación con compradores y autoridades",
      "Directorio de visitantes y contactos potenciales",
      "Coffee break con servicio en el lugar",
      "Reel publicitario en pantallas",
    ],
  },
  {
    tier: "Patrocinador Oro",
    slots: "Disponibilidad limitada · 10 espacios",
    stand: "Stand 4×4m",
    benefits: [
      "Stand en área central del evento (4m × 4m)",
      "Logo en material impreso y digital",
      "Mención durante la inauguración",
      "3 accesos VIP a conferencias",
      "Publicación en redes sociales y mailing",
      "Oportunidad de distribuir material promocional",
    ],
  },
  {
    tier: "Patrocinador Plata",
    slots: "Disponibilidad limitada · 14 espacios",
    stand: "Stand 3×3m",
    benefits: [
      "Stand estándar en área de exhibición (3m × 3m)",
      "Logo en material digital (sitio web, redes sociales)",
      "2 accesos VIP a conferencias",
      "Publicación en redes sociales",
    ],
  },
  {
    tier: "Proveedor Aliado Estratégico",
    slots: "Categoría especial · 16 espacios",
    stand: "Stand 3×3m",
    benefits: [
      "Stand 3×3m en zona de proveedores",
      "1 acceso a conferencias incluido",
      "Inclusión en directorio de soluciones",
      'Badge "Proveedor Recomendado" en materiales del evento',
      "Diseñado para proveedores especializados en certificaciones de seguridad",
    ],
  },
];

export default function PatrocinadoresSection() {
  return (
    <section id="patrocinadores" className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="section-label">OPORTUNIDADES DE PATROCINIO</span>
            <h2 className="section-title mt-3">Posiciona Tu Marca</h2>
            <p className="text-slate-500 max-w-2xl mx-auto mt-4">
              Marcas que buscan máxima visibilidad, posicionamiento y presencia comercial
              destacada en el evento. Conecta tu empresa con más de 300 profesionales de la cadena de suministros.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SPONSORS.map((s, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div className="card-elevated p-6 h-full flex flex-col rounded-2xl hover:shadow-xl hover:border-blue-200 transition-all duration-300">
                <h3 className="font-oswald text-lg font-bold text-slate-900 mb-2">{s.tier}</h3>
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-600">{s.slots}</span>
                  <span className="text-[11px] text-slate-400">{s.stand}</span>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {s.benefits.map((b, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:Contacto@LanzLogistics.com?subject=Patrocinio%20Summit%202026"
                  className="inline-flex items-center justify-center gap-2 mt-6 w-full py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all"
                >
                  Solicitar Info <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
