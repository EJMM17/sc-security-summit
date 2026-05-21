import { AlertCircle, FileText } from "lucide-react";
import { submitRegistroForm } from "@/app/actions/registro";
import type { RegistroFlashState } from "@/lib/registro-form-state";
import RegistroFormEnhancer from "./RegistroFormEnhancer";
import RegistroSubmitButton from "./RegistroSubmitButton";
import { ACCESO_OPTIONS } from "@/lib/constants";

type Language = "es" | "en";

const _opt = (v: "general" | "vip" | "estudiante") =>
  ACCESO_OPTIONS.find((o) => o.value === v)!;
const _label = (v: "general" | "vip" | "estudiante") => {
  const o = _opt(v);
  return `${o.price} ${o.currency}`;
};

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
    accessGeneral: `Acceso General — ${_label("general")}`,
    accessVip: `Acceso VIP — ${_label("vip")}`,
    accessStudent: `Acceso Estudiante — ${_label("estudiante")}`,
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
    legendPersonal: "Datos personales",
    legendAccess: "Tipo de acceso",
    legendBilling: "Datos de facturación (CFDI)",
    legendTerms: "Términos y condiciones",
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
    accessGeneral: `General Pass — ${_label("general")}`,
    accessVip: `VIP Pass — ${_label("vip")}`,
    accessStudent: `Student Pass — ${_label("estudiante")}`,
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
    legendPersonal: "Personal information",
    legendAccess: "Access type",
    legendBilling: "Billing information (CFDI)",
    legendTerms: "Terms and conditions",
  },
} as const;

/* ─── Shared input styles for Corporate Aesthetic ── */
const inputClass =
  "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";

const labelClass = "block text-sm font-semibold text-slate-700 mb-1.5";

const errorClass = "text-xs text-red-500 mt-1.5 flex items-center gap-1";
const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
type PersistedValues = NonNullable<RegistroFlashState["values"]>;

type TextFieldProps = {
  name: keyof PersistedValues;
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
  inputMode?: "numeric" | "text";
  errors?: string[];
  ariaRequired?: boolean;
  defaultValue?: string;
};

function TextField({
  name,
  id,
  label,
  type = "text",
  required,
  autoComplete,
  placeholder,
  maxLength,
  inputMode,
  errors,
  ariaRequired,
  defaultValue,
}: TextFieldProps) {
  const errorId = errors?.length ? `err-${id.replace("reg-", "")}` : undefined;

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={inputClass}
        maxLength={maxLength}
        inputMode={inputMode}
        aria-required={ariaRequired || undefined}
        aria-describedby={errorId}
        aria-invalid={errors?.length ? true : undefined}
        defaultValue={defaultValue}
      />
      {errors?.[0] && (
        <p id={errorId} role="alert" className={errorClass}>
          {errors[0]}
        </p>
      )}
    </div>
  );
}

function getValue(values: PersistedValues | undefined, key: keyof PersistedValues): string {
  const value = values?.[key];
  return typeof value === "string" ? value : "";
}

function getChecked(values: PersistedValues | undefined, key: keyof PersistedValues): boolean {
  return values?.[key] === true;
}

