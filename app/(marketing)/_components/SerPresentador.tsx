import type { ReactNode } from "react";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  Mail,
  MessageSquareText,
  Phone,
  UserRound,
} from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { PRESENTER_CFP } from "@/lib/content";
import type { Language } from "@/lib/language";

/**
 * Call-for-speakers ("Ser presentador") — distinct from the sponsorship band.
 *
 * Pure server component with a native `mailto:` form (no "use client", no
 * client boundary): submitting opens the visitor's mail client with the
 * proposal prefilled to contacto@scsecuritysummit.com. It intentionally does
 * NOT persist to Supabase, keeping the product boundary (only corporate-pass
 * and sponsorship inquiries are stored) intact.
 */
export default function SerPresentador({ language }: { language: Language }) {
  const copy = PRESENTER_CFP[language];
  const mailtoAction = `mailto:${PRESENTER_CFP.recipient}?subject=${encodeURIComponent(
    copy.subject,
  )}`;

  return (
    <section id="ser-presentador" className="mock-section bg-white">
      <div className="mock-container sponsor-production-grid">
        <ScrollReveal>
          <div className="sponsor-production-copy">
            <span className="section-label">{copy.label}</span>
            <h2 className="section-title mt-3">{copy.title}</h2>
            <p className="section-desc mt-5">{copy.description}</p>

            <ul className="sponsor-benefit-list">
              {copy.points.map((point) => (
                <li key={point}>
                  <Check aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="sponsor-contact-panel">
            <div className="sponsor-form-heading">
              <span className="section-label">{copy.formLabel}</span>
              <h3>{copy.formTitle}</h3>
              <p>{copy.formDesc}</p>
            </div>

            <form
              action={mailtoAction}
              method="post"
              encType="text/plain"
              className="inquiry-form"
            >
              <div className="grid sm:grid-cols-2 gap-5">
                <Field
                  icon={<UserRound aria-hidden="true" />}
                  label={copy.firstName}
                  name={copy.firstName}
                  placeholder={copy.firstNamePlaceholder}
                  autoComplete="given-name"
                />
                <Field
                  icon={<UserRound aria-hidden="true" />}
                  label={copy.lastName}
                  name={copy.lastName}
                  placeholder={copy.lastNamePlaceholder}
                  autoComplete="family-name"
                />
                <Field
                  icon={<Mail aria-hidden="true" />}
                  label={copy.email}
                  name={copy.email}
                  type="email"
                  placeholder={copy.emailPlaceholder}
                  autoComplete="email"
                />
                <Field
                  icon={<Phone aria-hidden="true" />}
                  label={copy.phone}
                  name={copy.phone}
                  type="tel"
                  placeholder={copy.phonePlaceholder}
                  autoComplete="tel"
                />
                <Field
                  icon={<Building2 aria-hidden="true" />}
                  label={copy.company}
                  name={copy.company}
                  placeholder={copy.companyPlaceholder}
                  autoComplete="organization"
                />
                <Field
                  icon={<Briefcase aria-hidden="true" />}
                  label={copy.role}
                  name={copy.role}
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
                    name={copy.topic}
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

              <p className="mt-4 text-xs text-slate-500 leading-relaxed">
                {copy.note}
              </p>
            </form>
          </div>
        </ScrollReveal>
      </div>
    </section>
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
