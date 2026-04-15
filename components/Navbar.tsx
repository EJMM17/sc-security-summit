"use client";

import { useState, useEffect } from "react";
import { Menu, X, Shield } from "lucide-react";

const links = [
  { href: "#acerca",         label: "El Evento" },
  { href: "#perfiles",       label: "Participantes" },
  { href: "#networking",     label: "Networking" },
  { href: "#conferencistas", label: "Conferencistas" },
  { href: "#accesos",        label: "Accesos" },
  { href: "#patrocinadores", label: "Patrocinadores" },
];

export default function Navbar() {
  const [open, setOpen]         = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav
      aria-label="Navegación principal"
      style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(12px)",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        transition: "border-color 0.3s",
      }}
    >
      <div style={{
        maxWidth: "var(--max-w)", margin: "0 auto",
        padding: "0 var(--gutter)", height: "64px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: "1.5rem",
      }}>
        {/* Logo */}
        <a href="/" aria-label="SC Security Summit 2026 — Inicio"
          style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, background: "var(--navy)",
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 5, flexShrink: 0,
          }}>
            <Shield size={14} color="#fff" strokeWidth={1.5} />
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              1er Summit · 2026
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "var(--navy)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              SC Security Summit
            </div>
          </div>
        </a>

        {/* Desktop links */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.1rem", flex: 1, justifyContent: "center" }} className="desktop-nav">
          {links.map((l) => (
            <a key={l.href} href={l.href}
              style={{
                fontFamily: "var(--font-body)", fontSize: "0.775rem", fontWeight: 500,
                color: "var(--text-secondary)", textDecoration: "none",
                letterSpacing: "0.01em", padding: "6px 11px", borderRadius: 4,
                transition: "color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--navy)";
                (e.currentTarget as HTMLElement).style.background = "var(--bg-secondary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <a href="/registro" className="desktop-nav"
          style={{
            fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.775rem",
            background: "var(--navy)", color: "#fff", padding: "9px 20px",
            textDecoration: "none", borderRadius: 5, whiteSpace: "nowrap",
            flexShrink: 0, letterSpacing: "0.04em", textTransform: "uppercase",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--navy-mid)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--navy)")}
        >
          Registrarme
        </a>

        {/* Mobile toggle */}
        <button
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open} aria-controls="mobile-menu"
          onClick={() => setOpen(!open)}
          style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: 8, color: "var(--text-primary)", borderRadius: 4 }}
          className="mobile-toggle"
        >
          {open ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" style={{
          position: "fixed", inset: 0, background: "var(--navy-darker)", zIndex: 100,
          display: "flex", flexDirection: "column", justifyContent: "center",
          alignItems: "center", gap: "0.25rem", padding: "2rem",
        }}>
          <button aria-label="Cerrar" onClick={() => setOpen(false)}
            style={{ position: "absolute", top: "1.25rem", right: "1.5rem", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>
            <X size={24} strokeWidth={1.5} />
          </button>
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.4rem", color: "rgba(255,255,255,0.85)", textDecoration: "none", padding: "0.5rem 0", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {l.label}
            </a>
          ))}
          <a href="/registro" onClick={() => setOpen(false)}
            style={{ marginTop: "2rem", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.875rem", background: "var(--steel)", color: "#fff", padding: "13px 40px", textDecoration: "none", borderRadius: 5, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Registrarme ahora
          </a>
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
