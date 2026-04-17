import { Shield, ArrowRight } from "lucide-react";
import MobileNav from "@/components/MobileNav";
import HeaderScroll from "@/components/HeaderScroll";

const NAV_LINKS = [
  { href: "#enfoque", label: "Enfoque" },
  { href: "#speakers", label: "Conferencistas" },
  { href: "#agenda", label: "Agenda" },
  { href: "#audiencia", label: "Audiencia" },
  { href: "#accesos", label: "Accesos" },
  { href: "#patrocinadores", label: "Patrocinadores" },
  { href: "#ubicacion", label: "Ubicación" },
];

export default function HeaderSection() {
  return (
    <HeaderScroll>
      <header className="fixed top-0 w-full z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[68px] flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-oswald text-lg font-bold tracking-tight text-slate-900">SC SUMMIT</span>
              <span className="block text-[10px] font-bold tracking-[0.2em] text-blue-600">REYNOSA 2026</span>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-4">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="nav-link">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a href="#registro" className="btn-primary hidden sm:inline-flex text-sm">
              REGISTRARME <ArrowRight className="w-4 h-4" />
            </a>
            <MobileNav />
          </div>
        </div>
      </header>
    </HeaderScroll>
  );
}
