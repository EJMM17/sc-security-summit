import ScrollReveal from "@/components/ScrollReveal";
import { COMPETENCIES, CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import SectionIntro from "./_primitives/SectionIntro";
import SummitIcon, { type SummitIconName } from "./_primitives/SummitIcon";

/* One glyph per competency, in the order the list declares them. */
const ICONS: readonly SummitIconName[] = [
  "gauge",
  "truck",
  "shield-check",
  "lock-keyhole",
  "cycle",
  "users",
];

export default function Pillars({ language }: { language: Language }) {
  const { ui } = CONTENT[language];
  const competencies = COMPETENCIES[language];

  return (
    <section id="formacion" className="mock-section mock-section--soft">
      <div className="mock-container">
        <ScrollReveal>
          <SectionIntro
            label={ui.pillarsLabel}
            title={ui.pillarsTitle}
            description={ui.pillarsDesc}
            align="center"
            className="mock-section-intro"
          />
        </ScrollReveal>

        <ScrollReveal>
          <div className="surface-card competency-panel">
            <ol className="competency-list">
              {competencies.map((title, index) => (
                <li key={title} className="competency-row">
                  <span className="competency-row-index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="competency-row-icon" aria-hidden="true">
                    <SummitIcon name={ICONS[index]} />
                  </span>
                  <h3>{title}</h3>
                </li>
              ))}
            </ol>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
