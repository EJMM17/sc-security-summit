import { ArrowRight, Check, Sparkles, Zap } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import SponsorInquiryForm from "@/components/SponsorInquiryForm";
import { CONTENT } from "@/lib/content";
import { isVisualOnlyVercelDeployment } from "@/lib/deployment-environment";
import type { Language } from "@/lib/language";

export default function Sponsors({ language }: { language: Language }) {
  const { ui, sponsors } = CONTENT[language];
  const sponsor = sponsors[0];
  const inquiriesDisabled = isVisualOnlyVercelDeployment();

  return (
    <section id="patrocinadores" className="mock-section mock-sponsors">
      <div className="mock-container sponsor-production-grid">
        <ScrollReveal>
          <div className="sponsor-production-copy">
            <span className="section-label">{ui.sponsorsLabel}</span>
            <h2 className="section-title mt-3">{ui.sponsorsTitle}</h2>
            <p className="section-desc mt-5">{ui.sponsorsDesc}</p>

            <div className="sponsor-impact-block">
              <div className="sponsor-impact-heading">
                <span className="mock-icon-box" aria-hidden="true">
                  <Zap />
                </span>
                <div>
                  <small>{ui.sponsorImpactLabel}</small>
                  <strong>{ui.sponsorImpactTitle}</strong>
                </div>
              </div>
              <ol className="sponsor-moment-track">
                {ui.sponsorImpactMoments.map((moment, index) => (
                  <li key={moment.title}>
                    <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    <h3>{moment.title}</h3>
                    <p>{moment.detail}</p>
                  </li>
                ))}
              </ol>
            </div>

            <dl className="sponsor-impact-stats">
              {ui.sponsorImpactStats.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.number}</dt>
                  <dd>{stat.label}</dd>
                </div>
              ))}
            </dl>

            <div className="sponsor-tier-summary">
              <div className="mock-icon-box" aria-hidden="true">
                <Sparkles />
              </div>
              <div>
                <span>{sponsor.tier}</span>
                <strong>
                  {sponsor.benefits.length} {ui.sponsorBenefitsLabel}
                </strong>
              </div>
            </div>

            <ul className="sponsor-benefit-list">
              {sponsor.benefits.slice(0, 5).map((benefit) => (
                <li key={benefit}>
                  <Check aria-hidden="true" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <a href="#contacto-patrocinio" className="text-link-arrow">
              {ui.sponsorRequestInfo}
              <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div id="contacto-patrocinio" className="sponsor-contact-panel">
            <div className="sponsor-form-heading">
              <span className="section-label">{ui.sponsorFormLabel}</span>
              <h3>{ui.sponsorFormTitle}</h3>
              <p>{ui.sponsorFormDesc}</p>
            </div>
            <SponsorInquiryForm
              language={language}
              previewDisabled={inquiriesDisabled}
            />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
