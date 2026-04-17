import { Shield, Mail, Phone, ExternalLink } from "lucide-react";

const FOOTER_LINKS = [
  { href: "#enfoque", label: "Enfoque" },
  { href: "#speakers", label: "Conferencistas" },
  { href: "#agenda", label: "Agenda" },
  { href: "#audiencia", label: "Audiencia" },
  { href: "#accesos", label: "Accesos" },
  { href: "#patrocinadores", label: "Patrocinadores" },
  { href: "#ubicacion", label: "Ubicación" },
  { href: "#faq", label: "FAQ" },
];

export default function FooterSection() {
  return (
    <footer className="bg-slate-900 pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-oswald text-lg font-bold text-white">SC SUMMIT</span>
                <span className="block text-[10px] font-bold tracking-[0.2em] text-blue-400">REYNOSA 2026</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              1er Summit de Seguridad en la Cadena de Suministros. 24
              y 25 de septiembre, 2026. Centro de Convenciones de
              Reynosa, Tamaulipas, México.
            </p>
            <p className="text-xs text-slate-500 mt-4">
              Presentado por <span className="text-blue-400 font-semibold">Lanz Logistics</span> + <span className="text-blue-400 font-semibold">Thynk Unlimited</span>
            </p>
          </div>

          <div>
            <h4 className="font-oswald text-sm font-bold text-white uppercase tracking-wider mb-4">Evento</h4>
            <nav className="flex flex-col gap-2.5">
              {FOOTER_LINKS.map((l) => (
                <a key={l.href} href={l.href} className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                  {l.label}
                </a>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="font-oswald text-sm font-bold text-white uppercase tracking-wider mb-4">Contacto</h4>
            <div className="space-y-3">
              <a href="mailto:Contacto@LanzLogistics.com" className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors">
                <Mail className="w-4 h-4" /> Contacto@LanzLogistics.com
              </a>
              <a href="tel:+19565158070" className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors">
                <Phone className="w-4 h-4" /> +1 (956) 515-8070
              </a>
              <a href="https://scsecuritysummit.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors">
                <ExternalLink className="w-4 h-4" /> scsecuritysummit.com
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © 2026 SC Security Summit. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <a href="/aviso-de-privacidad" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Aviso de Privacidad
            </a>
            <a href="/terminos-y-condiciones" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Términos y Condiciones
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
