import { BadgeCheck, UsersRound } from "lucide-react";
import CorporatePassForm from "@/components/CorporatePassForm";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT } from "@/lib/content";
import { isVisualOnlyVercelDeployment } from "@/lib/deployment-environment";
import type { Language } from "@/lib/language";

export default function Registro({
  language,
}: {
  language: Language;
}) {
  const { ui } = CONTENT[language];
  const inquiriesDisabled = isVisualOnlyVercelDeployment();

  return (
      <section id="registro" className="mock-section mock-section--light mock-corporate">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="mock-section-intro text-center">
              <span className="section-label section-label--center">{ui.regLabel}</span>
              <h2 className="section-title mt-3">{ui.regTitle}</h2>
              <p className="text-slate-500 max-w-xl mx-auto mt-4">{ui.regDesc}</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={120}>
            <div id="pase-corporativo" className="corporate-pass-panel">
              <div className="corporate-pass-summary">
                <UsersRound aria-hidden="true" />
                <p>{ui.corporateAccessTitle}</p>
                <span>
                  <BadgeCheck aria-hidden="true" />
                  {ui.corporateAccessNote}
                </span>
              </div>
              <div className="corporate-pass-form">
                <CorporatePassForm
                  language={language}
                  previewDisabled={inquiriesDisabled}
                />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
  );
}
