"use client";

import { useActionState, useState, useEffect } from "react";
import { Send, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { registrarAsistente, type RegistroState } from "@/app/actions/registro";
import { ACCESO_OPTIONS } from "@/lib/constants";
import { toast } from "sonner";

/* ─── Shared input styles for Corporate Aesthetic ── */
const inputClass =
  "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";

const labelClass =
  "block text-sm font-semibold text-slate-700 mb-1.5";

const errorClass =
  "text-xs text-red-500 mt-1.5 flex items-center gap-1";

/* ─── Initial state ────────────────────────────────────────────────────────── */
const initialState: RegistroState = {
  success: false,
  message: "",
};

/* ─── Component ────────────────────────────────────────────────────────────── */
export default function RegistroForm() {
  const [state, formAction, isPending] = useActionState(
    registrarAsistente,
    initialState
  );
  const [requiresCFDI, setRequiresCFDI] = useState(false);
  const [utms, setUtms] = useState({ source: "", medium: "", campaign: "" });

  /* ── UTM capture from URL ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUtms({
      source: params.get("utm_source") ?? "",
      medium: params.get("utm_medium") ?? "",
      campaign: params.get("utm_campaign") ?? "",
    });
  }, []);

  /* ── Cloudflare Turnstile script loader ── */
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  /* ── Toasts Feedback — solo errores (éxito se muestra en pantalla) ── */
  useEffect(() => {
    if (state.message && !state.success) {
      toast.error("Aviso", { description: state.message });
    }
  }, [state]);

  /* ── Success screen ── */
  if (state.success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h3
          className="text-2xl font-bold mb-3 text-slate-900"
          style={{ fontFamily: "var(--font-oswald)" }}
        >
          ¡Registro Exitoso!
        </h3>
        {state.folio && (
          <div className="inline-flex flex-col items-center gap-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl mb-6">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tu Folio de Acceso
            </span>
            <span
              className="text-2xl font-bold text-blue-600"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              {state.folio}
            </span>
          </div>
        )}
        <p className="text-slate-600 text-sm leading-relaxed max-w-sm">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">

      {/* UTM attribution — hidden, populated from URL params */}
      <input type="hidden" name="utm_source" value={utms.source} />
      <input type="hidden" name="utm_medium" value={utms.medium} />
      <input type="hidden" name="utm_campaign" value={utms.campaign} />

      {/* Honeypot anti-spam: invisible para humanos, los bots lo llenan */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", top: "auto", width: "1px", height: "1px", overflow: "hidden" }}>
        <label htmlFor="reg-website">Website (no llenar)</label>
        <input
          id="reg-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Nombre + Apellido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="reg-nombre" className={labelClass}>
            Nombre(s)
          </label>
          <input
            id="reg-nombre"
            name="nombre"
            type="text"
            required
            placeholder="Ej. María"
            className={inputClass}
          />
          {state.errors?.nombre && (
            <p className={errorClass}>{state.errors.nombre[0]}</p>
          )}
        </div>
        <div>
          <label htmlFor="reg-apellido" className={labelClass}>
            Apellidos
          </label>
          <input
            id="reg-apellido"
            name="apellido"
            type="text"
            required
            placeholder="Ej. González López"
            className={inputClass}
          />
          {state.errors?.apellido && (
            <p className={errorClass}>{state.errors.apellido[0]}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="reg-email" className={labelClass}>
          Correo Corporativo
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          required
          placeholder="nombre@empresa.com"
          className={inputClass}
        />
        {state.errors?.email && (
          <p className={errorClass}>{state.errors.email[0]}</p>
        )}
      </div>

      {/* Empresa + Cargo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="reg-empresa" className={labelClass}>
            Empresa
          </label>
          <input
            id="reg-empresa"
            name="empresa"
            type="text"
            required
            placeholder="Nombre de la empresa"
            className={inputClass}
          />
          {state.errors?.empresa && (
            <p className={errorClass}>{state.errors.empresa[0]}</p>
          )}
        </div>
        <div>
          <label htmlFor="reg-cargo" className={labelClass}>
            Cargo
          </label>
          <input
            id="reg-cargo"
            name="cargo"
            type="text"
            required
            placeholder="Ej. Director de Logística"
            className={inputClass}
          />
          {state.errors?.cargo && (
            <p className={errorClass}>{state.errors.cargo[0]}</p>
          )}
        </div>
      </div>

      {/* Teléfono + Tipo de acceso */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="reg-telefono" className={labelClass}>
            Teléfono Móvil
          </label>
          <input
            id="reg-telefono"
            name="telefono"
            type="tel"
            placeholder="+52 899 123 4567"
            className={inputClass}
          />
          {state.errors?.telefono && (
            <p className={errorClass}>{state.errors.telefono[0]}</p>
          )}
        </div>
        <div>
          <label htmlFor="reg-tipo" className={labelClass}>
            Tipo de Acceso
          </label>
          <select
            id="reg-tipo"
            name="tipo_acceso"
            defaultValue="general"
            className={inputClass}
          >
            {ACCESO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Acceso {opt.label.charAt(0) + opt.label.slice(1).toLowerCase()} — {opt.price} MXN
              </option>
            ))}
          </select>
          {state.errors?.tipo_acceso && (
            <p className={errorClass}>{state.errors.tipo_acceso[0]}</p>
          )}
        </div>
      </div>

      {/* Credencial estudiantil */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <input
            type="checkbox"
            name="credencial_estudiantil"
            className="w-5 h-5 mt-0.5 border-slate-300 rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-blue-900 leading-snug">
            Al seleccionar acceso Estudiante, entiendo que deberé presentar <strong>credencial estudiantil física y vigente</strong> el día del evento.
          </span>
        </label>
        {state.errors?.credencial_estudiantil && (
          <p className={errorClass}>
            {state.errors.credencial_estudiantil[0]}
          </p>
        )}
      </div>

      <hr className="border-slate-200" />

      {/* CFDI Toggle */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <span className="relative">
            <input
              type="checkbox"
              name="requiere_cfdi"
              value="true"
              checked={requiresCFDI}
              onChange={(e) => setRequiresCFDI(e.target.checked)}
              className="sr-only peer"
            />
            <span className="block w-12 h-6 bg-slate-200 peer-checked:bg-blue-600 rounded-full transition-colors" />
            <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-6 transition-transform shadow-sm" />
          </span>
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">
              Requiero factura (CFDI)
            </span>
          </span>
        </label>
      </div>

      {/* CFDI Fields */}
      {requiresCFDI && (
        <div
          className="space-y-5 p-6 bg-slate-50 border border-slate-200 rounded-xl mt-4"
          aria-expanded="true"
        >
          <p className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">
            Datos de Facturación
          </p>
          <div>
            <label htmlFor="reg-rfc" className={labelClass}>
              RFC
            </label>
            <input
              id="reg-rfc"
              name="rfc"
              type="text"
              required
              placeholder="XAXX010101000"
              className={inputClass}
              maxLength={13}
            />
            {state.errors?.rfc && (
              <p className={errorClass}>{state.errors.rfc[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="reg-razon" className={labelClass}>
              Razón Social
            </label>
            <input
              id="reg-razon"
              name="razon_social"
              type="text"
              required
              placeholder="Ej. Mi Empresa S.A. de C.V."
              className={inputClass}
            />
            {state.errors?.razon_social && (
              <p className={errorClass}>{state.errors.razon_social[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="reg-cp" className={labelClass}>
              Código Postal Fiscal
            </label>
            <input
              id="reg-cp"
              name="codigo_postal_fiscal"
              type="text"
              required
              placeholder="Ej. 88500"
              className={inputClass}
              maxLength={5}
            />
            {state.errors?.codigo_postal_fiscal && (
              <p className={errorClass}>
                {state.errors.codigo_postal_fiscal[0]}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Acepta términos */}
      <div className="pt-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="acepta_terminos"
            required
            className="w-5 h-5 mt-0.5 border-slate-300 rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-600 leading-snug">
            Acepto los{" "}
            <a
              href="/terminos-y-condiciones"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              Términos y Condiciones
            </a>{" "}
            del evento, y entiendo que mis datos serán resguardados conforme al{" "}
            <a
              href="/aviso-de-privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              Aviso de Privacidad
            </a>{" "}
            de Lanz Logistics.
          </span>
        </label>
        {state.errors?.acepta_terminos && (
          <p className={errorClass}>{state.errors.acepta_terminos[0]}</p>
        )}
      </div>

      {/* Cloudflare Turnstile — invisible, valida que no eres bot */}
      <div
        className="cf-turnstile"
        data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        data-theme="light"
        data-size="flexible"
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="btn-primary w-full py-4 text-base mt-2"
      >
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Procesando su registro...
          </>
        ) : (
          <>
            Completar Registro
            <Send className="w-4 h-4 ml-1" />
          </>
        )}
      </button>
    </form>
  );
}
