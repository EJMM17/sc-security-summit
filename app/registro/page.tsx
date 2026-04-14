import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import RegistroForm from "@/components/RegistroForm";
import { Shield, Calendar, MapPin, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Registro al Evento",
  description:
    "Completa tu registro al 1er Summit de Seguridad en la Cadena de Suministros 2026. Reynosa, Tamaulipas — 24 y 25 de septiembre.",
  alternates: { canonical: "/registro" },
};

export default function RegistroPage() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <section
          style={{
            background: "var(--bg-secondary)",
            padding: "5rem 0",
            minHeight: "calc(100vh - 64px)",
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              padding: "0 2rem",
              display: "grid",
              gridTemplateColumns: "1fr 480px",
              gap: "4rem",
              alignItems: "start",
            }}
            className="registro-grid"
          >
            {/* Left — info */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  color: "var(--navy)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: "1rem",
                }}
              >
                <Shield size={14} strokeWidth={1} />
                Registro
              </div>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  letterSpacing: "-0.03em",
                  color: "var(--text-primary)",
                  margin: "0 0 1.5rem",
                  lineHeight: 1.05,
                }}
              >
                1er Summit de Seguridad en la Cadena de Suministros
              </h1>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  marginBottom: "2.5rem",
                }}
              >
                {[
                  { icon: <Calendar size={16} color="var(--navy)" strokeWidth={1} />, label: "Fecha", val: "24 y 25 de Septiembre, 2026" },
                  { icon: <MapPin size={16} color="var(--navy)" strokeWidth={1} />, label: "Sede", val: "Centro de Convenciones Reynosa, Tamaulipas" },
                ].map((i) => (
                  <div key={i.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                      {i.icon}
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          marginBottom: 2,
                        }}
                      >
                        {i.label}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.9rem",
                          fontWeight: 500,
                          color: "var(--text-primary)",
                        }}
                      >
                        {i.val}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "1.5rem",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
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
                    marginTop: 2,
                  }}
                >
                  <Lock size={16} color="var(--navy)" strokeWidth={1} />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      color: "var(--text-primary)",
                      marginBottom: 4,
                    }}
                  >
                    Proceso de registro seguro
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.8375rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    El pago se coordina por separado vía transferencia bancaria o factura. Al completar este formulario recibirás un folio de confirmación y las instrucciones de pago en tu correo electrónico.
                  </p>
                </div>
              </div>
            </div>

            {/* Right — form */}
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "2.5rem",
                position: "sticky",
                top: 80,
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "1.25rem",
                  color: "var(--text-primary)",
                  margin: "0 0 1.75rem",
                  letterSpacing: "-0.02em",
                }}
              >
                Formulario de Registro
              </h2>
              <RegistroForm />
            </div>
          </div>

          <style>{`
            @media (max-width: 900px) {
              .registro-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </section>
      </main>
    </>
  );
}
