"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { ArrowRight, Building2, Mail, Phone, UserRound } from "lucide-react";
import { submitInquiry } from "@/app/actions/inquiries";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";

export default function CorporatePassForm({ language }: { language: Language }) {
  const copy = CONTENT[language].forms.corporate;
  const ui = CONTENT[language].ui;
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("sending");
    const result = await submitInquiry(new FormData(form));
    setStatus(result.ok ? "success" : "error");
    if (result.ok) form.reset();
  };

  return (
    <form onSubmit={handleSubmit} className="inquiry-form">
      <input type="hidden" name="kind" value="corporate" />
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
      </div>

      <p className="mt-5 text-xs text-slate-500 leading-relaxed">{ui.corporatePrivacy}</p>
      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-primary w-full sm:w-auto mt-6 px-8 py-4 text-sm"
      >
        {status === "sending" ? ui.inquirySending : ui.corporateSubmit}
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </button>
      {status === "success" && (
        <p className="inquiry-status is-success" role="status">
          {ui.corporateSuccess}
        </p>
      )}
      {status === "error" && (
        <p className="inquiry-status is-error" role="alert">
          {ui.inquiryError}
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
