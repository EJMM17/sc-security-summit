import FAQAccordion from "@/components/FAQAccordion";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";

export default function Faq({ language }: { language: Language }) {
  const { ui, faq } = CONTENT[language];

  return (
    <section id="faq" className="mock-section mock-faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="section-label">{ui.faqLabel}</span>
            <h2 className="section-title mt-3">{ui.faqTitle}</h2>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={120}>
          <FAQAccordion items={[...faq]} />
        </ScrollReveal>
      </div>
    </section>
  );
}
