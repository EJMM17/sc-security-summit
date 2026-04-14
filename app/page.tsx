import {
  Shield,
  MapPin,
  Calendar,
  Users,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  Globe,
  ShieldCheck,
  Network,
  Cpu,
  Cctv,
  Satellite,
  Lock,
  Siren,
  Truck,
  FileText,
  UserCheck,
  Package,
  Building2,
} from "lucide-react";
import Navbar from "@/components/Navbar";

// ─── Styles helpers ──────────────────────────────────────────────────────────

const section = (bg = "var(--bg-primary)"): React.CSSProperties => ({
  background: bg,
  padding: "var(--section-py) 0",
});

const container: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "0 2rem",
};

const eyebrow: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontWeight: 600,
  fontSize: "0.75rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--navy)",
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: "1rem",
};

const h2Style: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 800,
  fontSize: "clamp(2rem, 4vw, 3rem)",
  letterSpacing: "-0.03em",
  lineHeight: 1.05,
  color: "var(--text-primary)",
  margin: "0 0 1.5rem",
};

const bodyText: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "1rem",
  fontWeight: 400,
  color: "var(--text-secondary)",
  lineHeight: 1.7,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main-content">

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="hero-heading"
          style={{
            background: "var(--navy-darker)",
            padding: "6rem 0 5rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle grid texture */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              pointerEvents: "none",
            }}
          />
          {/* Accent glow */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "-20%",
              right: "-5%",
              width: "500px",
              height: "500px",
              background: "radial-gradient(circle, rgba(30,58,138,0.5) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ ...container, position: "relative" }}>
            {/* Eyebrow */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(30,58,138,0.35)",
                border: "1px solid rgba(30,58,138,0.6)",
                borderRadius: 4,
                padding: "6px 14px",
                marginBottom: "2rem",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#60a5fa",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  color: "#93c5fd",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Primera Edición · Reynosa, Tamaulipas
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "4rem",
                alignItems: "start",
              }}
              className="hero-grid"
            >
              <div>
                <h1
                  id="hero-heading"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    fontSize: "clamp(2.75rem, 6vw, 5rem)",
                    letterSpacing: "-0.04em",
                    lineHeight: 0.95,
                    color: "#fff",
                    margin: "0 0 1.75rem",
                    textWrap: "balance",
                  }}
                >
                  1ER SUMMIT DE<br />
                  <span style={{ color: "#60a5fa" }}>SEGURIDAD EN LA</span>
                  <br />
                  CADENA DE<br />SUMINISTROS
                </h1>

                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "1.125rem",
                    fontWeight: 300,
                    color: "rgba(255,255,255,0.65)",
                    lineHeight: 1.65,
                    maxWidth: 520,
                    marginBottom: "2.5rem",
                  }}
                >
                  Actualización normativa CTPAT/OEA, vinculación B2B y soluciones tecnológicas para líderes de la industria maquiladora y comercio exterior del norte de México.
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "3rem" }}>
                  <a
                    href="#accesos"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 600,
                      fontSize: "0.9375rem",
                      background: "var(--navy)",
                      color: "#fff",
                      padding: "14px 28px",
                      textDecoration: "none",
                      borderRadius: 6,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      border: "2px solid var(--navy)",
                      transition: "background 0.15s",
                    }}
                  >
                    Registrarme Ahora
                    <ArrowRight size={16} strokeWidth={1} />
                  </a>
                  <a
                    href="#patrocinadores"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 600,
                      fontSize: "0.9375rem",
                      color: "rgba(255,255,255,0.8)",
                      padding: "14px 28px",
                      textDecoration: "none",
                      borderRadius: 6,
                      border: "2px solid rgba(255,255,255,0.15)",
                      transition: "border-color 0.15s, color 0.15s",
                    }}
                  >
                    Patrocinar el Evento
                  </a>
                </div>

                {/* Meta row */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "2rem",
                    paddingTop: "2rem",
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {[
                    {
                      icon: <Calendar size={16} color="#60a5fa" strokeWidth={1} />,
                      label: "Fecha",
                      value: "24–25 Sep 2026",
                    },
                    {
                      icon: <MapPin size={16} color="#60a5fa" strokeWidth={1} />,
                      label: "Sede",
                      value: "Centro de Convenciones Reynosa",
                    },
                    {
                      icon: <Users size={16} color="#60a5fa" strokeWidth={1} />,
                      label: "Organiza",
                      value: "Lanz Logistics + Thynk Unlimited",
                    },
                  ].map((m) => (
                    <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {m.icon}
                      <div>
                        <div
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            color: "rgba(255,255,255,0.35)",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                          }}
                        >
                          {m.label}
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.8125rem",
                            fontWeight: 400,
                            color: "rgba(255,255,255,0.8)",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {m.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats card */}
              <div
                className="hero-stats"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  padding: "2rem",
                  minWidth: 240,
                  display: "grid",
                  gap: "1.5rem",
                }}
              >
                {[
                  { num: "2", label: "Días de capacitación" },
                  { num: "10+", label: "Conferencias y workshops" },
                  { num: "4", label: "Conferencistas especializados" },
                  { num: "3", label: "Categorías de patrocinio" },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      paddingBottom: "1.5rem",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        fontSize: "2.5rem",
                        color: "#60a5fa",
                        lineHeight: 1,
                        marginBottom: 4,
                        letterSpacing: "-0.04em",
                      }}
                    >
                      {s.num}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.8125rem",
                        color: "rgba(255,255,255,0.45)",
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <style>{`
            @media (max-width: 900px) {
              .hero-grid { grid-template-columns: 1fr !important; }
              .hero-stats { display: none !important; }
            }
          `}</style>
        </section>

        {/* ── TRES PILARES ──────────────────────────────────────────────── */}
        <section id="acerca" aria-labelledby="pilares-heading" style={section()}>
          <div style={container}>
            <div style={{ maxWidth: 540, marginBottom: "3.5rem" }}>
              <div style={eyebrow}>
                <Shield size={14} strokeWidth={1} />
                Enfoque del Evento
              </div>
              <h2 id="pilares-heading" style={h2Style}>
                Tres ejes estratégicos,<br />un sector fortalecido
              </h2>
              <p style={bodyText}>
                El Summit articula sus contenidos en torno a las tres dimensiones críticas de la cadena de suministro segura: cumplimiento regulatorio, vinculación comercial y adopción tecnológica.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1.5rem",
              }}
              className="pilares-grid"
            >
              {[
                {
                  icon: <ShieldCheck size={28} color="var(--navy)" strokeWidth={1} />,
                  title: "Cumplimiento CTPAT / OEA",
                  body: "Actualización normativa directa: cambios en requisitos CTPAT 2026, estatus del programa OEA en México, procedimientos aduanales y controles de exportación. Aplicable a maquiladoras, transportistas y agentes aduanales.",
                  items: [
                    "Auditorías y auto-evaluaciones CTPAT",
                    "Requisitos OEA nivel avanzado",
                    "Actualizaciones SAT / CBP",
                    "Análisis de riesgo aduanero",
                  ],
                },
                {
                  icon: <Network size={28} color="var(--navy)" strokeWidth={1} />,
                  title: "Networking B2B",
                  body: "Business Hub diseñado para la generación de acuerdos comerciales entre maquiladoras, proveedores de soluciones, operadores logísticos y agencias aduanales. Acceso estructurado a tomadores de decisión.",
                  items: [
                    "Business Hub con agenda abierta",
                    "Reuniones 1:1 programadas",
                    "Directorio de asistentes verificados",
                    "Exposición de soluciones especializadas",
                  ],
                },
                {
                  icon: <Cpu size={28} color="var(--navy)" strokeWidth={1} />,
                  title: "Innovación Tecnológica",
                  body: "Exposición de soluciones para la cadena de suministro segura: videovigilancia, GPS, ciberseguridad, control de acceso y software de trazabilidad. Casos de aplicación real en el entorno maquilador.",
                  items: [
                    "Soluciones CCTV para transporte y planta",
                    "Sistemas GPS y telemetría de carga",
                    "Ciberseguridad logística",
                    "Software de trazabilidad end-to-end",
                  ],
                },
              ].map((p) => (
                <article
                  key={p.title}
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "2rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      background: "#eff6ff",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {p.icon}
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: "1.125rem",
                      color: "var(--text-primary)",
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    {p.title}
                  </h3>
                  <p
                    style={{
                      ...bodyText,
                      fontSize: "0.9rem",
                      margin: 0,
                    }}
                  >
                    {p.body}
                  </p>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                    {p.items.map((item) => (
                      <li
                        key={item}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          fontSize: "0.85rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <CheckCircle
                          size={14}
                          color="var(--navy)"
                          strokeWidth={1}
                          style={{ marginTop: 2, flexShrink: 0 }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <style>{`
              @media (max-width: 900px) {
                .pilares-grid { grid-template-columns: 1fr !important; }
              }
            `}</style>
          </div>
        </section>

        {/* ── BENTO GRID — PERFILES ─────────────────────────────────────── */}
        <section
          id="perfiles"
          aria-labelledby="bento-heading"
          style={section("var(--bg-secondary)")}
        >
          <div style={container}>
            <div style={{ maxWidth: 540, marginBottom: "3.5rem" }}>
              <div style={eyebrow}>
                <Users size={14} strokeWidth={1} />
                Participantes
              </div>
              <h2 id="bento-heading" style={h2Style}>
                A quién va dirigido
              </h2>
              <p style={bodyText}>
                Profesionales de la industria con responsabilidades directas en operaciones, compliance, seguridad corporativa y comercio exterior en la zona norte de México.
              </p>
            </div>

            {/* Bento grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gridTemplateRows: "auto auto",
                gap: "1rem",
              }}
              className="bento-grid"
            >
              {/* Asistentes header — span 2 */}
              <div
                style={{
                  gridColumn: "span 2",
                  background: "var(--navy-darker)",
                  borderRadius: 8,
                  padding: "2rem",
                  color: "#fff",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: "1.3rem",
                    margin: "0 0 0.5rem",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Perfil de Asistentes
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.875rem",
                    color: "rgba(255,255,255,0.55)",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  Directivos y mandos medios con autoridad de compra o influencia en decisiones operativas de cadena de suministro.
                </p>
              </div>

              {/* Proveedores header — span 2 */}
              <div
                style={{
                  gridColumn: "span 2",
                  background: "var(--navy)",
                  borderRadius: 8,
                  padding: "2rem",
                  color: "#fff",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: "1.3rem",
                    margin: "0 0 0.5rem",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Proveedores de Soluciones
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.875rem",
                    color: "rgba(255,255,255,0.55)",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  Empresas con soluciones especializadas para seguridad y eficiencia de la cadena de suministro.
                </p>
              </div>

              {/* Asistente cards */}
              {[
                { icon: <Building2 size={20} color="var(--navy)" strokeWidth={1} />, label: "Industria Maquiladora", desc: "Gerentes de planta, directores de supply chain y logística" },
                { icon: <Truck size={20} color="var(--navy)" strokeWidth={1} />, label: "Transporte y Logística", desc: "Operadores de transporte terrestre y almacenaje" },
                { icon: <FileText size={20} color="var(--navy)" strokeWidth={1} />, label: "Agencias Aduanales", desc: "Agentes y mandatarios aduanales" },
                { icon: <UserCheck size={20} color="var(--navy)" strokeWidth={1} />, label: "Compliance y Seguridad", desc: "Responsables CTPAT/OEA y seguridad corporativa" },
              ].map((b) => (
                <div
                  key={b.label}
                  style={{
                    background: "#fff",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      background: "#eff6ff",
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {b.icon}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: "0.9375rem",
                      color: "var(--text-primary)",
                    }}
                  >
                    {b.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.8125rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    {b.desc}
                  </div>
                </div>
              ))}

              {/* Proveedor cards */}
              {[
                { icon: <Cctv size={20} color="var(--navy)" strokeWidth={1} />, label: "Videovigilancia y CCTV", desc: "Sistemas de monitoreo para planta y transporte" },
                { icon: <Satellite size={20} color="var(--navy)" strokeWidth={1} />, label: "GPS y Telemetría", desc: "Rastreo satelital de unidades y carga" },
                { icon: <Lock size={20} color="var(--navy)" strokeWidth={1} />, label: "Control de Acceso", desc: "Biometría, RFID y seguridad perimetral" },
                { icon: <Siren size={20} color="var(--navy)" strokeWidth={1} />, label: "Sistemas de Alarma", desc: "Detección y respuesta a incidentes" },
                { icon: <Package size={20} color="var(--navy)" strokeWidth={1} />, label: "Sellos y Candados", desc: "Dispositivos de seguridad para carga en tránsito" },
                { icon: <Cpu size={20} color="var(--navy)" strokeWidth={1} />, label: "Ciberseguridad Logística", desc: "Protección de datos y sistemas de gestión" },
                { icon: <Network size={20} color="var(--navy)" strokeWidth={1} />, label: "Software de Trazabilidad", desc: "Visibilidad end-to-end de la cadena" },
                { icon: <ShieldCheck size={20} color="var(--navy)" strokeWidth={1} />, label: "Consultoría CTPAT/OEA", desc: "Capacitación y acompañamiento en certificación" },
              ].map((b) => (
                <div
                  key={b.label}
                  style={{
                    background: "#fff",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "1.25rem 1.5rem",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: "#eff6ff",
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {b.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        color: "var(--text-primary)",
                        marginBottom: 2,
                      }}
                    >
                      {b.label}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {b.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <style>{`
              @media (max-width: 1024px) {
                .bento-grid { grid-template-columns: repeat(2, 1fr) !important; }
                .bento-grid > *:nth-child(1),
                .bento-grid > *:nth-child(2) { grid-column: span 2 !important; }
              }
              @media (max-width: 600px) {
                .bento-grid { grid-template-columns: 1fr !important; }
                .bento-grid > *:nth-child(1),
                .bento-grid > *:nth-child(2) { grid-column: span 1 !important; }
              }
            `}</style>
          </div>
        </section>

        {/* ── CONFERENCISTAS ────────────────────────────────────────────── */}
        <section id="conferencistas" aria-labelledby="speakers-heading" style={section()}>
          <div style={container}>
            <div style={{ maxWidth: 540, marginBottom: "3.5rem" }}>
              <div style={eyebrow}>
                <Users size={14} strokeWidth={1} />
                Conferencistas Confirmados
              </div>
              <h2 id="speakers-heading" style={h2Style}>
                Expertos con trayectoria<br />verificable en el sector
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "1.5rem",
              }}
              className="speakers-grid"
            >
              {[
                {
                  name: "Fidel Guerrero",
                  role: "Subdirector, Comité Nacional de Aduanas y Comercio Exterior",
                  org: "INDEX",
                  tag: "Aduanas & Comercio Exterior",
                  bio: "Director con trayectoria comprobada en importación y exportación. Especialista en negociación internacional y cumplimiento aduanero.",
                },
                {
                  name: "Isidoro Juárez",
                  role: "Mandatario Aduanal Certificado",
                  org: "Comercio Exterior",
                  tag: "Aduanas & Compliance",
                  bio: "Experto en IMMEX, PROSEC, clasificación arancelaria y representación aduanera. Ponente en foros nacionales.",
                },
                {
                  name: "Julio César Suárez",
                  role: "Líder en Trade Compliance e Innovación",
                  org: "Ex-Eaton / BorgWarner / Brunswick",
                  tag: "Trade Compliance",
                  bio: "Especialista en cumplimiento aduanero, controles de exportación e Incoterms. Trayectoria en manufactura de clase mundial.",
                },
                {
                  name: "Eduardo Luna",
                  role: "Especialista en Innovación Estratégica",
                  org: "Harvard Teaching Certified",
                  tag: "Innovación & Aprendizaje",
                  bio: "Experto en design thinking, investigación aplicada y diseño de experiencias de aprendizaje organizacional.",
                },
              ].map((s) => (
                <article
                  key={s.name}
                  style={{
                    background: "#fff",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Color stripe */}
                  <div style={{ height: 4, background: "var(--navy)" }} />

                  <div style={{ padding: "1.75rem", flex: 1 }}>
                    {/* Avatar placeholder */}
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: "#eff6ff",
                        border: "2px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "1rem",
                      }}
                      aria-hidden="true"
                    >
                      <Users size={24} color="var(--navy)" strokeWidth={1} />
                    </div>

                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                        fontSize: "0.7rem",
                        color: "var(--navy)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        marginBottom: 6,
                      }}
                    >
                      {s.tag}
                    </div>

                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        fontSize: "1.125rem",
                        color: "var(--text-primary)",
                        margin: "0 0 4px",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {s.name}
                    </h3>

                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        color: "var(--text-secondary)",
                        marginBottom: 4,
                      }}
                    >
                      {s.role}
                    </div>

                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.75rem",
                        color: "var(--navy)",
                        fontWeight: 600,
                        marginBottom: "1rem",
                      }}
                    >
                      {s.org}
                    </div>

                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.8375rem",
                        color: "var(--text-muted)",
                        lineHeight: 1.6,
                        margin: 0,
                        borderTop: "1px solid var(--border)",
                        paddingTop: "1rem",
                      }}
                    >
                      {s.bio}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <style>{`
              @media (max-width: 900px) {
                .speakers-grid { grid-template-columns: repeat(2, 1fr) !important; }
              }
              @media (max-width: 540px) {
                .speakers-grid { grid-template-columns: 1fr !important; }
              }
            `}</style>
          </div>
        </section>

        {/* ── PRICING ───────────────────────────────────────────────────── */}
        <section id="accesos" aria-labelledby="pricing-heading" style={section("var(--bg-secondary)")}>
          <div style={container}>
            <div style={{ textAlign: "center", maxWidth: 540, margin: "0 auto 3.5rem" }}>
              <div style={{ ...eyebrow, justifyContent: "center" }}>
                <Shield size={14} strokeWidth={1} />
                Accesos al Evento
              </div>
              <h2 id="pricing-heading" style={{ ...h2Style, textAlign: "center" }}>
                Elige tu tipo de acceso
              </h2>
              <p style={{ ...bodyText, textAlign: "center" }}>
                Dos días completos de capacitación especializada. 24 y 25 de septiembre de 2026 — Centro de Convenciones Reynosa.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1.5rem",
                maxWidth: 960,
                margin: "0 auto 2.5rem",
              }}
              className="pricing-grid"
            >
              {/* Estudiante */}
              <article
                aria-label="Acceso Estudiante"
                style={{
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "2rem",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: "1rem",
                  }}
                >
                  Acceso Estudiante
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      fontSize: "2.75rem",
                      color: "var(--text-primary)",
                      letterSpacing: "-0.04em",
                    }}
                  >
                    $890
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.875rem",
                      color: "var(--text-muted)",
                      marginLeft: 6,
                    }}
                  >
                    MXN
                  </span>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      marginTop: 4,
                    }}
                  >
                    Requiere credencial vigente
                  </div>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  {[
                    { ok: true, t: "Acceso 2 días (conferencias y paneles)" },
                    { ok: true, t: "Gafete y kit básico digital" },
                    { ok: false, t: "Business Hub / Networking" },
                    { ok: false, t: "Asiento preferente" },
                    { ok: false, t: "Workshop práctico" },
                  ].map((i) => (
                    <li key={i.t} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.875rem", color: i.ok ? "var(--text-secondary)" : "var(--text-muted)" }}>
                      <CheckCircle size={15} color={i.ok ? "var(--navy)" : "var(--border-strong)"} strokeWidth={1} style={{ marginTop: 1, flexShrink: 0 }} />
                      {i.t}
                    </li>
                  ))}
                </ul>
                <a
                  href="/registro?acceso=estudiante"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "12px 20px",
                    border: "1px solid var(--border-strong)",
                    borderRadius: 6,
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    color: "var(--text-primary)",
                    textDecoration: "none",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  Registrarme
                </a>
              </article>

              {/* General — FEATURED */}
              <article
                aria-label="Acceso General — Recomendado"
                style={{
                  background: "#fff",
                  border: "2px solid var(--navy)",
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                {/* Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--navy)",
                    color: "#fff",
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    padding: "4px 14px",
                    borderRadius: 20,
                    whiteSpace: "nowrap",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Recomendado
                </div>

                <div style={{ padding: "2.25rem 2rem 2rem" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--navy)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: "1rem",
                    }}
                  >
                    Acceso General
                  </div>
                  <div style={{ marginBottom: "1.5rem" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        fontSize: "2.75rem",
                        color: "var(--navy)",
                        letterSpacing: "-0.04em",
                      }}
                    >
                      $5,800
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.875rem",
                        color: "var(--text-muted)",
                        marginLeft: 6,
                      }}
                    >
                      MXN
                    </span>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      Profesionales y empresas
                    </div>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                    {[
                      "Acceso 2 días (conferencias y paneles)",
                      "Gafete y kit profesional (digital + impreso)",
                      "Constancia de participación digital",
                      "Acceso a área de exhibición",
                      "Coffee break incluido",
                    ].map((t) => (
                      <li key={t} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                        <CheckCircle size={15} color="var(--navy)" style={{ marginTop: 1, flexShrink: 0 }} strokeWidth={1} />
                        {t}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="/registro?acceso=general"
                    style={{
                      display: "block",
                      textAlign: "center",
                      padding: "13px 20px",
                      background: "var(--navy)",
                      borderRadius: 6,
                      fontFamily: "var(--font-body)",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      color: "#fff",
                      textDecoration: "none",
                      transition: "background 0.15s",
                    }}
                  >
                    Comprar Acceso
                  </a>
                </div>
              </article>

              {/* VIP */}
              <article
                aria-label="Acceso VIP"
                style={{
                  background: "var(--navy-darker)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  padding: "2rem",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#60a5fa",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: "1rem",
                  }}
                >
                  Acceso VIP
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      fontSize: "2.75rem",
                      color: "#fff",
                      letterSpacing: "-0.04em",
                    }}
                  >
                    $7,200
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.875rem",
                      color: "rgba(255,255,255,0.35)",
                      marginLeft: 6,
                    }}
                  >
                    MXN
                  </span>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.8rem",
                      color: "rgba(255,255,255,0.4)",
                      marginTop: 4,
                    }}
                  >
                    Máxima experiencia en el evento
                  </div>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  {[
                    "Todo lo incluido en General",
                    "Fast check-in + gafete premium",
                    "Asiento preferente y acceso prioritario",
                    "Business Hub (acceso prioritario)",
                    "Workshop práctico incluido",
                    "Coffee break los 2 días",
                  ].map((t) => (
                    <li key={t} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.875rem", color: "rgba(255,255,255,0.7)" }}>
                      <CheckCircle size={15} color="#60a5fa" style={{ marginTop: 1, flexShrink: 0 }} strokeWidth={1} />
                      {t}
                    </li>
                  ))}
                </ul>
                <a
                  href="/registro?acceso=vip"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "12px 20px",
                    background: "rgba(96,165,250,0.15)",
                    border: "1px solid rgba(96,165,250,0.3)",
                    borderRadius: 6,
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    color: "#60a5fa",
                    textDecoration: "none",
                  }}
                >
                  Comprar VIP
                </a>
              </article>
            </div>

            <p style={{ textAlign: "center", ...bodyText, fontSize: "0.875rem" }}>
              ¿Requieres factura o registro grupal?{" "}
              <a href="mailto:Contacto@LanzLogistics.com" style={{ color: "var(--navy)", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                Contacto@LanzLogistics.com
              </a>{" "}
              ·{" "}
              <a href="tel:+19565158070" style={{ color: "var(--navy)", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                +1 956 515 8070
              </a>
            </p>

            <style>{`
              @media (max-width: 900px) {
                .pricing-grid { grid-template-columns: 1fr !important; max-width: 480px !important; }
              }
            `}</style>
          </div>
        </section>

        {/* ── PATROCINADORES ────────────────────────────────────────────── */}
        <section id="patrocinadores" aria-labelledby="sponsors-heading" style={section()}>
          <div style={container}>
            <div style={{ maxWidth: 540, marginBottom: "3.5rem" }}>
              <div style={eyebrow}>
                <Building2 size={14} strokeWidth={1} />
                Oportunidades Comerciales
              </div>
              <h2 id="sponsors-heading" style={h2Style}>
                Patrocinio y Exhibición
              </h2>
              <p style={bodyText}>
                Visibilidad directa ante tomadores de decisión del sector. Disponibilidad limitada por categoría.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }} className="sponsors-grid">
              {[
                {
                  tier: "Platino",
                  label: "Máxima visibilidad",
                  accent: "var(--navy-darker)",
                  textAccent: "#fff",
                  slots: "8 espacios disponibles",
                  stand: "Stand 5×6m — ubicación privilegiada",
                  items: ["5 accesos VIP", "Logo en material impreso y digital", "Reel publicitario en pantallas", "Mención en inauguración y clausura", "Directorio de visitantes", "Presentación comercial de 5 min", "Coffee break con servicio en stand"],
                },
                {
                  tier: "Oro",
                  label: "Alta visibilidad",
                  accent: "#1e40af",
                  textAccent: "#fff",
                  slots: "10 espacios disponibles",
                  stand: "Stand 4×4m — área central",
                  items: ["3 accesos VIP", "Logo en material impreso y digital", "Publicación en redes sociales", "Material promocional distribuido"],
                },
                {
                  tier: "Plata",
                  label: "Presencia estándar",
                  accent: "#475569",
                  textAccent: "#fff",
                  slots: "14 espacios disponibles",
                  stand: "Stand 3×3m — área de exhibición",
                  items: ["2 accesos VIP", "Logo en sitio web y redes sociales", "Publicación en redes sociales"],
                },
              ].map((s) => (
                <article
                  key={s.tier}
                  style={{
                    background: "#fff",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      background: s.accent,
                      padding: "1.5rem 1.75rem",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.68rem",
                        fontWeight: 500,
                        color: "rgba(255,255,255,0.5)",
                        letterSpacing: "0.02em",
                        marginBottom: 4,
                      }}
                    >
                      {s.label} · {s.slots}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        fontSize: "1.5rem",
                        color: s.textAccent,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      Patrocinador {s.tier}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.78rem",
                        color: "rgba(255,255,255,0.55)",
                        marginTop: 4,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {s.stand}
                    </div>
                  </div>
                  <div style={{ padding: "1.5rem 1.75rem", flex: 1 }}>
                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", display: "flex", flexDirection: "column", gap: 8 }}>
                      {s.items.map((i) => (
                        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                          <CheckCircle size={14} color="var(--navy)" style={{ marginTop: 1, flexShrink: 0 }} strokeWidth={1} />
                          {i}
                        </li>
                      ))}
                    </ul>
                    <a
                      href={`mailto:Contacto@LanzLogistics.com?subject=Patrocinio ${s.tier} - SC Security Summit 2026`}
                      style={{
                        display: "block",
                        textAlign: "center",
                        padding: "11px 20px",
                        border: "1px solid var(--border-strong)",
                        borderRadius: 6,
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "var(--text-primary)",
                        textDecoration: "none",
                      }}
                    >
                      Solicitar información
                    </a>
                  </div>
                </article>
              ))}
            </div>

            {/* Aliado Estratégico */}
            <div
              style={{
                marginTop: "1.5rem",
                border: "1.5px dashed var(--border-strong)",
                borderRadius: 8,
                padding: "2rem",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "2rem",
                alignItems: "center",
                background: "var(--bg-secondary)",
              }}
              className="aliado-grid"
            >
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Categoría especial · 16 espacios
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: "1.25rem",
                    color: "var(--text-primary)",
                    margin: "0 0 0.5rem",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Proveedor Aliado Estratégico
                </h3>
                <p style={{ ...bodyText, fontSize: "0.9rem", margin: "0 0 1rem" }}>
                  Stand 3×3m, 1 acceso a conferencias, inclusión en directorio de soluciones y badge "Proveedor Recomendado" en materiales del evento. Diseñado para proveedores especializados en CTPAT/OEA.
                </p>
              </div>
              <a
                href="mailto:Contacto@LanzLogistics.com?subject=Aliado Estratégico - SC Security Summit 2026"
                style={{
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  background: "var(--navy)",
                  color: "#fff",
                  padding: "12px 24px",
                  textDecoration: "none",
                  borderRadius: 6,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Solicitar espacio
                <ArrowRight size={16} strokeWidth={1} />
              </a>
            </div>

            <style>{`
              @media (max-width: 900px) {
                .sponsors-grid { grid-template-columns: 1fr !important; }
                .aliado-grid { grid-template-columns: 1fr !important; }
              }
            `}</style>
          </div>
        </section>

        {/* ── CTA FINAL ─────────────────────────────────────────────────── */}
        <section
          aria-label="Registro al evento"
          style={{
            background: "var(--navy-darker)",
            padding: "5rem 0",
          }}
        >
          <div style={{ ...container, textAlign: "center", maxWidth: 680 }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                letterSpacing: "-0.03em",
                color: "#fff",
                margin: "0 0 1rem",
                lineHeight: 1.05,
              }}
            >
              Cierre de inscripciones:<br />31 de agosto de 2026
            </h2>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "1rem",
                color: "rgba(255,255,255,0.5)",
                marginBottom: "2.5rem",
                lineHeight: 1.6,
              }}
            >
              Cupo limitado. El registro garantiza tu lugar en el evento especializado de seguridad en la cadena de suministros más relevante del norte de México.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
              <a
                href="/registro"
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  background: "var(--navy)",
                  color: "#fff",
                  padding: "14px 32px",
                  textDecoration: "none",
                  borderRadius: 6,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  border: "2px solid var(--navy-light)",
                }}
              >
                Registrarme Ahora
                <ArrowRight size={16} strokeWidth={1} />
              </a>
              <a
                href="mailto:Contacto@LanzLogistics.com"
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  color: "rgba(255,255,255,0.7)",
                  padding: "14px 32px",
                  textDecoration: "none",
                  borderRadius: 6,
                  border: "2px solid rgba(255,255,255,0.12)",
                }}
              >
                Contactar al Organizador
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer
        style={{
          background: "#060e1d",
          padding: "4rem 0 2rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={container}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr",
              gap: "3rem",
              marginBottom: "3rem",
            }}
            className="footer-grid"
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: "1rem",
                  color: "#fff",
                  marginBottom: "0.75rem",
                  letterSpacing: "-0.01em",
                }}
              >
                SC SECURITY{" "}
                <span style={{ color: "#60a5fa" }}>SUMMIT</span>{" "}
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    fontSize: "0.65rem",
                    background: "rgba(96,165,250,0.15)",
                    color: "#93c5fd",
                    padding: "2px 7px",
                    borderRadius: 3,
                    verticalAlign: "middle",
                    letterSpacing: "0.08em",
                  }}
                >
                  2026
                </span>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.875rem",
                  color: "rgba(255,255,255,0.35)",
                  lineHeight: 1.6,
                  maxWidth: 300,
                  margin: "0 0 1rem",
                }}
              >
                1er Summit de Seguridad en la Cadena de Suministros. Reynosa, Tamaulipas, México.
              </p>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.2)",
                }}
              >
                Presentado por Lanz Logistics + Thynk Unlimited
              </div>
            </div>

            <div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: "1.25rem",
                }}
              >
                Evento
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  { icon: <Calendar size={14} strokeWidth={1} />, text: "24–25 Sep 2026" },
                  { icon: <MapPin size={14} strokeWidth={1} />, text: "Centro de Convenciones Reynosa" },
                  { icon: <Users size={14} strokeWidth={1} />, text: "8:00 am – 6:00 pm" },
                ].map((i) => (
                  <div key={i.text} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", letterSpacing: "-0.01em" }}>
                    <span style={{ color: "#60a5fa" }}>{i.icon}</span>
                    {i.text}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: "1.25rem",
                }}
              >
                Contacto
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  { icon: <Mail size={14} strokeWidth={1} />, text: "Contacto@LanzLogistics.com", href: "mailto:Contacto@LanzLogistics.com" },
                  { icon: <Phone size={14} strokeWidth={1} />, text: "+1 956 515 8070", href: "tel:+19565158070" },
                  { icon: <Globe size={14} strokeWidth={1} />, text: "scsecuritysummit.com", href: "https://www.scsecuritysummit.com" },
                ].map((i) => (
                  <a key={i.text} href={i.href} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", textDecoration: "none", letterSpacing: "-0.01em" }}>
                    <span style={{ color: "#60a5fa" }}>{i.icon}</span>
                    {i.text}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: "1.5rem",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "rgba(255,255,255,0.2)" }}>
              © 2026 Lanz Logistics. Todos los derechos reservados.
            </span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "rgba(255,255,255,0.2)" }}>
              Reynosa, Tamaulipas, México
            </span>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .footer-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </footer>
    </>
  );
}
