"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Mail, Phone, ReceiptText, UserRound } from "lucide-react";
import { createTicketCheckout } from "@/app/actions/checkout";
import AttributionCapture from "@/components/AttributionCapture";
import EmptyAttributionFields from "@/components/EmptyAttributionFields";
import { CONTENT } from "@/lib/content";
import { createSubmissionId } from "@/lib/inquiries/client-submit";
import { INQUIRY_CONSENT_VERSION } from "@/lib/inquiries/constants";
import type { Language } from "@/lib/language";
import {
  TICKET_TIERS,
  TICKET_TIER_IDS,
  quoteTicketOrder,
  type TicketTierId,
} from "@/lib/payments/catalog";
import type { CheckoutFailureReason } from "@/lib/payments/result";
import { normalizeRfc, validateRfc } from "@/lib/payments/rfc";
import {
  cfdiUsesForPersonType,
  regimesForPersonType,
  CFDI_USES,
  TAX_REGIMES,
  type TaxPersonType,
} from "@/lib/payments/sat-catalogs";
import { formatMxn } from "@/lib/payments/tax";

type CheckoutStatus =
  | { kind: "idle" }
  | { kind: "redirecting" }
  | { kind: "error"; reason: CheckoutFailureReason };

const MERCADOPAGO_HOST = /^(www\.)?mercadopago\.com(\.[a-z]{2})?$/;

function isSafeCheckoutUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && MERCADOPAGO_HOST.test(url.hostname);
  } catch {
    return false;
  }
}

