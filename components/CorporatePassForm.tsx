"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { ArrowRight, Building2, Mail, Phone, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { submitInquiry } from "@/app/actions/inquiries";
import AttributionCapture from "@/components/AttributionCapture";
import EmptyAttributionFields from "@/components/EmptyAttributionFields";
import { CONTENT } from "@/lib/content";
import {
  createSubmissionId,
  inquiryErrorMessage,
  runInquirySubmission,
} from "@/lib/inquiries/client-submit";
import { INQUIRY_CONSENT_VERSION } from "@/lib/inquiries/constants";
import type { InquiryFailureReason } from "@/lib/inquiries/result";
import type { Language } from "@/lib/language";

type FormStatus =
  | { kind: "idle" }
  | { kind: "success" }
  | { kind: "error"; reason: InquiryFailureReason };

export default function CorporatePassForm({
  language,
  previewDisabled = false,
}: {
  language: Language;
  previewDisabled?: boolean;
}) {
  const copy = CONTENT[language].forms.corporate;
  const ui = CONTENT[language].ui;
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" });
  const [isSending, setIsSending] = useState(false);
  const [submissionId, setSubmissionId] = useState("");

  useEffect(() => {
    setSubmissionId(createSubmissionId());
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (previewDisabled) return;

    const form = event.currentTarget;
    const currentSubmissionId = submissionId || createSubmissionId();
    if (!submissionId) setSubmissionId(currentSubmissionId);
    setStatus({ kind: "idle" });

    const result = await runInquirySubmission({
      setSending: setIsSending,
      submit: () => {
        const formData = new FormData(form);
        formData.set("submissionId", currentSubmissionId);
        return submitInquiry(formData);
      },
    });

    if (result.ok) {
      form.reset();
      setStatus({ kind: "success" });
      setSubmissionId(createSubmissionId());
    } else {
      setStatus({ kind: "error", reason: result.reason });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="inquiry-form"
      aria-describedby={previewDisabled ? "corporate-preview-disabled" : undefined}
    >
      {previewDisabled && (
        <p
          id="corporate-preview-disabled"
          className="inquiry-status is-error mb-5"
          role="status"
        >
          {ui.inquiryPreviewDisabled}
        </p>
      )}
      <fieldset
        disabled={previewDisabled}
        className="m-0 min-w-0 border-0 p-0 disabled:opacity-60"
      >
        <input type="hidden" name="kind" value="corporate" />
        <input type="hidden" name="submissionId" value={submissionId} readOnly />
        <input type="hidden" name="language" value={language} readOnly />
        <input
          type="hidden"
          name="consentVersion"
          value={INQUIRY_CONSENT_VERSION}
          readOnly
        />
        {previewDisabled ? (
          <EmptyAttributionFields />
        ) : (
          <AttributionCapture asInputs />
        )}
        <input
          className="sr-only"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <div className="grid sm:grid-cols-2 gap-5">
        <FormField
          icon={<UserRound aria-hidden="true" />}
          label={copy.firstName}
          name="firstName"
          placeholder={copy.firstNamePlaceholder}
          autoComplete="given-name"
        />
        <FormField
          icon={<UserRound aria-hidden="true" />}
          label={copy.lastName}
          name="lastName"
          placeholder={copy.lastNamePlaceholder}
          autoComplete="family-name"
        />
        <FormField
          icon={<Mail aria-hidden="true" />}
          label={copy.email}
          name="email"
          type="email"
          placeholder={copy.emailPlaceholder}
          autoComplete="email"
        />
        <FormField
          icon={<Building2 aria-hidden="true" />}
          label={copy.company}
          name="company"
          placeholder={copy.companyPlaceholder}
          autoComplete="organization"
        />
        <FormField
          icon={<Building2 aria-hidden="true" />}
          label={copy.role}
          name="role"
          placeholder={copy.rolePlaceholder}
          autoComplete="organization-title"
        />
        <FormField
          icon={<Phone aria-hidden="true" />}
          label={copy.phone}
          name="phone"
          type="tel"
          placeholder={copy.phonePlaceholder}
          autoComplete="tel"
        />
        <label className="inquiry-field">
          <span>{copy.requestedSeats}</span>
          <span className="inquiry-input-wrap">
            <UsersRound aria-hidden="true" />
            <input
              required
              name="requestedSeats"
              type="number"
              min={2}
              max={10}
              step={1}
              defaultValue={2}
              inputMode="numeric"
            />
          </span>
        </label>
        </div>

        <p className="mt-5 text-xs text-slate-500 leading-relaxed">
          {ui.inquiryPrivacy}{" "}
          <Link className="underline underline-offset-2" href="/aviso-de-privacidad">
            {ui.inquiryPrivacyLink}
          </Link>
        </p>
        <button
          type="submit"
          disabled={previewDisabled || isSending || !submissionId}
          aria-busy={isSending}
          className="btn-primary w-full sm:w-auto mt-6 px-8 py-4 text-sm"
        >
          {previewDisabled
            ? ui.inquiryPreviewDisabledButton
            : isSending
              ? ui.inquirySending
              : ui.corporateSubmit}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </fieldset>
      {status.kind === "success" && (
        <p className="inquiry-status is-success" role="status">
          {ui.corporateSuccess}
        </p>
      )}
      {status.kind === "error" && (
        <p className="inquiry-status is-error" role="alert">
          {inquiryErrorMessage(status.reason, {
            invalid: ui.inquiryInvalid,
            rateLimited: ui.inquiryRateLimited,
            unavailable: ui.inquiryError,
          })}
        </p>
      )}
    </form>
  );
}

function FormField({
  icon,
  label,
  name,
  placeholder,
  type = "text",
  autoComplete,
}: {
  icon: ReactNode;
  label: string;
  name: string;
  placeholder: string;
  type?: "text" | "email" | "tel";
  autoComplete: string;
}) {
  return (
    <label className="inquiry-field">
      <span>{label}</span>
      <span className="inquiry-input-wrap">
        {icon}
        <input
          required
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
      </span>
    </label>
  );
}
