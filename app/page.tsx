import {
  Shield, MapPin, Calendar, Users, CheckCircle, ArrowRight,
  Phone, Mail, Globe, ShieldCheck, Network, Cpu, Cctv,
  Satellite, Lock, Truck, FileText, UserCheck, Package,
  Building2, ChevronRight, X, Handshake, Coffee,
  Presentation, BadgeCheck, TrendingUp, Zap, Star,
} from "lucide-react";
import Navbar from "@/components/Navbar";

// ─── Tokens de contraste ─────────────────────────────────────────────────────
// Sobre fondos oscuros — NUNCA usar < 0.50 para texto informativo
const D1 = "rgba(255,255,255,0.95)";  // títulos / datos clave
const D2 = "rgba(255,255,255,0.72)";  // cuerpo / descripciones
const D3 = "rgba(255,255,255,0.54)";  // labels / metadata

// Superficies en oscuro
const DS1 = "rgba(255,255,255,0.09)"; // cards
const DS2 = "rgba(255,255,255,0.06)"; // separadores
const DB  = "rgba(255,255,255,0.12)"; // bordes

// ─── Layout helpers ──────────────────────────────────────────────────────────
const ctr: React.CSSProperties = {
  maxWidth: "var(--max-w)",
  margin: "0 auto",
  padding: "0 var(--gutter)",
};

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p style={{
      fontFamily: "var(--font-body)", fontWeight: 600,
      fontSize: "0.68rem", letterSpacing: "0.2em",
      textTransform: "uppercase" as const,
      color: light ? D3 : "var(--steel)",
      margin: "0 0 0.875rem",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <span style={{ width: 18, height: 1.5, background: light ? DB : "var(--steel)", display: "inline-block", flexShrink: 0 }} />
      {children}
    </p>
  );
}

function H2({
  children, light = false, center = false,
}: { children: React.ReactNode; light?: boolean; center?: boolean }) {
  return (
    <h2 style={{
      fontFamily: "var(--font-display)", fontWeight: 700,
      fontSize: "clamp(2rem, 3.5vw, 3rem)",
      letterSpacing: "0.02em", textTransform: "uppercase" as const,
      lineHeight: 1.05,
      color: light ? D1 : "var(--text-primary)",
      margin: "0 0 1.25rem",
      textAlign: center ? "center" as const : "left" as const,
    }}>
      {children}
    </h2>
  );
}

