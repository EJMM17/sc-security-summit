import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import SectionIntro from "./_primitives/SectionIntro";
import SummitIcon, { type SummitIconName } from "./_primitives/SummitIcon";

const ICONS: readonly SummitIconName[] = [
  "focus",
  "route",
  "deliver",
  "layout-grid",
];

export default function WhyAttend({ language }: { language: Language }) {
  const { ui, whyAttend } = CONTENT[language];

  return (
    <section className="mock-section mock-section--light">
      <div className="mock-container">
        <ScrollReveal>
          <SectionIntro
            label={ui.whyAttendLabel}
            title={ui.whyAttendTitle}
            description={ui.whyAttendDesc}
            align="center"
            className="mock-section-intro"
          />
        </ScrollReveal>

        <div className="why-competency-grid">
          {whyAttend.map((item, index) => (
            <ScrollReveal key={item.title} delay={index * 80}>
              <article className="surface-card why-competency-card">
                <span className="mock-icon-box" aria-hidden="true">
                  <SummitIcon name={ICONS[index]} />
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
