"use client";

import { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";

type Language = "es" | "en";

const linksByLanguage: Record<Language, { href: string; label: string }[]> = {
  es: [
    { href: "#enfoque", label: "Enfoque" },
    { href: "#speakers", label: "Conferencistas" },
    { href: "#audiencia", label: "Audiencia" },
    { href: "#accesos", label: "Accesos" },
    { href: "#patrocinadores", label: "Patrocinadores" },
    { href: "#ubicacion", label: "Ubicación" },
    { href: "#faq", label: "FAQ" },
  ],
  en: [
    { href: "#enfoque", label: "Focus" },
    { href: "#speakers", label: "Speakers" },
    { href: "#audiencia", label: "Audience" },
    { href: "#accesos", label: "Passes" },
    { href: "#patrocinadores", label: "Sponsors" },
    { href: "#ubicacion", label: "Location" },
    { href: "#faq", label: "FAQ" },
  ],
};

export default function MobileNav({ language = "es" }: { language?: Language }) {
  const [open, setOpen] = useState(false);
  const links = linksByLanguage[language];
  const menuAriaLabel = language === "en" ? (open ? "Close menu" : "Open menu") : (open ? "Cerrar menú" : "Abrir menú");
  const registerLabel = language === "en" ? "Register now" : "Registrarme Ahora";
  const sponsorLabel = language === "en" ? "Sponsor the event" : "Patrocinar el evento";

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-label={menuAriaLabel}
        aria-expanded={open}
        className="relative z-50 w-11 h-11 flex items-center justify-center rounded-full border border-[var(--border-light)] hover:bg-[var(--blue-50)] transition-colors touch-manipulation"
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
        className={`fixed top-[70px] left-3 right-3 z-40 bg-white rounded-2xl shadow-2xl border border-[var(--border-light)] transition-all duration-300 max-h-[calc(100dvh-84px)] overflow-y-auto safe-pad-bottom ${
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
            <span>{registerLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#patrocinadores"
            onClick={() => setOpen(false)}
            className="mt-2 py-3 px-4 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--blue-600)] hover:bg-[var(--blue-50)] rounded-xl transition-all"
          >
            {sponsorLabel}
          </a>
        </nav>
      </div>
    </div>
  );
}
