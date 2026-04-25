"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { Send, FileText, Loader2, AlertCircle } from "lucide-react";
import { registrarAsistente, type RegistroState } from "@/app/actions/registro";
import { toast } from "sonner";

type Language = "es" | "en";

// Field name → input element id, used to focus the first invalid field after a
// failed submit. Order matches visual layout for consistent UX.
const FIELD_TO_INPUT_ID: Array<{ field: string; id: string }> = [
  { field: "nombre", id: "reg-nombre" },
  { field: "apellido", id: "reg-apellido" },
  { field: "email", id: "reg-email" },
  { field: "empresa", id: "reg-empresa" },
  { field: "cargo", id: "reg-cargo" },
  { field: "telefono", id: "reg-telefono" },
  { field: "tipo_acceso", id: "reg-tipo" },
  { field: "credencial_estudiantil", id: "reg-credencial" },
  { field: "rfc", id: "reg-rfc" },
  { field: "razon_social", id: "reg-razon" },
  { field: "codigo_postal_fiscal", id: "reg-cp" },
  { field: "acepta_terminos", id: "reg-terminos" },
];

const formText = {
  es: {
    successTitle: "¡Registro Exitoso!",
    accessFolio: "Tu Folio de Acceso",
    websiteLabel: "Website (no llenar)",
    firstName: "Nombre(s)",
    firstNamePlaceholder: "Ej. María",
    lastName: "Apellidos",
    lastNamePlaceholder: "Ej. González López",
    email: "Correo Corporativo",
    emailPlaceholder: "nombre@empresa.com",
    company: "Empresa",
    companyPlaceholder: "Nombre de la empresa",
    role: "Cargo",
    rolePlaceholder: "Ej. Director de Logística",
    phone: "Teléfono Móvil",
    phonePlaceholder: "+52 899 123 4567",
    accessType: "Tipo de Acceso",
    accessGeneral: "Acceso General — $5,800 MXN",
    accessVip: "Acceso VIP — $7,200 MXN",
    accessStudent: "Acceso Estudiante — $1,200 MXN",
    studentNotice:
      "Al seleccionar acceso Estudiante, entiendo que deberé presentar credencial estudiantil física y vigente el día del evento.",
    requiresInvoice: "Requiero factura (CFDI)",
    invoiceData: "Datos de Facturación",
    rfc: "RFC",
    rfcPlaceholder: "XAXX010101000",
    legalName: "Razón Social",
    legalNamePlaceholder: "Ej. Mi Empresa S.A. de C.V.",
    zip: "Código Postal Fiscal",
    zipPlaceholder: "Ej. 88500",
    termsPrefix: "Acepto los",
    terms: "Términos y Condiciones",
    termsMiddle: "del evento, y entiendo que mis datos serán resguardados conforme al",
    privacy: "Aviso de Privacidad",
    termsSuffix: "de Lanz Logistics.",
    pending: "Procesando su registro...",
    submit: "Completar Registro",
    successToastTitle: "¡Operación Exitosa!",
    errorToastTitle: "Aviso",
    errorSummaryHeading: "Hay errores en tu registro",
    errorSummaryBody: (n: number) =>
      n === 1
        ? "Corrige el campo marcado debajo para continuar."
        : `Corrige los ${n} campos marcados debajo para continuar.`,
  },
  en: {
    successTitle: "Registration Successful!",
    accessFolio: "Your Access Code",
    websiteLabel: "Website (leave blank)",
    firstName: "First name(s)",
    firstNamePlaceholder: "e.g., Maria",
    lastName: "Last name(s)",
    lastNamePlaceholder: "e.g., Gonzalez Lopez",
    email: "Corporate Email",
    emailPlaceholder: "name@company.com",
    company: "Company",
    companyPlaceholder: "Company name",
    role: "Job Title",
    rolePlaceholder: "e.g., Logistics Director",
    phone: "Mobile Phone",
    phonePlaceholder: "+1 956 123 4567",
    accessType: "Access Type",
    accessGeneral: "General Pass — $5,800 MXN",
    accessVip: "VIP Pass — $7,200 MXN",
    accessStudent: "Student Pass — $1,200 MXN",
    studentNotice:
      "By selecting Student pass, I understand I must present a valid physical student ID on event day.",
    requiresInvoice: "I need an invoice (CFDI)",
    invoiceData: "Billing Information",
    rfc: "Tax ID (RFC)",
    rfcPlaceholder: "XAXX010101000",
    legalName: "Legal Business Name",
    legalNamePlaceholder: "e.g., My Company LLC",
    zip: "Tax ZIP Code",
    zipPlaceholder: "e.g., 88500",
    termsPrefix: "I accept the",
    terms: "Terms and Conditions",
    termsMiddle: "of the event and understand that my data will be handled according to the",
    privacy: "Privacy Notice",
    termsSuffix: "of Lanz Logistics.",
    pending: "Processing your registration...",
    submit: "Complete Registration",
    successToastTitle: "Success!",
    errorToastTitle: "Notice",
    errorSummaryHeading: "Your registration has errors",
    errorSummaryBody: (n: number) =>
      n === 1
        ? "Fix the highlighted field below to continue."
        : `Fix the ${n} highlighted fields below to continue.`,
  },
} as const;