export default function TicketCheckoutForm({
  language,
  previewDisabled = false,
  initialTier = "plus",
}: {
  language: Language;
  previewDisabled?: boolean;
  /** Preselected by the pricing section so the visitor lands on their plan. */
  initialTier?: TicketTierId;
}) {
  const copy = CONTENT[language].checkout;
  const pricing = CONTENT[language].pricing;

  const [status, setStatus] = useState<CheckoutStatus>({ kind: "idle" });
  const [isSending, setIsSending] = useState(false);
  const [submissionId, setSubmissionId] = useState("");
  const [tier, setTier] = useState<TicketTierId>(initialTier);
  const [quantity, setQuantity] = useState(1);
  const [requiresInvoice, setRequiresInvoice] = useState(false);
  const [rfc, setRfc] = useState("");

  useEffect(() => {
    setSubmissionId(createSubmissionId());
  }, []);

  const maxQuantity = TICKET_TIERS[tier].maxQuantity;

  // Clamping here rather than in the submit handler keeps the live summary
  // honest when the buyer switches from a 10-seat tier to the 2-seat student
  // tier without touching the quantity field.
  useEffect(() => {
    setQuantity((current) => Math.min(current, maxQuantity));
  }, [maxQuantity]);

  const quote = useMemo(() => {
    try {
      return quoteTicketOrder(tier, quantity);
    } catch {
      return null;
    }
  }, [tier, quantity]);

  // The RFC length tells us whether the buyer is a persona física or moral,
  // which is what decides the valid regimes and CFDI uses. Showing the wrong
  // ones is the fastest way to get a CFDI rejected by the PAC.
  const personType: TaxPersonType | null = useMemo(() => {
    const validated = validateRfc(rfc);
    if (validated.valid) return validated.personType;
    const normalized = normalizeRfc(rfc);
    if (normalized.length === 12) return "moral";
    if (normalized.length === 13) return "fisica";
    return null;
  }, [rfc]);

  const regimeOptions = personType ? regimesForPersonType(personType) : TAX_REGIMES;
  const cfdiUseOptions = personType ? cfdiUsesForPersonType(personType) : CFDI_USES;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (previewDisabled) return;

    const form = event.currentTarget;
    const currentSubmissionId = submissionId || createSubmissionId();
    if (!submissionId) setSubmissionId(currentSubmissionId);
    setStatus({ kind: "idle" });
    setIsSending(true);

    try {
      const formData = new FormData(form);
      formData.set("submissionId", currentSubmissionId);
      const result = await createTicketCheckout(formData);

      if (result.ok && isSafeCheckoutUrl(result.checkoutUrl)) {
        // Stay in the sending state: the page is being replaced, and
        // re-enabling the button would invite a second order.
        setStatus({ kind: "redirecting" });
        window.location.assign(result.checkoutUrl);
        return;
      }

      setStatus({
        kind: "error",
        reason: result.ok ? "provider_unavailable" : result.reason,
      });
    } catch {
      setStatus({ kind: "error", reason: "unexpected" });
    } finally {
      // Released unconditionally; the redirect branch returns before this only
      // in the sense that the navigation replaces the page anyway.
      setIsSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="inquiry-form"
      aria-describedby={previewDisabled ? "checkout-preview-disabled" : undefined}
    >
      {previewDisabled && (
        <p
          id="checkout-preview-disabled"
          className="inquiry-status is-error mb-5"
          role="status"
        >
          {copy.previewDisabled}
        </p>
      )}
      <fieldset
        disabled={previewDisabled}
        className="m-0 min-w-0 border-0 p-0 disabled:opacity-60"
      >
        <input type="hidden" name="submissionId" value={submissionId} readOnly />
        <input type="hidden" name="language" value={language} readOnly />
        <input
          type="hidden"
          name="consentVersion"
          value={INQUIRY_CONSENT_VERSION}
          readOnly
        />
        {previewDisabled ? <EmptyAttributionFields /> : <AttributionCapture asInputs />}
        <input
          className="sr-only"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="text-sm font-semibold text-slate-900">
            {copy.tierLegend}
          </legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {TICKET_TIER_IDS.map((id) => {
              const plan = pricing.find((entry) => entry.id === id);
              return (
                <label
                  key={id}
                  className={`checkout-tier ${tier === id ? "is-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="tier"
                    value={id}
                    checked={tier === id}
                    onChange={() => setTier(id)}
                    className="sr-only"
                  />
                  <span className="checkout-tier-name">
                    {plan?.label ?? TICKET_TIERS[id].label[language]}
                  </span>
                  <span className="checkout-tier-price">
                    {formatMxn(TICKET_TIERS[id].unitPriceCents, language)}
                  </span>
                  <span className="checkout-tier-note">
                    {CONTENT[language].ui.taxNote}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <label className="inquiry-field mt-5 max-w-[12rem]">
          <span>{copy.quantity}</span>
          <span className="inquiry-input-wrap">
            <input
              required
              name="quantity"
              type="number"
              min={1}
              max={maxQuantity}
              step={1}
              value={quantity}
              inputMode="numeric"
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10);
                setQuantity(
                  Number.isNaN(next) ? 1 : Math.min(Math.max(next, 1), maxQuantity),
                );
              }}
            />
          </span>
        </label>
        <p className="mt-1 text-xs text-slate-500">
          {copy.quantityHint.replace("{max}", String(maxQuantity))}
        </p>

        <fieldset className="m-0 mt-8 min-w-0 border-0 p-0">
          <legend className="text-sm font-semibold text-slate-900">
            {copy.buyerLegend}
          </legend>
          <div className="mt-3 grid gap-5 sm:grid-cols-2">
            <TextField
              icon={<UserRound aria-hidden="true" />}
              label={copy.firstName}
              name="firstName"
              placeholder={copy.firstNamePlaceholder}
              autoComplete="given-name"
            />
            <TextField
              icon={<UserRound aria-hidden="true" />}
              label={copy.lastName}
              name="lastName"
              placeholder={copy.lastNamePlaceholder}
              autoComplete="family-name"
            />
            <TextField
              icon={<Mail aria-hidden="true" />}
              label={copy.email}
              name="email"
              type="email"
              placeholder={copy.emailPlaceholder}
              autoComplete="email"
            />
            <TextField
              icon={<Phone aria-hidden="true" />}
              label={copy.phone}
              name="phone"
              type="tel"
              placeholder={copy.phonePlaceholder}
              autoComplete="tel"
            />
            <TextField
              icon={<Building2 aria-hidden="true" />}
              label={copy.company}
              name="company"
              placeholder={copy.companyPlaceholder}
              autoComplete="organization"
              required={false}
            />
          </div>
        </fieldset>

        <label className="mt-8 flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            name="requiresInvoice"
            checked={requiresInvoice}
            onChange={(event) => setRequiresInvoice(event.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="inline-flex items-center gap-2 font-semibold">
              <ReceiptText className="h-4 w-4" aria-hidden="true" />
              {copy.invoiceToggle}
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              {copy.invoiceHint}
            </span>
          </span>
        </label>

        {requiresInvoice && (
          <fieldset className="m-0 mt-6 min-w-0 border-0 p-0">
            <legend className="text-sm font-semibold text-slate-900">
              {copy.invoiceLegend}
            </legend>
            <div className="mt-3 grid gap-5 sm:grid-cols-2">
              <label className="inquiry-field">
                <span>{copy.rfc}</span>
                <span className="inquiry-input-wrap">
                  <input
                    required
                    name="rfc"
                    type="text"
                    value={rfc}
                    maxLength={20}
                    placeholder={copy.rfcPlaceholder}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(event) => setRfc(event.target.value.toUpperCase())}
                  />
                </span>
              </label>
              <TextField
                icon={<Building2 aria-hidden="true" />}
                label={copy.legalName}
                name="legalName"
                placeholder={copy.legalNamePlaceholder}
                autoComplete="organization"
              />
              <SelectField
                label={copy.taxRegime}
                name="taxRegime"
                placeholder={copy.selectPlaceholder}
                options={regimeOptions.map((entry) => ({
                  value: entry.code,
                  label: `${entry.code} — ${entry.label[language]}`,
                }))}
              />
              <SelectField
                label={copy.cfdiUse}
                name="cfdiUse"
                placeholder={copy.selectPlaceholder}
                options={cfdiUseOptions.map((entry) => ({
                  value: entry.code,
                  label: `${entry.code} — ${entry.label[language]}`,
                }))}
              />
              <TextField
                icon={<ReceiptText aria-hidden="true" />}
                label={copy.postalCode}
                name="postalCode"
                placeholder={copy.postalCodePlaceholder}
                autoComplete="postal-code"
                inputMode="numeric"
                maxLength={5}
              />
              <TextField
                icon={<Mail aria-hidden="true" />}
                label={copy.billingEmail}
                name="billingEmail"
                type="email"
                placeholder={copy.billingEmailPlaceholder}
                autoComplete="email"
                required={false}
              />
            </div>
          </fieldset>
        )}

        {quote && (
          <div className="checkout-summary mt-8" aria-live="polite">
            <h3>{copy.summaryTitle}</h3>
            <dl>
              <div>
                <dt>{copy.summarySubtotal}</dt>
                <dd>{formatMxn(quote.subtotalCents, language)}</dd>
              </div>
              <div>
                <dt>{copy.summaryTax}</dt>
                <dd>{formatMxn(quote.taxCents, language)}</dd>
              </div>
              <div className="checkout-summary-total">
                <dt>{copy.summaryTotal}</dt>
                <dd>{formatMxn(quote.totalCents, language)} MXN</dd>
              </div>
            </dl>
          </div>
        )}

        <p className="mt-5 text-xs leading-relaxed text-slate-500">
          {copy.privacy}{" "}
          <Link className="underline underline-offset-2" href="/aviso-de-privacidad">
            {copy.privacyLink}
          </Link>
        </p>

        <button
          type="submit"
          disabled={previewDisabled || isSending || !submissionId}
          aria-busy={isSending}
          className="btn-primary mt-6 w-full px-8 py-4 text-sm sm:w-auto"
        >
          {previewDisabled
            ? copy.previewDisabledButton
            : isSending
              ? copy.submitSending
              : copy.submit}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
        <p className="mt-3 text-xs text-slate-500">{copy.redirectNote}</p>
      </fieldset>

      {status.kind === "error" && (
        <p className="inquiry-status is-error" role="alert">
          {checkoutErrorMessage(status.reason, copy)}
        </p>
      )}
    </form>
  );
}

export function checkoutErrorMessage(
  reason: CheckoutFailureReason,
  copy: {
    invalid: string;
    invalidInvoice: string;
    rateLimited: string;
    conflict: string;
    soldOut: string;
    providerUnavailable: string;
    error: string;
  },
): string {
  switch (reason) {
    case "invalid":
      return copy.invalid;
    case "invalid_invoice":
      return copy.invalidInvoice;
    case "rate_limited":
      return copy.rateLimited;
    case "idempotency_conflict":
      return copy.conflict;
    case "sold_out":
      return copy.soldOut;
    case "provider_unavailable":
      return copy.providerUnavailable;
    default:
      return copy.error;
  }
}

function TextField({
  icon,
  label,
  name,
  placeholder,
  type = "text",
  autoComplete,
  required = true,
  inputMode,
  maxLength,
}: {
  icon: ReactNode;
  label: string;
  name: string;
  placeholder: string;
  type?: "text" | "email" | "tel";
  autoComplete: string;
  required?: boolean;
  inputMode?: "numeric" | "text";
  maxLength?: number;
}) {
  return (
    <label className="inquiry-field">
      <span>{label}</span>
      <span className="inquiry-input-wrap">
        {icon}
        <input
          required={required}
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
        />
      </span>
    </label>
  );
}

function SelectField({
  label,
  name,
  placeholder,
  options,
}: {
  label: string;
  name: string;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="inquiry-field">
      <span>{label}</span>
      <span className="inquiry-input-wrap">
        <select required name={name} defaultValue="">
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}
