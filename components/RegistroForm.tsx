"use client";

import { useFormState, useFormStatus } from "react-dom";
import { registrarAsistente, type RegistroState } from "@/app/actions/registro";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const initialState: RegistroState = {
  success: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      style={{
        width: "100%",
        padding: "14px 24px",
        background: pending ? "#94a3b8" : "var(--navy)",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        fontSize: "0.9375rem",
        cursor: pending ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "background 0.15s",
      }}
    >
      {pending ? (
        <>
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} strokeWidth={1} />
          Procesando registro...
        </>
      ) : (
        "Confirmar Registro"
      )}
    </button>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p
      role="alert"
      style={{
        color: "var(--error)",
        fontSize: "0.8125rem",
        marginTop: 4,
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <AlertCircle size={13} strokeWidth={1} />
      {errors[0]}
    </p>
  );
}

const ACCESOS = [
  { value: "estudiante", label: "Estudiante", price: "$890 MXN", note: "(requiere credencial)" },
  { value: "general",    label: "General",    price: "$5,800 MXN", note: "" },
  { value: "vip",        label: "VIP",        price: "$7,200 MXN", note: "" },
] as const;

export default function RegistroForm() {
  const [state, formAction] = useFormState(registrarAsistente, initialState);

  if (state.success) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          textAlign: "center",
          padding: "3rem 2rem",
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 8,
        }}
      >
        <CheckCircle
          size={48}
          color="#16a34a"
          strokeWidth={1}
          style={{ marginBottom: "1rem" }}
        />
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "1.25rem",
            color: "#0f172a",
            marginBottom: "0.75rem",
          }}
        >
          Registro completado
        </h3>
        <p style={{ color: "#475569", fontSize: "0.9375rem", marginBottom: "1rem" }}>
          {state.message}
        </p>
        {state.folio && (
          <div
            style={{
              display: "inline-block",
              background: "#fff",
              border: "1px solid #bbf7d0",
              borderRadius: 4,
              padding: "8px 20px",
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              fontSize: "1rem",
              color: "var(--navy)",
              letterSpacing: "0.06em",
            }}
          >
            {state.folio}
          </div>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} noValidate>
      {/* Form-level error */}
      {state.errors?._form && (
        <div
          role="alert"
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 6,
            padding: "12px 16px",
            marginBottom: "1.5rem",
            color: "var(--error)",
            fontSize: "0.875rem",
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} strokeWidth={1} />
          {state.errors._form[0]}
        </div>
      )}

      <div style={{ display: "grid", gap: "1.25rem" }}>
        {/* Nombre + Apellido */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label htmlFor="nombre" style={labelStyle}>
              Nombre <span aria-hidden="true" style={{ color: "var(--error)" }}>*</span>
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              autoComplete="given-name"
              aria-required="true"
              aria-describedby={state.errors?.nombre ? "nombre-error" : undefined}
              aria-invalid={!!state.errors?.nombre}
              placeholder="Juan"
              style={inputStyle(!!state.errors?.nombre)}
            />
            <span id="nombre-error">
              <FieldError errors={state.errors?.nombre} />
            </span>
          </div>
          <div>
            <label htmlFor="apellido" style={labelStyle}>
              Apellido <span aria-hidden="true" style={{ color: "var(--error)" }}>*</span>
            </label>
            <input
              id="apellido"
              name="apellido"
              type="text"
              required
              autoComplete="family-name"
              aria-required="true"
              aria-describedby={state.errors?.apellido ? "apellido-error" : undefined}
              aria-invalid={!!state.errors?.apellido}
              placeholder="García Méndez"
              style={inputStyle(!!state.errors?.apellido)}
            />
            <span id="apellido-error">
              <FieldError errors={state.errors?.apellido} />
            </span>
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" style={labelStyle}>
            Correo electrónico <span aria-hidden="true" style={{ color: "var(--error)" }}>*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-required="true"
            aria-describedby={state.errors?.email ? "email-error" : undefined}
            aria-invalid={!!state.errors?.email}
            placeholder="juan@empresa.com"
            style={inputStyle(!!state.errors?.email)}
          />
          <span id="email-error">
            <FieldError errors={state.errors?.email} />
          </span>
        </div>

        {/* Teléfono + Empresa */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label htmlFor="telefono" style={labelStyle}>
              Teléfono <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(opcional)</span>
            </label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              autoComplete="tel"
              aria-describedby={state.errors?.telefono ? "telefono-error" : undefined}
              aria-invalid={!!state.errors?.telefono}
              placeholder="+52 81 1234 5678"
              style={inputStyle(!!state.errors?.telefono)}
            />
            <span id="telefono-error">
              <FieldError errors={state.errors?.telefono} />
            </span>
          </div>
          <div>
            <label htmlFor="empresa" style={labelStyle}>
              Empresa <span aria-hidden="true" style={{ color: "var(--error)" }}>*</span>
            </label>
            <input
              id="empresa"
              name="empresa"
              type="text"
              required
              autoComplete="organization"
              aria-required="true"
              aria-describedby={state.errors?.empresa ? "empresa-error" : undefined}
              aria-invalid={!!state.errors?.empresa}
              placeholder="Nombre de tu empresa"
              style={inputStyle(!!state.errors?.empresa)}
            />
            <span id="empresa-error">
              <FieldError errors={state.errors?.empresa} />
            </span>
          </div>
        </div>

        {/* Cargo */}
        <div>
          <label htmlFor="cargo" style={labelStyle}>
            Cargo <span aria-hidden="true" style={{ color: "var(--error)" }}>*</span>
          </label>
          <input
            id="cargo"
            name="cargo"
            type="text"
            required
            aria-required="true"
            aria-describedby={state.errors?.cargo ? "cargo-error" : undefined}
            aria-invalid={!!state.errors?.cargo}
            placeholder="Gerente de Operaciones"
            style={inputStyle(!!state.errors?.cargo)}
          />
          <span id="cargo-error">
            <FieldError errors={state.errors?.cargo} />
          </span>
        </div>

        {/* Tipo de acceso */}
        <div>
          <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
            <legend style={{ ...labelStyle, display: "block", marginBottom: "0.75rem" }}>
              Tipo de acceso <span aria-hidden="true" style={{ color: "var(--error)" }}>*</span>
            </legend>
            <div style={{ display: "grid", gap: "0.625rem" }}>
              {ACCESOS.map((a) => (
                <label
                  key={a.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.875rem",
                    color: "var(--text-primary)",
                    transition: "border-color 0.15s",
                  }}
                >
                  <input
                    type="radio"
                    name="tipo_acceso"
                    value={a.value}
                    defaultChecked={a.value === "general"}
                    aria-describedby={state.errors?.tipo_acceso ? "acceso-error" : undefined}
                    style={{ accentColor: "var(--navy)", width: 16, height: 16 }}
                  />
                  <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span>{a.label}</span>
                    <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>—</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 500, color: "var(--navy)", letterSpacing: "-0.01em" }}>{a.price}</span>
                    {a.note && <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{a.note}</span>}
                  </span>
                </label>
              ))}
            </div>
            <span id="acceso-error">
              <FieldError errors={state.errors?.tipo_acceso} />
            </span>
          </fieldset>
        </div>

        {/* Credencial estudiantil */}
        <div>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              cursor: "pointer",
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
            }}
          >
            <input
              type="checkbox"
              name="credencial_estudiantil"
              style={{ accentColor: "var(--navy)", marginTop: 2, width: 16, height: 16 }}
            />
            <span>
              Confirmo que presentaré credencial estudiantil vigente en el evento{" "}
              <span style={{ color: "var(--text-muted)" }}>(solo aplica para acceso estudiante)</span>
            </span>
          </label>
          <FieldError errors={state.errors?.credencial_estudiantil} />
        </div>

        {/* Términos */}
        <div>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              cursor: "pointer",
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
            }}
          >
            <input
              type="checkbox"
              name="acepta_terminos"
              required
              aria-required="true"
              aria-describedby={state.errors?.acepta_terminos ? "terminos-error" : undefined}
              aria-invalid={!!state.errors?.acepta_terminos}
              style={{ accentColor: "var(--navy)", marginTop: 2, width: 16, height: 16 }}
            />
            <span>
              Acepto los{" "}
              <a
                href="/terminos"
                style={{ color: "var(--navy)", fontWeight: 500 }}
                target="_blank"
              >
                términos y condiciones
              </a>{" "}
              y autorizo el tratamiento de mis datos personales conforme al aviso de privacidad.{" "}
              <span aria-hidden="true" style={{ color: "var(--error)" }}>*</span>
            </span>
          </label>
          <span id="terminos-error">
            <FieldError errors={state.errors?.acepta_terminos} />
          </span>
        </div>

        <SubmitButton />

        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>
          El pago se coordina por separado vía transferencia o factura. Recibirás instrucciones en tu correo.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          form .grid-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-body)",
  fontWeight: 500,
  fontSize: "0.8125rem",
  color: "var(--text-primary)",
  marginBottom: "6px",
  letterSpacing: "0.01em",
};

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "10px 14px",
  border: `1px solid ${hasError ? "var(--error)" : "var(--border)"}`,
  borderRadius: 6,
  fontFamily: "var(--font-body)",
  fontSize: "0.9375rem",
  color: "var(--text-primary)",
  background: "#fff",
  outline: "none",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
});