/* ─── Shared input styles for Corporate Aesthetic ── */
const inputClass =
  "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";

const labelClass = "block text-sm font-semibold text-slate-700 mb-1.5";

const errorClass = "text-xs text-red-500 mt-1.5 flex items-center gap-1";
const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/* ─── Initial state ────────────────────────────────────────────────────────── */
const initialState: RegistroState = {
  success: false,
  message: "",
};

/* ─── Component ────────────────────────────────────────────────────────────── */
export default function RegistroForm({ language = "es" }: { language?: Language }) {
  const [state, formAction, isPending] = useActionState(
    registrarAsistente,
    initialState,
  );
  const [requiresCFDI, setRequiresCFDI] = useState(false);
  const [utms, setUtms] = useState({ source: "", medium: "", campaign: "" });
  const text = formText[language];
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);

  /* ── UTM capture from URL ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUtms({
      source: params.get("utm_source") ?? "",
      medium: params.get("utm_medium") ?? "",
      campaign: params.get("utm_campaign") ?? "",
    });
  }, []);

  /* ── Toasts Feedback ── */
  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(text.successToastTitle, {
          description: state.message,
        });
      } else {
        toast.error(text.errorToastTitle, {
          description: state.message,
        });
      }
    }
  }, [state, text.errorToastTitle, text.successToastTitle]);

  /* ── A11y: after a failed submit, move focus to the error summary so
   *    screen-reader users hear the alert, then scroll the first invalid
   *    field into view. */
  useEffect(() => {
    if (state.success || !state.errors) return;
    if (errorSummaryRef.current) {
      errorSummaryRef.current.focus({ preventScroll: false });
    }
    const firstErroredField = FIELD_TO_INPUT_ID.find(
      ({ field }) => state.errors?.[field as keyof typeof state.errors],
    );
    if (firstErroredField) {
      const el = document.getElementById(firstErroredField.id);
      if (el) {
        // Defer so the summary scroll completes first; we want both visible.
        setTimeout(() => {
          (el as HTMLInputElement).focus({ preventScroll: true });
        }, 100);
      }
    }
  }, [state]);

  const errorCount = state.errors
    ? Object.keys(state.errors).filter((k) => k !== "_form").length
    : 0;

  if (state.success) {
    return (
      <div className="animate-scale-in flex flex-col items-center justify-center py-12 text-center">
        {/* Animated SVG checkmark — circle fades in, path draws itself */}
        <div className="check-circle-bg w-20 h-20 mb-6">
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="40" cy="40" r="38" fill="#F0FDF4" stroke="#22C55E" strokeWidth="2" />
            <path
              className="check-draw"
              d="M22 41 L34 53 L58 29"
              stroke="#22C55E"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
        <h3
          className="text-2xl font-bold mb-3 text-slate-900"
          style={{ fontFamily: "var(--font-oswald)" }}
        >
          {text.successTitle}
        </h3>
        {state.folio && (
          <div className="inline-flex flex-col items-center gap-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl mb-6">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {text.accessFolio}
            </span>
            <span
              className="text-2xl font-bold text-blue-600"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              {state.folio}
            </span>
          </div>
        )}
        <p className="text-slate-600 text-sm leading-relaxed max-w-sm">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="utm_source" value={utms.source} />
      <input type="hidden" name="utm_medium" value={utms.medium} />
      <input type="hidden" name="utm_campaign" value={utms.campaign} />
      <input type="hidden" name="language" value={language} />

      {errorCount > 0 && (
        <div
          ref={errorSummaryRef}
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
          className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
          <div className="text-sm leading-snug">
            <p className="font-semibold">{text.errorSummaryHeading}</p>
            <p>{text.errorSummaryBody(errorCount)}</p>
          </div>
        </div>
      )}

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "auto",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        <label htmlFor="reg-website">{text.websiteLabel}</label>
        <input
          id="reg-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="reg-nombre" className={labelClass}>{text.firstName}</label>
          <input
            id="reg-nombre"
            name="nombre"
            type="text"
            required
            autoComplete="given-name"
            placeholder={text.firstNamePlaceholder}
            className={inputClass}
            aria-describedby={state.errors?.nombre ? "err-nombre" : undefined}
            aria-invalid={state.errors?.nombre ? true : undefined}
          />
          {state.errors?.nombre && (
            <p id="err-nombre" role="alert" className={errorClass}>{state.errors.nombre[0]}</p>
          )}
        </div>
        <div>
          <label htmlFor="reg-apellido" className={labelClass}>{text.lastName}</label>
          <input
            id="reg-apellido"
            name="apellido"
            type="text"
            required
            autoComplete="family-name"
            placeholder={text.lastNamePlaceholder}
            className={inputClass}
            aria-describedby={state.errors?.apellido ? "err-apellido" : undefined}
            aria-invalid={state.errors?.apellido ? true : undefined}
          />
          {state.errors?.apellido && (
            <p id="err-apellido" role="alert" className={errorClass}>{state.errors.apellido[0]}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="reg-email" className={labelClass}>{text.email}</label>
        <input
          id="reg-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={text.emailPlaceholder}
          className={inputClass}
          aria-describedby={state.errors?.email ? "err-email" : undefined}
          aria-invalid={state.errors?.email ? true : undefined}
        />
        {state.errors?.email && (
          <p id="err-email" role="alert" className={errorClass}>{state.errors.email[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="reg-empresa" className={labelClass}>{text.company}</label>
          <input
            id="reg-empresa"
            name="empresa"
            type="text"
            required
            autoComplete="organization"
            placeholder={text.companyPlaceholder}
            className={inputClass}
            aria-describedby={state.errors?.empresa ? "err-empresa" : undefined}
            aria-invalid={state.errors?.empresa ? true : undefined}
          />
          {state.errors?.empresa && (
            <p id="err-empresa" role="alert" className={errorClass}>{state.errors.empresa[0]}</p>
          )}
        </div>
        <div>
          <label htmlFor="reg-cargo" className={labelClass}>{text.role}</label>
          <input
            id="reg-cargo"
            name="cargo"
            type="text"
            required
            autoComplete="organization-title"
            placeholder={text.rolePlaceholder}
            className={inputClass}
            aria-describedby={state.errors?.cargo ? "err-cargo" : undefined}
            aria-invalid={state.errors?.cargo ? true : undefined}
          />
          {state.errors?.cargo && (
            <p id="err-cargo" role="alert" className={errorClass}>{state.errors.cargo[0]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="reg-telefono" className={labelClass}>{text.phone}</label>
          <input
            id="reg-telefono"
            name="telefono"
            type="tel"
            autoComplete="tel"
            placeholder={text.phonePlaceholder}
            className={inputClass}
            aria-describedby={state.errors?.telefono ? "err-telefono" : undefined}
            aria-invalid={state.errors?.telefono ? true : undefined}
          />
          {state.errors?.telefono && (
            <p id="err-telefono" role="alert" className={errorClass}>{state.errors.telefono[0]}</p>
          )}
        </div>
        <div>
          <label htmlFor="reg-tipo" className={labelClass}>{text.accessType}</label>
          <select
            id="reg-tipo"
            name="tipo_acceso"
            defaultValue="general"
            className={inputClass}
            aria-describedby={state.errors?.tipo_acceso ? "err-tipo" : undefined}
            aria-invalid={state.errors?.tipo_acceso ? true : undefined}
          >
            <option value="general">{text.accessGeneral}</option>
            <option value="vip">{text.accessVip}</option>
            <option value="estudiante">{text.accessStudent}</option>
          </select>
          {state.errors?.tipo_acceso && (
            <p id="err-tipo" role="alert" className={errorClass}>{state.errors.tipo_acceso[0]}</p>
          )}
        </div>
      </div>

      <div>
        <label className="flex items-start gap-3 cursor-pointer p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <input
            id="reg-credencial"
            type="checkbox"
            name="credencial_estudiantil"
            className="w-5 h-5 mt-0.5 border-slate-300 rounded text-blue-600 focus:ring-blue-500"
            aria-describedby={state.errors?.credencial_estudiantil ? "err-credencial" : undefined}
            aria-invalid={state.errors?.credencial_estudiantil ? true : undefined}
          />
          <span className="text-sm text-blue-900 leading-snug">{text.studentNotice}</span>
        </label>
        {state.errors?.credencial_estudiantil && (
          <p id="err-credencial" role="alert" className={errorClass}>{state.errors.credencial_estudiantil[0]}</p>
        )}
      </div>

      <hr className="border-slate-200" />

      <div>
        <label htmlFor="reg-cfdi-toggle" className="flex items-center gap-3 cursor-pointer select-none">
          <span className="relative">
            <input
              id="reg-cfdi-toggle"
              type="checkbox"
              name="requiere_cfdi"
              value="true"
              checked={requiresCFDI}
              onChange={(e) => setRequiresCFDI(e.target.checked)}
              className="sr-only peer"
              aria-expanded={requiresCFDI}
              aria-controls="cfdi-panel"
            />
            <span className="block w-12 h-6 bg-slate-200 peer-checked:bg-blue-600 rounded-full transition-colors" />
            <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-6 transition-transform shadow-sm" />
          </span>
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" aria-hidden="true" />
            <span className="text-sm font-semibold text-slate-700">{text.requiresInvoice}</span>
          </span>
        </label>
      </div>

      {/* CFDI panel — CSS grid height animation (0fr → 1fr) avoids JS measurement.
          aria-live="polite" announces the panel state change to screen readers
          when the user toggles the CFDI switch. */}
      <div
        id="cfdi-panel"
        className="cfdi-panel"
        data-open={requiresCFDI ? "true" : "false"}
        aria-live="polite"
      >
        <div className="cfdi-panel-inner">
          <div className="space-y-5 p-6 bg-slate-50 border border-slate-200 rounded-xl mt-4">
            <p className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">{text.invoiceData}</p>
            <div>
              <label htmlFor="reg-rfc" className={labelClass}>{text.rfc}</label>
              <input
                id="reg-rfc"
                name="rfc"
                type="text"
                placeholder={text.rfcPlaceholder}
                className={inputClass}
                maxLength={13}
                aria-required={requiresCFDI || undefined}
                aria-describedby={state.errors?.rfc ? "err-rfc" : undefined}
                aria-invalid={state.errors?.rfc ? true : undefined}
              />
              {state.errors?.rfc && (
                <p id="err-rfc" role="alert" className={errorClass}>{state.errors.rfc[0]}</p>
              )}
            </div>
            <div>
              <label htmlFor="reg-razon" className={labelClass}>{text.legalName}</label>
              <input
                id="reg-razon"
                name="razon_social"
                type="text"
                placeholder={text.legalNamePlaceholder}
                className={inputClass}
                aria-required={requiresCFDI || undefined}
                aria-describedby={state.errors?.razon_social ? "err-razon" : undefined}
                aria-invalid={state.errors?.razon_social ? true : undefined}
              />
              {state.errors?.razon_social && (
                <p id="err-razon" role="alert" className={errorClass}>{state.errors.razon_social[0]}</p>
              )}
            </div>
            <div>
              <label htmlFor="reg-cp" className={labelClass}>{text.zip}</label>
              <input
                id="reg-cp"
                name="codigo_postal_fiscal"
                type="text"
                placeholder={text.zipPlaceholder}
                className={inputClass}
                maxLength={5}
                inputMode="numeric"
                aria-required={requiresCFDI || undefined}
                aria-describedby={state.errors?.codigo_postal_fiscal ? "err-cp" : undefined}
                aria-invalid={state.errors?.codigo_postal_fiscal ? true : undefined}
              />
              {state.errors?.codigo_postal_fiscal && (
                <p id="err-cp" role="alert" className={errorClass}>{state.errors.codigo_postal_fiscal[0]}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <label
          className={`flex items-start gap-3 cursor-pointer rounded-md p-2 -m-2 ${
            state.errors?.acepta_terminos ? "border border-red-300 bg-red-50" : ""
          }`}
        >
          <input
            id="reg-terminos"
            type="checkbox"
            name="acepta_terminos"
            required
            className="w-5 h-5 mt-0.5 border-slate-300 rounded text-blue-600 focus:ring-blue-500 focus-visible:ring-2"
            aria-describedby={state.errors?.acepta_terminos ? "err-terminos" : undefined}
            aria-invalid={state.errors?.acepta_terminos ? true : undefined}
          />
          <span className="text-sm text-slate-600 leading-snug">
            {text.termsPrefix}{" "}
            <a href="/terminos-y-condiciones" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
              {text.terms}
            </a>{" "}
            {text.termsMiddle}{" "}
            <a href="/aviso-de-privacidad" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
              {text.privacy}
            </a>{" "}
            {text.termsSuffix}
          </span>
        </label>
        {state.errors?.acepta_terminos && (
          <p id="err-terminos" role="alert" className={errorClass}>{state.errors.acepta_terminos[0]}</p>
        )}
      </div>

      {turnstileSiteKey && (
        <div
          className="cf-turnstile"
          data-sitekey={turnstileSiteKey}
          data-theme="light"
          data-size="flexible"
        />
      )}

      <button type="submit" disabled={isPending} className="btn-primary w-full py-4 text-base mt-2">
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {text.pending}
          </>
        ) : (
          <>
            {text.submit}
            <Send className="w-4 h-4 ml-1" />
          </>
        )}
      </button>
    </form>
  );
}