function Lead({
  children, light = false, center = false,
}: { children: React.ReactNode; light?: boolean; center?: boolean }) {
  return (
    <p style={{
      fontFamily: "var(--font-body)", fontSize: "0.9375rem", fontWeight: 400,
      lineHeight: 1.8,
      color: light ? D2 : "var(--text-secondary)",
      margin: 0,
      textAlign: center ? "center" as const : "left" as const,
    }}>
      {children}
    </p>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main-content">

        {/* ══════════════════════════════════════
            HERO
        ══════════════════════════════════════ */}
        <section
          aria-labelledby="hero-heading"
          style={{
            background: "var(--navy-darker)",
            padding: "7.5rem 0 6rem",
            position: "relative", overflow: "hidden",
            minHeight: "90vh", display: "flex", alignItems: "center",
          }}
        >
          {/* Fondo fotográfico simulado */}
          <div aria-hidden="true" style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(135deg, #060f27 0%, #0c1d44 50%, #060f27 100%)",
            zIndex: 0,
          }} />
          {/* Grid sutil */}
          <div aria-hidden="true" style={{
            position: "absolute", inset: 0,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 1,
          }} />
          {/* Glow */}
          <div aria-hidden="true" style={{
            position: "absolute", top: "-20%", right: "-5%",
            width: 700, height: 700,
            background: "radial-gradient(circle, rgba(30,86,196,0.2) 0%, transparent 60%)",
            pointerEvents: "none", zIndex: 1,
          }} />
          {/* Faja lateral izquierda */}
          <div aria-hidden="true" style={{
            position: "absolute", left: 0, top: 0, bottom: 0,
            width: 4, background: "var(--steel)", zIndex: 2,
          }} />

          <div style={{ ...ctr, position: "relative", zIndex: 3, width: "100%" }}>
            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              border: `1px solid ${DB}`, background: DS1,
              borderRadius: 3, padding: "5px 14px", marginBottom: "2.5rem",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--steel-pale)", display: "inline-block" }} />
              <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.68rem", color: "var(--steel-pale)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                Primera Edición · Reynosa, Tamaulipas
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "5rem", alignItems: "center" }} className="hero-grid">
              {/* Headline */}
              <div>
                {/* H1 en tres partes con Oswald */}
                <div style={{ marginBottom: "2rem" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(2.8rem, 7vw, 5.75rem)", letterSpacing: "0.02em", textTransform: "uppercase", lineHeight: 0.97, color: D1 }}>
                    1er Summit de
                  </div>
                  <div style={{
                    fontFamily: "var(--font-display)", fontWeight: 700,
                    fontSize: "clamp(2.8rem, 7vw, 5.75rem)", letterSpacing: "0.02em",
                    textTransform: "uppercase", lineHeight: 0.97,
                    color: "transparent",
                    backgroundImage: "linear-gradient(90deg, var(--steel-pale) 0%, #c3d9ff 100%)",
                    WebkitBackgroundClip: "text", backgroundClip: "text",
                  }}>
                    Seguridad en la
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(2.8rem, 7vw, 5.75rem)", letterSpacing: "0.02em", textTransform: "uppercase", lineHeight: 0.97, color: D1 }}>
                    Cadena de Suministros
                  </div>
                </div>

                <div style={{ width: 48, height: 2, background: "var(--steel)", marginBottom: "1.75rem" }} />

                <p style={{ fontFamily: "var(--font-body)", fontSize: "1.075rem", fontWeight: 400, color: D2, lineHeight: 1.8, maxWidth: 520, marginBottom: "2.75rem" }}>
                  El encuentro de negocios donde la seguridad operativa, el cumplimiento internacional y la innovación tecnológica convergen para fortalecer la industria del norte de México.
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.875rem", marginBottom: "3.5rem" }}>
                  <a href="#accesos" style={{
                    fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.85rem",
                    background: "var(--steel)", color: "#fff", padding: "14px 32px",
                    textDecoration: "none", borderRadius: 5,
                    display: "inline-flex", alignItems: "center", gap: 8,
                    letterSpacing: "0.06em", textTransform: "uppercase",
                  }}>
                    Registrarme Ahora <ArrowRight size={15} strokeWidth={2} />
                  </a>
                  <a href="#patrocinadores" style={{
                    fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.85rem",
                    color: D2, padding: "14px 26px", textDecoration: "none", borderRadius: 5,
                    border: `1px solid ${DB}`,
                  }}>
                    Patrocinar el Evento
                  </a>
                </div>

                {/* Meta strip */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "2.5rem", paddingTop: "2rem", borderTop: `1px solid ${DS2}` }}>
                  {[
                    { icon: <Calendar size={13} color="var(--steel-pale)" strokeWidth={1.5} />, label: "Fecha",    value: "24–25 Sep 2026" },
                    { icon: <MapPin   size={13} color="var(--steel-pale)" strokeWidth={1.5} />, label: "Sede",     value: "Centro de Convenciones, Reynosa" },
                    { icon: <Users    size={13} color="var(--steel-pale)" strokeWidth={1.5} />, label: "Organiza", value: "Lanz Logistics + Thynk Unlimited" },
                  ].map((m) => (
                    <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {m.icon}
                      <div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 600, color: D3, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                          {m.label}
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: D2 }}>
                          {m.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats panel */}
              <div className="hero-stats" style={{
                background: DS1, border: `1px solid ${DB}`,
                borderRadius: 10, padding: "2rem 1.75rem",
              }}>
                <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.62rem", color: D3, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "1.75rem", paddingBottom: "1.25rem", borderBottom: `1px solid ${DS2}` }}>
                  El evento en cifras
                </p>
                {[
                  { num: "2",   label: "Días de capacitación" },
                  { num: "10+", label: "Conferencias y workshops" },
                  { num: "4",   label: "Sesiones de Business Hub" },
                  { num: "3",   label: "Países con visión binacional" },
                ].map((s, i, arr) => (
                  <div key={s.label} style={{
                    display: "flex", alignItems: "baseline", gap: 12,
                    paddingBottom: i < arr.length - 1 ? "1.4rem" : 0,
                    marginBottom:  i < arr.length - 1 ? "1.4rem" : 0,
                    borderBottom:  i < arr.length - 1 ? `1px solid ${DS2}` : "none",
                  }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2.5rem", color: D1, lineHeight: 1, letterSpacing: "0.02em", minWidth: 72 }}>
                      {s.num}
                    </div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 400, color: D2, lineHeight: 1.4 }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <style>{`
            @media (max-width:960px){ .hero-grid { grid-template-columns: 1fr !important; gap: 3rem !important; } .hero-stats { display: none !important; } }
          `}</style>
        </section>

        {/* ══════════════════════════════════════
            BARRA DE SEDE
        ══════════════════════════════════════ */}
        <section aria-label="Sede del evento" style={{ background: "var(--navy)", padding: "2rem 0", borderBottom: `1px solid ${DS2}` }}>
          <div style={{ ...ctr, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1.5rem" }} className="sede-bar">
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
              <div style={{ width: 42, height: 42, background: DS1, border: `1px solid ${DB}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MapPin size={18} color="var(--steel-pale)" strokeWidth={1.5} />
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.6rem", color: D3, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 4 }}>
                  Sede del Evento
                </p>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: D1, letterSpacing: "0.04em", textTransform: "uppercase", margin: 0 }}>
                  Centro de Convenciones de Reynosa
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 400, color: D2, margin: 0 }}>
                  Reynosa, Tamaulipas, México · A 10 min de la frontera con Texas
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              {[
                { icon: <Calendar size={13} strokeWidth={1.5} />, label: "24–25 Sep 2026" },
                { icon: <Users    size={13} strokeWidth={1.5} />, label: "8:00 am – 6:00 pm" },
                { icon: <Shield   size={13} strokeWidth={1.5} />, label: "Aforo controlado" },
              ].map((i) => (
                <div key={i.label} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: D2 }}>
                  <span style={{ color: "var(--steel-pale)" }}>{i.icon}</span>
                  {i.label}
                </div>
              ))}
            </div>
          </div>
          <style>{`@media (max-width:768px){ .sede-bar { flex-direction: column !important; align-items: flex-start !important; } }`}</style>
        </section>

        {/* ══════════════════════════════════════
            TRES PILARES
        ══════════════════════════════════════ */}
        <section id="acerca" aria-labelledby="pilares-heading" style={{ padding: "var(--section-py) 0", background: "var(--bg-primary)" }}>
          <div style={ctr}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.9fr", gap: "5rem", alignItems: "start" }} className="pilares-intro">
              <div>
                <Eyebrow>Enfoque del Evento</Eyebrow>
                <H2>Por qué asistir</H2>
                <div style={{ width: 32, height: 2, background: "var(--steel)", marginBottom: "1.5rem" }} />
                <Lead>
                  Dos días de actualización, vinculación y soluciones tecnológicas pensados para los profesionales que protegen y hacen competitiva la cadena de suministro industrial.
                </Lead>
                <div style={{ marginTop: "2rem", padding: "1.5rem", background: "var(--steel-muted)", borderRadius: 8, borderLeft: "3px solid var(--steel)" }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", fontWeight: 400, color: "var(--text-secondary)", lineHeight: 1.8, margin: 0 }}>
                    <strong style={{ color: "var(--navy)", fontWeight: 600 }}>El punto de encuentro</strong> donde convergen actualización estratégica, vinculación empresarial y soluciones aplicadas para fortalecer la seguridad, el cumplimiento y la competitividad de los sectores clave de la cadena de suministro.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
                {[
                  {
                    num: "01",
                    icon: <BadgeCheck size={22} color="var(--steel)" strokeWidth={1.5} />,
                    title: "Actualización Estratégica",
                    body: "Contenido de alto valor sobre estándares internacionales, comercio exterior, gestión de riesgos y cumplimiento operativo. Con enfoque en los desafíos actuales de una cadena de suministro segura, eficiente y competitiva.",
                    tags: ["Tendencias regulatorias", "Mejores prácticas", "Riesgos y controles", "Perspectiva aplicada"],
                  },
                  {
                    num: "02",
                    icon: <Handshake size={22} color="var(--steel)" strokeWidth={1.5} />,
                    title: "Vinculación Empresarial B2B",
                    body: "Espacio diseñado para conectar empresas, especialistas, proveedores y tomadores de decisión, impulsar relaciones de negocio y generar alianzas estratégicas dentro de un entorno altamente especializado.",
                    tags: ["Networking B2B", "Generación de leads", "Conexión sectorial", "Oportunidades comerciales"],
                  },
                  {
                    num: "03",
                    icon: <TrendingUp size={22} color="var(--steel)" strokeWidth={1.5} />,
                    title: "Soluciones e Innovación",
                    body: "Exposición de soluciones para la cadena de suministro segura: videovigilancia, GPS, ciberseguridad, control de acceso y software de trazabilidad. Casos de aplicación real en el entorno maquilador.",
                    tags: ["Videovigilancia", "GPS y telemetría", "Ciberseguridad logística", "Trazabilidad"],
                  },
                ].map((p) => (
                  <div key={p.title} style={{ background: "#fff", padding: "2rem 2.25rem", display: "grid", gridTemplateColumns: "auto 1fr", gap: "1.25rem", alignItems: "start" }}>
                    <div style={{ width: 44, height: 44, background: "var(--steel-muted)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {p.icon}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", margin: 0, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                          {p.title}
                        </h3>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--border-strong)", letterSpacing: "0.06em" }}>
                          {p.num}
                        </span>
                      </div>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", fontWeight: 400, color: "var(--text-secondary)", lineHeight: 1.75, margin: "0 0 0.875rem" }}>
                        {p.body}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                        {p.tags.map((tag) => (
                          <span key={tag} style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 500, color: "var(--steel)", background: "var(--steel-muted)", padding: "3px 10px", borderRadius: 20 }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <style>{`@media (max-width:960px){ .pilares-intro { grid-template-columns: 1fr !important; gap: 2.5rem !important; } }`}</style>
        </section>

        {/* ══════════════════════════════════════
            SALA DE NETWORKING
        ══════════════════════════════════════ */}
        <section id="networking" aria-labelledby="networking-heading" style={{ padding: "var(--section-py) 0", background: "var(--navy-darker)", position: "relative", overflow: "hidden" }}>
          <div aria-hidden="true" style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(150deg, #060f27 0%, #0e1e4a 50%, #060f27 100%)",
            zIndex: 0,
          }} />
          <div aria-hidden="true" style={{
            position: "absolute", bottom: "-10%", right: "-5%",
            width: 500, height: 500,
            background: "radial-gradient(circle, rgba(30,86,196,0.18) 0%, transparent 65%)",
            pointerEvents: "none", zIndex: 1,
          }} />
          {/* Línea top */}
          <div aria-hidden="true" style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 3,
            background: "linear-gradient(90deg, transparent 0%, var(--steel) 30%, var(--steel-light) 70%, transparent 100%)",
            zIndex: 2,
          }} />

          <div style={{ ...ctr, position: "relative", zIndex: 3 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "center" }} className="networking-grid">
              {/* Texto */}
              <div>
                <Eyebrow light>Oportunidad Comercial</Eyebrow>
                <H2 light>Sala de Networking & Business Hub</H2>
                <div style={{ width: 32, height: 2, background: "var(--steel)", marginBottom: "1.75rem" }} />
                <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", fontWeight: 400, color: D2, lineHeight: 1.85, marginBottom: "1.25rem" }}>
                  Un espacio físico dedicado al encuentro de negocios dentro del evento. Diseñado para conectar compradores, proveedores y decisores de la industria en reuniones cara a cara de alto valor.
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: 400, color: D2, lineHeight: 1.8, marginBottom: "2.5rem" }}>
                  Opera durante los dos días del evento con agenda abierta, mesas de trabajo y zonas de reunión asignadas. Es el corazón comercial del Summit.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {[
                    { icon: <Handshake  size={18} color="var(--steel-pale)" strokeWidth={1.5} />, title: "Reuniones 1:1",         desc: "Agenda tu reunión con proveedores o clientes clave del sector." },
                    { icon: <Users      size={18} color="var(--steel-pale)" strokeWidth={1.5} />, title: "Networking dirigido",    desc: "Conexión entre empresas por perfil e industria." },
                    { icon: <Zap        size={18} color="var(--steel-pale)" strokeWidth={1.5} />, title: "Leads calificados",      desc: "Contactos verificados con autoridad de decisión real." },
                    { icon: <Coffee     size={18} color="var(--steel-pale)" strokeWidth={1.5} />, title: "Coffee break incluido",  desc: "Ambiente diseñado para conversaciones de negocio." },
                  ].map((f) => (
                    <div key={f.title} style={{ padding: "1.25rem", background: DS1, border: `1px solid ${DB}`, borderRadius: 8 }}>
                      <div style={{ marginBottom: 8 }}>{f.icon}</div>
                      <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.875rem", color: D1, marginBottom: 5 }}>{f.title}</div>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 400, color: D2, lineHeight: 1.6 }}>{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ background: "rgba(30,86,196,0.16)", border: "1px solid rgba(91,154,248,0.28)", borderRadius: 12, padding: "2.5rem" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", color: "var(--steel-pale)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1.5rem" }}>
                    Lo que encontrarás en la sala
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                    {[
                      { icon: <Building2    size={16} strokeWidth={1.5} />, text: "Mesas de trabajo B2B con zonas asignadas por industria" },
                      { icon: <Presentation size={16} strokeWidth={1.5} />, text: "Área de presentación de soluciones para proveedores" },
                      { icon: <Users        size={16} strokeWidth={1.5} />, text: "Directorio digital de asistentes verificados" },
                      { icon: <Network      size={16} strokeWidth={1.5} />, text: "Conexión con compradores, gerentes y directores de operaciones" },
                      { icon: <Star         size={16} strokeWidth={1.5} />, text: "Acceso prioritario VIP — sin fila ni espera" },
                      { icon: <Coffee       size={16} strokeWidth={1.5} />, text: "Coffee break con servicio durante las sesiones" },
                    ].map((item) => (
                      <li key={item.text} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <span style={{ color: "var(--steel-pale)", marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", fontWeight: 400, color: D2, lineHeight: 1.65 }}>
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
                  {[
                    { num: "4",    label: "Sesiones de networking" },
                    { num: "2",    label: "Días de Business Hub" },
                    { num: "300+", label: "Asistentes esperados" },
                  ].map((s) => (
                    <div key={s.label} style={{ textAlign: "center", background: DS1, border: `1px solid ${DB}`, borderRadius: 8, padding: "1.25rem 0.75rem" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.875rem", color: D1, letterSpacing: "0.02em", lineHeight: 1 }}>
                        {s.num}
                      </div>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 400, color: D2, lineHeight: 1.4, marginTop: 6 }}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                <a href="#accesos" style={{
                  display: "block", textAlign: "center", padding: "14px 20px",
                  background: "var(--steel)", borderRadius: 6,
                  fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.85rem",
                  color: "#fff", textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase",
                }}>
                  Reservar mi lugar en el Networking
                </a>
              </div>
            </div>
          </div>
          <style>{`@media (max-width:960px){ .networking-grid { grid-template-columns: 1fr !important; } }`}</style>
        </section>

        {/* ══════════════════════════════════════
            PERFILES
        ══════════════════════════════════════ */}
        <section id="perfiles" aria-labelledby="perfiles-heading" style={{ padding: "var(--section-py) 0", background: "var(--bg-secondary)" }}>
          <div style={ctr}>
            <div style={{ maxWidth: 560, marginBottom: "4rem" }}>
              <Eyebrow>Participantes</Eyebrow>
              <H2>¿A quién va dirigido?</H2>
              <Lead>
                Para quienes mueven, protegen y fortalecen la cadena de suministro. Un punto de encuentro para líderes, especialistas y tomadores de decisión en áreas clave como operaciones, logística, transporte, aduanas, seguridad patrimonial y comercio exterior.
              </Lead>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="perfiles-grid">
              {/* Asistentes */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: "var(--navy-darker)", padding: "1.75rem 2rem" }}>
                  <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.62rem", color: D3, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 10 }}>
                    Perfil de Asistentes
                  </p>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: D1, margin: "0 0 0.5rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Directivos y Especialistas
                  </h3>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.84rem", fontWeight: 400, color: D2, margin: 0, lineHeight: 1.7 }}>
                    Mandos con autoridad de compra o influencia en decisiones operativas de cadena de suministro.
                  </p>
                </div>
                <div>
                  {[
                    { icon: <Building2 size={15} color="var(--steel)" strokeWidth={1.5} />, label: "Operaciones y Cadena de Suministro",   desc: "Directores, gerentes, jefaturas y coordinaciones de operación, supply chain y mejora operativa." },
                    { icon: <Truck     size={15} color="var(--steel)" strokeWidth={1.5} />, label: "Logística, Transporte y Almacén",       desc: "Responsables de logística, tráfico, transporte, distribución y almacenaje." },
                    { icon: <FileText  size={15} color="var(--steel)" strokeWidth={1.5} />, label: "Comercio Exterior y Aduanas",           desc: "Profesionales de import-export, aduanas y cumplimiento aduanero." },
                    { icon: <UserCheck size={15} color="var(--steel)" strokeWidth={1.5} />, label: "Seguridad, Compliance y Auditoría",     desc: "Líderes de seguridad patrimonial, certificaciones internacionales, auditoría y control interno." },
                    { icon: <Package   size={15} color="var(--steel)" strokeWidth={1.5} />, label: "Compras y Abastecimiento",              desc: "Personal con influencia en decisiones de compra y selección de proveedores." },
                    { icon: <Cpu       size={15} color="var(--steel)" strokeWidth={1.5} />, label: "Sistemas y Tecnología",                 desc: "Responsables de sistemas, monitoreo, trazabilidad e innovación operativa." },
                  ].map((b, idx, arr) => (
                    <div key={b.label} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "0.9rem 2rem", borderBottom: idx < arr.length - 1 ? "1px solid var(--bg-secondary)" : "none" }}>
                      <div style={{ width: 30, height: 30, background: "var(--steel-muted)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        {b.icon}
                      </div>
                      <div>
                        <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", marginBottom: 2 }}>{b.label}</div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 400, color: "var(--text-tertiary)", lineHeight: 1.6 }}>{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proveedores */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: "var(--navy-mid)", padding: "1.75rem 2rem" }}>
                  <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.62rem", color: D3, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 10 }}>
                    Proveedores de Soluciones
                  </p>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: D1, margin: "0 0 0.5rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Empresas Especializadas
                  </h3>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.84rem", fontWeight: 400, color: D2, margin: 0, lineHeight: 1.7 }}>
                    Con soluciones para seguridad y eficiencia de la cadena de suministro industrial y logística.
                  </p>
                </div>
                <div>
                  {[
                    { icon: <Truck       size={15} color="var(--steel)" strokeWidth={1.5} />, label: "Empresas Transportistas",   desc: "Operación segura, monitoreo y trazabilidad para carga y rutas." },
                    { icon: <FileText    size={15} color="var(--steel)" strokeWidth={1.5} />, label: "Agencias Aduanales",         desc: "Representación aduanal, cumplimiento y soporte operativo." },
                    { icon: <Cctv        size={15} color="var(--steel)" strokeWidth={1.5} />, label: "Videovigilancia y CCTV",     desc: "Tecnologías de monitoreo para planta, patio y transporte." },
                    { icon: <Satellite   size={15} color="var(--steel)" strokeWidth={1.5} />, label: "GPS y Telemetría",           desc: "Rastreo, visibilidad y control de unidades y carga." },
                    { icon: <Lock        size={15} color="var(--steel)" strokeWidth={1.5} />, label: "Control de Acceso",          desc: "Biometría, RFID y protección perimetral." },
                    { icon: <ShieldCheck size={15} color="var(--steel)" strokeWidth={1.5} />, label: "Consultoría Especializada",  desc: "Diagnóstico, capacitación y acompañamiento en certificaciones de seguridad." },
                  ].map((b, idx, arr) => (
                    <div key={b.label} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "0.9rem 2rem", borderBottom: idx < arr.length - 1 ? "1px solid var(--bg-secondary)" : "none" }}>
                      <div style={{ width: 30, height: 30, background: "var(--steel-muted)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        {b.icon}
                      </div>
                      <div>
                        <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", marginBottom: 2 }}>{b.label}</div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 400, color: "var(--text-tertiary)", lineHeight: 1.6 }}>{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <style>{`@media (max-width:900px){ .perfiles-grid { grid-template-columns: 1fr !important; } }`}</style>
        </section>

        {/* ══════════════════════════════════════
            CONFERENCISTAS
        ══════════════════════════════════════ */}
        <section id="conferencistas" aria-labelledby="speakers-heading" style={{ padding: "var(--section-py) 0", background: "var(--bg-primary)" }}>
          <div style={ctr}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "2rem", marginBottom: "4rem", flexWrap: "wrap" }}>
              <div style={{ maxWidth: 460 }}>
                <Eyebrow>Conferencistas Confirmados</Eyebrow>
                <H2>Expertos verificables en el sector</H2>
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", fontWeight: 400, color: "var(--text-secondary)", maxWidth: 280, lineHeight: 1.75, textAlign: "right" }} className="speakers-desc">
                Especialistas de primer nivel en estándares internacionales, comercio exterior, cumplimiento operativo e innovación estratégica.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.25rem" }} className="speakers-grid">
              {[
                { name: "Fidel Guerrero",     role: "Subdirector, Comité Nacional de Aduanas y Comercio Exterior", org: "INDEX",                            tag: "Aduanas & Comercio Exterior", bio: "Trayectoria comprobada en importación y exportación. Especialista en negociación internacional y cumplimiento aduanero." },
                { name: "Isidoro Juárez",    role: "Mandatario Aduanal Certificado",                                org: "Comercio Exterior",                tag: "Aduanas & Compliance",        bio: "Experto en clasificación arancelaria, IMMEX, PROSEC y representación aduanera. Ponente en foros nacionales." },
                { name: "Julio César Suárez", role: "Líder en Trade Compliance e Innovación",                       org: "Ex-Eaton / BorgWarner / Brunswick", tag: "Trade Compliance",            bio: "Especialista en cumplimiento operativo, controles de exportación e Incoterms. Trayectoria en manufactura de clase mundial." },
                { name: "Eduardo Luna",      role: "Especialista en Innovación Estratégica",                        org: "Harvard Teaching Certified",       tag: "Innovación & Aprendizaje",    bio: "Experto en design thinking, investigación aplicada y diseño de experiencias de aprendizaje organizacional." },
              ].map((s) => (
                <article key={s.name} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ height: 3, background: "linear-gradient(90deg, var(--navy) 0%, var(--steel) 100%)" }} />
                  <div style={{ padding: "1.75rem", flex: 1 }}>
                    {/* Iniciales como avatar */}
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--steel-muted)", border: "2px solid var(--steel-border)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--steel)", letterSpacing: "0.05em" }}>
                        {s.name.split(" ").map((w: string) => w[0]).slice(0,2).join("")}
                      </span>
                    </div>
                    <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.62rem", color: "var(--steel)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>
                      {s.tag}
                    </p>
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", margin: "0 0 4px", letterSpacing: "0.02em", textTransform: "uppercase" }}>
                      {s.name}
                    </h3>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4, lineHeight: 1.45 }}>
                      {s.role}
                    </p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--steel)", fontWeight: 500, marginBottom: "1.25rem" }}>
                      {s.org}
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 400, color: "var(--text-tertiary)", lineHeight: 1.7, margin: 0, borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                      {s.bio}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <style>{`
              @media (max-width:960px){ .speakers-grid { grid-template-columns: repeat(2,1fr) !important; } .speakers-desc { text-align: left !important; } }
              @media (max-width:560px){ .speakers-grid { grid-template-columns: 1fr !important; } }
            `}</style>
          </div>
        </section>

        {/* ══════════════════════════════════════
            ACCESOS / PRICING
            Fondo navy-darker → todo texto usa D1/D2/D3
        ══════════════════════════════════════ */}
        <section id="accesos" aria-labelledby="pricing-heading" style={{ padding: "var(--section-py) 0", background: "var(--navy-darker)", position: "relative", overflow: "hidden" }}>
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />
          <div aria-hidden="true" style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 400, background: "radial-gradient(ellipse, rgba(30,86,196,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ ...ctr, position: "relative" }}>
            <div style={{ maxWidth: 480, margin: "0 auto 4rem", textAlign: "center" }}>
              <Eyebrow light>Accesos al Evento</Eyebrow>
              <H2 light center>Elige tu tipo de acceso</H2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9375rem", fontWeight: 400, color: D2, lineHeight: 1.8, textAlign: "center" }}>
                Dos días de capacitación especializada · 24 y 25 de septiembre de 2026<br />Centro de Convenciones, Reynosa
              </p>
            </div>

            {/* Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.25rem", maxWidth: 960, margin: "0 auto 3.5rem" }} className="pricing-grid">

              {/* Estudiante */}
              <article aria-label="Acceso Estudiante" style={{ background: DS1, border: `1px solid ${DB}`, borderRadius: 10, padding: "2rem", display: "flex", flexDirection: "column" }}>
                <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.62rem", color: D3, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
                  Acceso Estudiante
                </p>
                <div style={{ marginBottom: "1.75rem" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2.6rem", color: D1, letterSpacing: "0.02em" }}>$1,200</span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: D3, marginLeft: 6 }}>MXN</span>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 400, color: D3, marginTop: 4 }}>Requiere credencial vigente</div>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
                  {[
                    [true,    "Acceso a capacitación (2 días)"],
                    [true,    "Acceso a paneles"],
                    [true,    "Gafete y kit básico"],
                    [true,    "Material mínimo"],
                    ["extra", "Constancia de participación (costo extra)"],
                    [false,   "Sala de Networking / Business Hub"],
                    [false,   "Asiento preferente"],
                    [false,   "Workshop práctico"],
                    [false,   "Coffee break"],
                  ].map(([ok, t]) => (
                    <li key={t as string} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: "0.82rem", fontFamily: "var(--font-body)", fontWeight: 400, color: ok === false ? D3 : D2 }}>
                      {ok === false
                        ? <X size={13} color={D3} strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
                        : <CheckCircle size={13} color="var(--steel-pale)" strokeWidth={1.5} style={{ marginTop: 2, flexShrink: 0 }} />}
                      {t as string}
                    </li>
                  ))}
                </ul>
                <a href="/registro?acceso=estudiante" style={{ display: "block", textAlign: "center", padding: "11px 20px", border: `1px solid ${DB}`, borderRadius: 6, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.82rem", color: D2, textDecoration: "none", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Registrarme
                </a>
              </article>

              {/* General — destacado */}
              <article aria-label="Acceso General — Recomendado" style={{ background: "#fff", border: "2px solid var(--steel)", borderRadius: 10, display: "flex", flexDirection: "column", position: "relative", transform: "translateY(-10px)", boxShadow: "0 28px 60px rgba(0,0,0,0.5)" }}>
                <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "var(--steel)", color: "#fff", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.6rem", padding: "4px 16px", borderRadius: 20, whiteSpace: "nowrap", letterSpacing: "0.16em", textTransform: "uppercase" }}>
                  Recomendado
                </div>
                <div style={{ padding: "2.25rem 2rem 2rem" }}>
                  <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.62rem", color: "var(--steel)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
                    Acceso General
                  </p>
                  <div style={{ marginBottom: "1.75rem" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2.6rem", color: "var(--navy)", letterSpacing: "0.02em" }}>$5,800</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--text-tertiary)", marginLeft: 6 }}>MXN</span>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 400, color: "var(--text-tertiary)", marginTop: 4 }}>Profesionales y empresas</div>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
                    {[
                      "Acceso 2 días (conferencias y paneles)",
                      "Gafete y kit profesional (digital + impreso)",
                      "Constancia de participación digital",
                      "Acceso a área de exhibición",
                      "Acceso a Sala de Networking / Business Hub",
                      "Coffee break incluido",
                    ].map((t) => (
                      <li key={t} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: "0.82rem", fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                        <CheckCircle size={13} color="var(--steel)" strokeWidth={1.5} style={{ marginTop: 2, flexShrink: 0 }} />
                        {t}
                      </li>
                    ))}
                  </ul>
                  <a href="/registro?acceso=general" style={{ display: "block", textAlign: "center", padding: "13px 20px", background: "var(--navy)", borderRadius: 6, fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.85rem", color: "#fff", textDecoration: "none", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Comprar Acceso
                  </a>
                </div>
              </article>

              {/* VIP */}
              <article aria-label="Acceso VIP" style={{ background: "rgba(30,86,196,0.14)", border: "1px solid rgba(91,154,248,0.28)", borderRadius: 10, padding: "2rem", display: "flex", flexDirection: "column" }}>
                <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.62rem", color: "var(--steel-pale)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
                  Acceso VIP
                </p>
                <div style={{ marginBottom: "1.75rem" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2.6rem", color: D1, letterSpacing: "0.02em" }}>$7,200</span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: D3, marginLeft: 6 }}>MXN</span>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 400, color: D3, marginTop: 4 }}>Máxima experiencia en el evento</div>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
                  {[
                    "Todo lo incluido en General",
                    "Fast check-in + gafete premium",
                    "Asiento preferente y acceso prioritario",
                    "Sala de Networking (acceso prioritario)",
                    "Material descargable + plantillas",
                    "Workshop práctico incluido",
                    "Coffee break los 2 días",
                  ].map((t) => (
                    <li key={t} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: "0.82rem", fontFamily: "var(--font-body)", fontWeight: 400, color: D2 }}>
                      <CheckCircle size={13} color="var(--steel-pale)" strokeWidth={1.5} style={{ marginTop: 2, flexShrink: 0 }} />
                      {t}
                    </li>
                  ))}
                </ul>
                <a href="/registro?acceso=vip" style={{ display: "block", textAlign: "center", padding: "12px 20px", background: "rgba(91,154,248,0.16)", border: "1px solid rgba(91,154,248,0.3)", borderRadius: 6, fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.85rem", color: "var(--steel-pale)", textDecoration: "none", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Comprar VIP
                </a>
              </article>
            </div>

            {/* ── Tabla comparativa REDISEÑADA ──
                Fondo blanco sólido → contraste máximo, sin opacidades
            ── */}
            <div style={{ maxWidth: 960, margin: "0 auto 2.5rem", background: "#fff", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ background: "var(--navy)", padding: "1.25rem 1.5rem" }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", color: D1, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
                  Comparación de beneficios incluidos
                </p>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)", fontSize: "0.84rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-secondary)" }}>
                    <th style={{ padding: "0.875rem 1.5rem", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>
                      Beneficio
                    </th>
                    {[
                      { label: "VIP",        price: "$7,200", color: "var(--navy)" },
                      { label: "General",    price: "$5,800", color: "var(--navy)" },
                      { label: "Estudiante", price: "$1,200", color: "var(--text-secondary)" },
                    ].map((col) => (
                      <th key={col.label} style={{ padding: "0.875rem 1.5rem", textAlign: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: col.color, letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                        {col.label}
                        <div style={{ fontFamily: "var(--font-mono)", fontWeight: 400, fontSize: "0.7rem", color: "var(--text-tertiary)", marginTop: 2, textTransform: "none", letterSpacing: 0 }}>{col.price} MXN</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { b: "Acceso a capacitación (2 días)",         v: true,               g: true,       e: true },
                    { b: "Acceso a paneles",                       v: true,               g: true,       e: true },
                    { b: "Gafete y pulsera",                       v: "fast check-in",    g: "incluido", e: "básico" },
                    { b: "Material impreso / kit",                 v: "premium",          g: "estándar", e: "mínimo" },
                    { b: "Constancia de participación",            v: "digital + físico", g: "digital",  e: "costo extra" },
                    { b: "Sala de Networking / Business Hub",      v: "prioridad",        g: "incluido", e: false },
                    { b: "Asiento preferente",                     v: true,               g: false,      e: false },
                    { b: "Acceso prioritario (preguntas / filas)", v: true,               g: false,      e: false },
                    { b: "Material descargable + plantillas",      v: true,               g: false,      e: false },
                    { b: "Workshop práctico",                      v: true,               g: false,      e: false },
                    { b: "Coffee break 2 días",                    v: true,               g: false,      e: false },
                  ].map((row, idx) => {
                    const cell = (val: boolean | string) => {
                      if (val === false) return <span style={{ color: "var(--border-strong)", fontSize: "1rem" }}>—</span>;
                      if (val === true)  return <CheckCircle size={16} color="var(--steel)" strokeWidth={2} />;
                      return <span style={{ color: "var(--steel)", fontSize: "0.78rem", fontWeight: 600 }}>{val}</span>;
                    };
                    return (
                      <tr key={row.b} style={{ background: idx % 2 === 0 ? "#fff" : "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "0.8rem 1.5rem", color: "var(--text-secondary)", fontWeight: 400 }}>{row.b}</td>
                        <td style={{ padding: "0.8rem 1.5rem", textAlign: "center" }}>{cell(row.v)}</td>
                        <td style={{ padding: "0.8rem 1.5rem", textAlign: "center" }}>{cell(row.g)}</td>
                        <td style={{ padding: "0.8rem 1.5rem", textAlign: "center" }}>{cell(row.e)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: "0.84rem", fontWeight: 400, color: D3 }}>
              ¿Requieres factura o registro grupal?{" "}
              <a href="mailto:Contacto@LanzLogistics.com" style={{ color: "var(--steel-pale)", fontFamily: "var(--font-mono)", fontSize: "0.78rem", textDecoration: "none" }}>Contacto@LanzLogistics.com</a>
              {" "}·{" "}
              <a href="tel:+19565158070" style={{ color: "var(--steel-pale)", fontFamily: "var(--font-mono)", fontSize: "0.78rem", textDecoration: "none" }}>+1 956 515 8070</a>
            </p>

            <style>{`
              @media (max-width:900px){
                .pricing-grid { grid-template-columns: 1fr !important; max-width: 420px !important; }
                .pricing-grid > article:nth-child(2) { transform: none !important; box-shadow: none !important; }
              }
            `}</style>
          </div>
        </section>

        {/* ══════════════════════════════════════
            PATROCINADORES
        ══════════════════════════════════════ */}
        <section id="patrocinadores" aria-labelledby="sponsors-heading" style={{ padding: "var(--section-py) 0", background: "var(--bg-primary)" }}>
          <div style={ctr}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "start", marginBottom: "4rem" }} className="sponsors-intro">
              <div>
                <Eyebrow>Oportunidades Comerciales</Eyebrow>
                <H2>Patrocinio y Exhibición</H2>
                <div style={{ width: 32, height: 2, background: "var(--steel)", marginBottom: "1.5rem" }} />
                <Lead>
                  Visibilidad directa ante tomadores de decisión del sector. Disponibilidad limitada por categoría.
                </Lead>
              </div>
              <div style={{ padding: "1.75rem 2rem", background: "var(--bg-secondary)", borderRadius: 10, border: "1px solid var(--border)" }}>
                <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.68rem", color: "var(--steel)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 12 }}>
                  ¿Por qué patrocinar?
                </p>
                {[
                  { icon: <Users      size={14} strokeWidth={1.5} />, text: "300+ profesionales de la industria en un solo lugar" },
                  { icon: <Building2  size={14} strokeWidth={1.5} />, text: "Empresas maquiladoras, transportistas y agencias aduanales" },
                  { icon: <Handshake  size={14} strokeWidth={1.5} />, text: "Directores, gerentes y jefaturas con poder de decisión real" },
                  { icon: <TrendingUp size={14} strokeWidth={1.5} />, text: "Zona norte de México: el clúster industrial más dinámico del país" },
                  { icon: <Zap        size={14} strokeWidth={1.5} />, text: "Visibilidad antes, durante y después del evento" },
                ].map((item) => (
                  <div key={item.text} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <span style={{ color: "var(--steel)", marginTop: 2, flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", fontWeight: 400, color: "var(--text-secondary)", lineHeight: 1.65 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.25rem", marginBottom: "1.5rem" }} className="sponsors-grid">
              {[
                { tier: "Platino", label: "Máxima visibilidad", accent: "var(--navy-darker)", slots: "8 espacios disponibles", stand: "Stand 5×6m — ubicación privilegiada", items: ["5 accesos VIP a conferencias", "Logo en material impreso y digital", "Reel publicitario en pantallas del evento", "Mención en inauguración y clausura", "Directorio de visitantes y contactos potenciales", "Presentación comercial de 5 min ante la audiencia", "Coffee break con servicio en stand"] },
                { tier: "Oro",     label: "Alta visibilidad",     accent: "var(--navy-mid)",     slots: "10 espacios disponibles", stand: "Stand 4×4m — área central",             items: ["3 accesos VIP a conferencias", "Logo en material impreso y digital", "Mención durante la inauguración", "Publicación en redes sociales y mailing", "Oportunidad de distribuir material promocional"] },
                { tier: "Plata",   label: "Presencia estándar",   accent: "#2c3f5c",             slots: "14 espacios disponibles", stand: "Stand 3×3m — área de exhibición",       items: ["2 accesos VIP a conferencias", "Logo en sitio web y redes sociales", "Publicación en redes sociales"] },
              ].map((s) => (
                <article key={s.tier} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ background: s.accent, padding: "1.75rem 2rem" }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: D3, marginBottom: 6 }}>
                      {s.label} · {s.slots}
                    </p>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.375rem", color: D1, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      Patrocinador {s.tier}
                    </div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.73rem", color: D2, marginTop: 6 }}>
                      {s.stand}
                    </p>
                  </div>
                  <div style={{ padding: "1.5rem 2rem", flex: 1, display: "flex", flexDirection: "column" }}>
                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                      {s.items.map((i) => (
                        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: "0.84rem", fontFamily: "var(--font-body)", fontWeight: 400, color: "var(--text-secondary)" }}>
                          <CheckCircle size={13} color="var(--steel)" strokeWidth={1.5} style={{ marginTop: 2, flexShrink: 0 }} />
                          {i}
                        </li>
                      ))}
                    </ul>
                    <a href={`mailto:Contacto@LanzLogistics.com?subject=Patrocinio ${s.tier} - SC Security Summit 2026`}
                      style={{ display: "block", textAlign: "center", padding: "11px 20px", border: "1px solid var(--border-strong)", borderRadius: 6, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.8rem", color: "var(--text-primary)", textDecoration: "none", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      Solicitar información
                    </a>
                  </div>
                </article>
              ))}
            </div>

            {/* Aliado Estratégico */}
            <div style={{ border: "1px dashed var(--border-strong)", borderRadius: 10, padding: "2rem 2.25rem", marginBottom: "2rem", display: "grid", gridTemplateColumns: "1fr auto", gap: "2rem", alignItems: "center", background: "var(--bg-secondary)" }} className="aliado-grid">
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.62rem", color: "var(--text-tertiary)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>
                  Categoría especial · 16 espacios
                </p>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.2rem", color: "var(--text-primary)", margin: "0 0 0.5rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Proveedor Aliado Estratégico
                </h3>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", fontWeight: 400, color: "var(--text-secondary)", margin: 0, lineHeight: 1.75 }}>
                  Stand 3×3m, 1 acceso a conferencias, inclusión en directorio de soluciones y badge &quot;Proveedor Recomendado&quot; en materiales del evento. Diseñado para proveedores especializados en certificaciones de seguridad.
                </p>
              </div>
              <a href="mailto:Contacto@LanzLogistics.com?subject=Aliado Estratégico - SC Security Summit 2026"
                style={{ whiteSpace: "nowrap", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.82rem", background: "var(--navy)", color: "#fff", padding: "12px 26px", textDecoration: "none", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Solicitar espacio <ArrowRight size={13} strokeWidth={2} />
              </a>
            </div>

            {/* Perfiles de proveedores */}
            <div style={{ background: "var(--navy)", borderRadius: 10, padding: "2.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", alignItems: "start" }} className="provider-inner">
                <div>
                  <Eyebrow light>Quiénes pueden exhibir</Eyebrow>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.3rem", color: D1, margin: "0 0 0.75rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Perfiles de Proveedores
                  </h3>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", fontWeight: 400, color: D2, lineHeight: 1.8, margin: 0 }}>
                    Empresas especializadas en tecnología, seguridad y servicios para la industria maquiladora y la cadena de suministro de la zona norte.
                  </p>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {[
                    "Videovigilancia y CCTV",
                    "Sistemas de alarma y monitoreo",
                    "GPS y telemetría",
                    "Control de acceso",
                    "Seguridad perimetral",
                    "Sellos de seguridad y candados",
                    "Inspección no intrusiva",
                    "Software de trazabilidad / auditoría",
                    "Capacitación y consultoría especializada",
                    "Ciberseguridad aplicada a logística",
                  ].map((item) => (
                    <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-body)", fontSize: "0.875rem", fontWeight: 400, color: D2, padding: "0.5rem 0", borderBottom: `1px solid ${DS2}` }}>
                      <ChevronRight size={12} color="var(--steel-light)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <style>{`
              @media (max-width:960px){ .sponsors-intro { grid-template-columns: 1fr !important; } }
              @media (max-width:900px){ .sponsors-grid { grid-template-columns: 1fr !important; } .aliado-grid { grid-template-columns: 1fr !important; } .provider-inner { grid-template-columns: 1fr !important; } }
            `}</style>
          </div>
        </section>

        {/* ══════════════════════════════════════
            CTA FINAL
        ══════════════════════════════════════ */}
        <section aria-label="Registro" style={{ background: "var(--navy-darker)", padding: "6rem 0", borderTop: `1px solid ${DS2}`, position: "relative", overflow: "hidden" }}>
          <div aria-hidden="true" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 350, background: "radial-gradient(ellipse, rgba(30,86,196,0.16) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ ...ctr, textAlign: "center", maxWidth: 560, position: "relative" }}>
            <div style={{ width: 24, height: 2, background: "var(--steel)", margin: "0 auto 2rem" }} />
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(1.75rem, 4vw, 2.75rem)", letterSpacing: "0.02em", textTransform: "uppercase", color: D1, margin: "0 0 0.75rem", lineHeight: 1.05 }}>
              Cierre de inscripciones
            </h2>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", color: D2, marginBottom: "1.5rem", letterSpacing: "0.04em" }}>
              31 de agosto de 2026
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9375rem", fontWeight: 400, color: D2, marginBottom: "2.75rem", lineHeight: 1.8 }}>
              Cupo limitado. El registro garantiza tu lugar en el evento de seguridad en cadena de suministros más relevante del norte de México.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.875rem", justifyContent: "center" }}>
              <a href="/registro" style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.875rem", background: "var(--steel)", color: "#fff", padding: "14px 34px", textDecoration: "none", borderRadius: 5, display: "inline-flex", alignItems: "center", gap: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Registrarme Ahora <ArrowRight size={15} strokeWidth={2} />
              </a>
              <a href="mailto:Contacto@LanzLogistics.com" style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: "0.875rem", color: D2, padding: "14px 26px", textDecoration: "none", borderRadius: 5, border: `1px solid ${DB}` }}>
                Contactar al Organizador
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer style={{ background: "#04091a", padding: "4.5rem 0 2rem", borderTop: `1px solid ${DS2}` }}>
        <div style={ctr}>
          <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr", gap: "3.5rem", marginBottom: "3rem", paddingBottom: "3rem", borderBottom: `1px solid ${DS2}` }} className="footer-grid">
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", color: D1, marginBottom: "0.75rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                SC Security Summit{" "}
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 400, fontSize: "0.7rem", color: D3, letterSpacing: "0.06em", textTransform: "none" }}>2026</span>
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.84rem", fontWeight: 400, color: D2, lineHeight: 1.75, maxWidth: 280, margin: "0 0 1.25rem" }}>
                1er Summit de Seguridad en la Cadena de Suministros. Reynosa, Tamaulipas, México.
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 400, color: D3, margin: 0 }}>
                Presentado por Lanz Logistics + Thynk Unlimited
              </p>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.6rem", color: D3, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "1.5rem" }}>Evento</p>
              {[
                { icon: <Calendar size={12} strokeWidth={1.5} />, text: "24–25 Sep 2026" },
                { icon: <MapPin   size={12} strokeWidth={1.5} />, text: "Centro de Convenciones, Reynosa" },
                { icon: <Users    size={12} strokeWidth={1.5} />, text: "8:00 am – 6:00 pm" },
              ].map((i) => (
                <div key={i.text} style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: D2, marginBottom: "0.75rem" }}>
                  <span style={{ color: "var(--steel-pale)" }}>{i.icon}</span>
                  {i.text}
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.6rem", color: D3, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "1.5rem" }}>Contacto</p>
              {[
                { icon: <Mail  size={12} strokeWidth={1.5} />, text: "Contacto@LanzLogistics.com", href: "mailto:Contacto@LanzLogistics.com" },
                { icon: <Phone size={12} strokeWidth={1.5} />, text: "+1 956 515 8070",             href: "tel:+19565158070" },
                { icon: <Globe size={12} strokeWidth={1.5} />, text: "scsecuritysummit.com",        href: "https://www.scsecuritysummit.com" },
              ].map((i) => (
                <a key={i.text} href={i.href} style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: D2, textDecoration: "none", marginBottom: "0.75rem" }}>
                  <span style={{ color: "var(--steel-pale)" }}>{i.icon}</span>
                  {i.text}
                </a>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "0.75rem" }}>
            {/* Copyright en D3 (0.54) — visible, no informativo crítico */}
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 400, color: D3 }}>© 2026 Lanz Logistics. Todos los derechos reservados.</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 400, color: D3 }}>Reynosa, Tamaulipas, México</span>
          </div>
        </div>
        <style>{`@media (max-width:768px){ .footer-grid { grid-template-columns: 1fr !important; gap: 2rem !important; } }`}</style>
      </footer>
    </>
  );
}
