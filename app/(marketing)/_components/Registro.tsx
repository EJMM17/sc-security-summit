import { BadgeCheck, UsersRound } from "lucide-react";
import CorporatePassForm from "@/components/CorporatePassForm";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import WaveSeparator from "./_primitives/WaveSeparator";

export default function Registro({
  language,
}: {
  language: Language;
}) {
  const { ui } = CONTENT[language];

  return (
    <>
      <WaveSeparator color="#FFFFFF" flip />
      <section id="registro" className="py-20 sm:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center mb-10">
              <span className="section-label">{ui.regLabel}</span>
              <h2 className="section-title mt-3">{ui.regTitle}</h2>
              <p className="text-slate-500 max-w-xl mx-auto mt-4">{ui.regDesc}</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={120}>
            <div className="corporate-pass-panel">
              <div className="corporate-pass-summary">
                <UsersRound aria-hidden="true" />
                <p>{ui.corporateAccessTitle}</p>
                <span>
                  <BadgeCheck aria-hidden="true" />
                  {ui.corporateAccessNote}
                </span>
              </div>
              <div className="corporate-pass-form">
                <CorporatePassForm language={language} />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
