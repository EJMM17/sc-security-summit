"use client";

import { useState } from "react";
import { Menu, X, Shield } from "lucide-react";

const links = [
  { href: "#acerca", label: "El Evento" },
  { href: "#conferencistas", label: "Conferencistas" },
  { href: "#patrocinadores", label: "Patrocinadores" },
  { href: "#accesos", label: "Accesos" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav
      aria-label="Navegación principal"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 2rem",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <a
          href="/"
          aria-label="SC Security Summit 2026 — Inicio"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            color: "var(--text-primary)",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: "var(--navy)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 4,
              flexShrink: 0,
            }}
          >
            <Shield size={16} color="#fff" strokeWidth={2} />
          </div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "0.9rem",
              letterSpacing: "-0.01em",
              lineHeight: 1.1,
            }}
          >
            SC SECURITY{" "}
            <span style={{ color: "var(--navy)" }}>SUMMIT</span>
          </span>
          <span
            style={{
              background: "var(--navy)",
              color: "#fff",
              fontSize: "0.6rem",
              fontWeight: 700,
              padding: "2px 6px",
              letterSpacing: "0.08em",
              borderRadius: 2,
            }}
          >
            2026
          </span>
        </a>

        {/* Desktop links */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "2rem" }}
          className="desktop-nav"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "var(--text-secondary)",
                textDecoration: "none",
                letterSpacing: "0.02em",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.color = "var(--navy)")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.color =
                  "var(--text-secondary)")
              }
            >
              {l.label}
            </a>
          ))}
          <a
            href="#accesos"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              background: "var(--navy)",
              color: "#fff",
              padding: "8px 20px",
              textDecoration: "none",
              letterSpacing: "0.03em",
              borderRadius: 4,
              transition: "background 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.background = "var(--navy-dark)")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.background = "var(--navy)")
            }
          >
            Comprar Acceso
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(!open)}
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 8,
            color: "var(--text-primary)",
          }}
          className="mobile-toggle"
        >
          {open ? <X size={22} strokeWidth={1} /> : <Menu size={22} strokeWidth={1} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          style={{
            position: "fixed",
            inset: 0,
            background: "#0f1e3d",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "2rem",
            padding: "2rem",
          }}
        >
          <button
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            style={{
              position: "absolute",
              top: "1.25rem",
              right: "1.5rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <X size={24} strokeWidth={1} />
          </button>
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "1.4rem",
                color: "#fff",
                textDecoration: "none",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#accesos"
            onClick={() => setOpen(false)}
            style={{
              marginTop: "1rem",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: "0.9rem",
              background: "var(--navy)",
              color: "#fff",
              padding: "12px 32px",
              textDecoration: "none",
              borderRadius: 4,
            }}
          >
            Comprar Acceso
          </a>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
