import { ArrowRight, Check } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { AUDIENCE_PATHS, CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import SectionIntro from "./_primitives/SectionIntro";

export default function Audience({ language }: { language: Language }) {
  const { ui, valueHighlights } = CONTENT[language];
  const paths = AUDIENCE_PATHS[language];

  return (
    <section id="audiencia" className="mock-section mock-section--light audience-section">
      <div className="mock-container">
        <ScrollReveal>
          <SectionIntro
            label={ui.participantsLabel}
            title={ui.participantsTitle}
            description={ui.participantsDesc}
            align="center"
            className="mock-section-intro"
          />
        </ScrollReveal>

        <div className="audience-path-grid">
          {paths.map((path, index) => (
            <ScrollReveal key={path.title} delay={index * 80}>
              <article className="surface-card">
                <span>{path.label}</span>
                <h3>{path.title}</h3>
                <p>{path.description}</p>
                <a href={path.href}>
                  {path.cta}
                  <ArrowRight aria-hidden="true" />
                </a>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={160}>
          <div className="audience-value-grid">
            <div>
              <h3>{ui.valueTitle}</h3>
              <ul>
                {valueHighlights.slice(0, 5).map((highlight) => (
                  <li key={highlight}>
                    <Check aria-hidden="true" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
            <aside>
              <span>{ui.audienceCardTitle}</span>
              <p>{ui.audienceCardDesc}</p>
            </aside>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