/* ─── Component ────────────────────────────────────────────────────────────── */
export default function RegistroForm({
  language = "es",
  state = null,
  utms,
}: {
  language?: Language;
  state?: RegistroFlashState | null;
  utms?: { source?: string; medium?: string; campaign?: string };
}) {
  const text = formText[language];
  const values = state?.values;
  const errors = state?.errors;
  const errorCount = errors ? Object.keys(errors).filter((key) => key !== "_form").length : 0;
  const requiresCFDI = getChecked(values, "requiere_cfdi");

  if (state?.success) {
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
        {state?.folio && (
          <div className="inline-flex flex-col items-center gap-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl mb-6">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {text.accessFolio}
            </span>
            <span
              className="text-2xl font-bold text-blue-600"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              {state?.folio}
            </span>
          </div>
        )}
        <p className="text-slate-600 text-sm leading-relaxed max-w-sm">{state?.message}</p>
      </div>
    );
  }

  return (
    <form action={submitRegistroForm} className="space-y-6" noValidate>
      <RegistroFormEnhancer state={state} language={language} />
      <input type="hidden" name="utm_source" value={utms?.source ?? ""} />
      <input type="hidden" name="utm_medium" value={utms?.medium ?? ""} />
      <input type="hidden" name="utm_campaign" value={utms?.campaign ?? ""} />
      <input type="hidden" name="language" value={language} />

      {errorCount > 0 && (
        <div
          id="registro-error-summary"
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
          className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
          <div className="text-sm leading-snug">
            <p className="font-semibold">{text.errorSummaryHeading}</p>
            <p>{text.errorSummaryBody(errorCount)}</p>
            {errors?._form?.[0] && <p className="mt-1">{errors._form[0]}</p>}
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
        <label htmlFor="reg-confirm-email">{text.websiteLabel}</label>
        <input
          id="reg-confirm-email"
          name="confirm_email"
          type="text"
          tabIndex={-1}
          autoComplete="new-password"
        />
      </div>

      {/* Personal information */}
      <fieldset className="border-0 p-0 m-0 space-y-5">
        <legend className="sr-only">{text.legendPersonal}</legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <TextField
            id="reg-nombre"
            name="nombre"
            label={text.firstName}
            required
            autoComplete="given-name"
            placeholder={text.firstNamePlaceholder}
            errors={errors?.nombre}
            defaultValue={getValue(values, "nombre")}
          />
          <TextField
            id="reg-apellido"
            name="apellido"
            label={text.lastName}
            required
            autoComplete="family-name"
            placeholder={text.lastNamePlaceholder}
            errors={errors?.apellido}
            defaultValue={getValue(values, "apellido")}
          />
        </div>

        <TextField
          id="reg-email"
          name="email"
          label={text.email}
          type="email"
          required
          autoComplete="email"
          placeholder={text.emailPlaceholder}
          errors={errors?.email}
          defaultValue={getValue(values, "email")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <TextField
            id="reg-empresa"
            name="empresa"
            label={text.company}
            required
            autoComplete="organization"
            placeholder={text.companyPlaceholder}
            errors={errors?.empresa}
            defaultValue={getValue(values, "empresa")}
          />
          <TextField
            id="reg-cargo"
            name="cargo"
            label={text.role}
            required
            autoComplete="organization-title"
            placeholder={text.rolePlaceholder}
            errors={errors?.cargo}
            defaultValue={getValue(values, "cargo")}
          />
        </div>

        <TextField
          id="reg-telefono"
          name="telefono"
          label={text.phone}
          type="tel"
          autoComplete="tel"
          placeholder={text.phonePlaceholder}
          errors={errors?.telefono}
          defaultValue={getValue(values, "telefono")}
        />
      </fieldset>

      {/* Access type */}
      <fieldset className="border-0 p-0 m-0 space-y-5">
        <legend className="sr-only">{text.legendAccess}</legend>

        <div>
          <label htmlFor="reg-tipo" className={labelClass}>
            {text.accessType}
          </label>
          <select
            id="reg-tipo"
            name="tipo_acceso"
            defaultValue={getValue(values, "tipo_acceso") || "general"}
            className={inputClass}
            aria-describedby={errors?.tipo_acceso ? "err-tipo" : undefined}
            aria-invalid={errors?.tipo_acceso ? true : undefined}
          >
            <option value="general">{text.accessGeneral}</option>
            <option value="vip">{text.accessVip}</option>
            <option value="estudiante">{text.accessStudent}</option>
          </select>
          {errors?.tipo_acceso && (
            <p id="err-tipo" role="alert" className={errorClass}>
              {errors.tipo_acceso[0]}
            </p>
          )}
        </div>

        <div>
          <label className="flex items-start gap-3 cursor-pointer p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <input
              id="reg-credencial"
              type="checkbox"
              name="credencial_estudiantil"
              className="w-5 h-5 mt-0.5 border-slate-300 rounded text-blue-600 focus:ring-blue-500"
              aria-describedby={errors?.credencial_estudiantil ? "err-credencial" : undefined}
              aria-invalid={errors?.credencial_estudiantil ? true : undefined}
              defaultChecked={getChecked(values, "credencial_estudiantil")}
            />
            <span className="text-sm text-blue-900 leading-snug">{text.studentNotice}</span>
          </label>
          {errors?.credencial_estudiantil && (
            <p id="err-credencial" role="alert" className={errorClass}>
              {errors.credencial_estudiantil[0]}
            </p>
          )}
        </div>
      </fieldset>

      <hr className="border-slate-200" />

      {/* Billing / CFDI */}
      <fieldset className="border-0 p-0 m-0 space-y-5">
        <legend className="sr-only">{text.legendBilling}</legend>

        <div>
          <input
            id="reg-cfdi-toggle"
            type="checkbox"
            name="requiere_cfdi"
            value="true"
            defaultChecked={requiresCFDI}
            className="cfdi-toggle-peer sr-only peer"
            aria-expanded={requiresCFDI}
            aria-controls="cfdi-panel"
          />
          <label htmlFor="reg-cfdi-toggle" className="flex items-center gap-3 cursor-pointer select-none">
            <span className="relative">
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
          aria-live="polite"
        >
          <div className="cfdi-panel-inner">
            <div className="space-y-5 p-6 bg-slate-50 border border-slate-200 rounded-xl mt-4">
              <p className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">{text.invoiceData}</p>
              <TextField
                id="reg-rfc"
                name="rfc"
                label={text.rfc}
                placeholder={text.rfcPlaceholder}
                maxLength={13}
                ariaRequired={requiresCFDI}
                errors={errors?.rfc}
                defaultValue={getValue(values, "rfc")}
              />
              <TextField
                id="reg-razon"
                name="razon_social"
                label={text.legalName}
                placeholder={text.legalNamePlaceholder}
                ariaRequired={requiresCFDI}
                errors={errors?.razon_social}
                defaultValue={getValue(values, "razon_social")}
              />
              <TextField
                id="reg-cp"
                name="codigo_postal_fiscal"
                label={text.zip}
                placeholder={text.zipPlaceholder}
                maxLength={5}
                inputMode="numeric"
                ariaRequired={requiresCFDI}
                errors={errors?.codigo_postal_fiscal}
                defaultValue={getValue(values, "codigo_postal_fiscal")}
              />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Terms and conditions */}
      <fieldset className="border-0 p-0 m-0 pt-2">
        <legend className="sr-only">{text.legendTerms}</legend>

        <div>
          <label
            className={`flex items-start gap-3 cursor-pointer rounded-md p-2 -m-2 ${
              errors?.acepta_terminos ? "border border-red-300 bg-red-50" : ""
            }`}
          >
            <input
              id="reg-terminos"
              type="checkbox"
              name="acepta_terminos"
              required
              className="w-5 h-5 mt-0.5 border-slate-300 rounded text-blue-600 focus:ring-blue-500 focus-visible:ring-2"
              aria-describedby={errors?.acepta_terminos ? "err-terminos" : undefined}
              aria-invalid={errors?.acepta_terminos ? true : undefined}
              defaultChecked={getChecked(values, "acepta_terminos")}
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
          {errors?.acepta_terminos && (
            <p id="err-terminos" role="alert" className={errorClass}>
              {errors.acepta_terminos[0]}
            </p>
          )}
        </div>
      </fieldset>

      {turnstileSiteKey && (
        <div
          className="cf-turnstile"
          data-sitekey={turnstileSiteKey}
          data-theme="light"
          data-size="flexible"
        />
      )}

      <RegistroSubmitButton pendingLabel={text.pending} idleLabel={text.submit} />
    </form>
  );
}
