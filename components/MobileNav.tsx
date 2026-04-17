"use client";

import { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";

const links = [
  { href: "#enfoque", label: "Enfoque" },
  { href: "#speakers", label: "Conferencistas" },
  { href: "#agenda", label: "Agenda" },
  { href: "#audiencia", label: "Audiencia" },
  { href: "#accesos", label: "Accesos" },
  { href: "#patrocinadores", label: "Patrocinadores" },
  { href: "#ubicacion", label: "Ubicación" },
  { href: "#faq", label: "FAQ" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        className="relative z-50 w-10 h-10 flex items-center justify-center rounded-full border border-[var(--border-light)] hover:bg-[var(--blue-50)] transition-colors"
      >
        {open ? (
          <X className="w-5 h-5 text-[var(--navy)]" />
        ) : (
          <Menu className="w-5 h-5 text-[var(--navy)]" />
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-down panel */}
      <div
        className={`fixed top-[68px] left-4 right-4 z-40 bg-white rounded-2xl shadow-2xl border border-[var(--border-light)] transition-all duration-300 ${
          open
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 -translate-y-4 scale-95 pointer-events-none"
        }`}
      >
        <nav className="p-4 flex flex-col gap-1">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="py-3 px-4 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--blue-600)] hover:bg-[var(--blue-50)] rounded-xl transition-all"
            >
              {link.label}
            </a>
          ))}
          <hr className="my-2 border-[var(--border-lighter)]" />
          <a
            href="#registro"
            onClick={() => setOpen(false)}
            className="btn-primary mt-1 text-sm"
          >
            <span>Registrarme Ahora</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </nav>
      </div>
    </div>
  );
}
