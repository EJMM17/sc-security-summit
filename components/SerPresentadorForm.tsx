"use client";

import type { FormEvent, ReactNode } from "react";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Mail,
  MessageSquareText,
  Phone,
  UserRound,
} from "lucide-react";
import type { Language } from "@/lib/language";

type ProposalCopy = Record<
  | "firstName" | "firstNamePlaceholder" | "lastName" | "lastNamePlaceholder"
  | "email" | "emailPlaceholder" | "phone" | "phonePlaceholder"
  | "company" | "companyPlaceholder" | "role" | "rolePlaceholder"
  | "topic" | "topicPlaceholder" | "submit" | "note" | "subject",
  string
>;

/**
 * Mailto-based speaker proposal form. Opens the visitor's mail client with a
 * prefilled message rather than persisting to Supabase, so it stays outside
 * the corporate-pass / sponsorship inquiry pipeline by design.
 */
export default function SerPresentadorForm({ language, content }: {
  language: Language;
  /** Supply approved bilingual copy and recipient when mounting this form. */
  content: Record<Language, ProposalCopy> & { recipient: string };
}) {
  const copy = content[language];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) ?? "").trim();

    const body = [
      `${copy.firstName}: ${value("firstName")}`,
      `${copy.lastName}: ${value("lastName")}`,
      `${copy.email}: ${value("email")}`,
      `${copy.phone}: ${value("phone")}`,
      `${copy.company}: ${value("company")}`,
      `${copy.role}: ${value("role")}`,
      "",
      `${copy.topic}:`,
      value("topic"),
    ].join("\n");

    window.location.href = `mailto:${content.recipient}?subject=${encodeURIComponent(
      copy.subject,
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <form onSubmit={handleSubmit} className="inquiry-form">
      <div className="grid sm:grid-cols-2 gap-5">
        <Field
          icon={<UserRound aria-hidden="true" />}
          label={copy.firstName}
          name="firstName"
          placeholder={copy.firstNamePlaceholder}
          autoComplete="given-name"
        />
        <Field
          icon={<UserRound aria-hidden="true" />}
          label={copy.lastName}
          name="lastName"
          placeholder={copy.lastNamePlaceholder}
          autoComplete="family-name"
        />
        <Field
          icon={<Mail aria-hidden="true" />}
          label={copy.email}
          name="email"
          type="email"
          placeholder={copy.emailPlaceholder}
          autoComplete="email"
        />
        <Field
          icon={<Phone aria-hidden="true" />}
          label={copy.phone}
          name="phone"
          type="tel"
          placeholder={copy.phonePlaceholder}
          autoComplete="tel"
        />
        <Field
          icon={<Building2 aria-hidden="true" />}
          label={copy.company}
          name="company"
          placeholder={copy.companyPlaceholder}
          autoComplete="organization"
        />
        <Field
          icon={<Briefcase aria-hidden="true" />}
          label={copy.role}
          name="role"
          placeholder={copy.rolePlaceholder}
          autoComplete="organization-title"
        />
      </div>

      <label className="inquiry-field mt-5">
        <span>{copy.topic}</span>
        <span className="inquiry-input-wrap inquiry-textarea-wrap">
          <MessageSquareText aria-hidden="true" />
          <textarea
            required
            name="topic"
            rows={4}
            placeholder={copy.topicPlaceholder}
          />
        </span>
      </label>

      <button
        type="submit"
        className="btn-primary w-full sm:w-auto mt-6 px-8 py-4 text-sm"
      >
        {copy.submit}
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </button>

      <p className="mt-4 text-xs text-slate-500 leading-relaxed">{copy.note}</p>
    </form>
  );
}

function Field({
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
