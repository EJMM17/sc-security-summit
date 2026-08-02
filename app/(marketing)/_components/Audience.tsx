import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { AUDIENCE_PATHS, CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import PremiumCheck from "./_primitives/PremiumCheck";
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
                {valueHighlights.slice(0, 5).map((highlight, index) => (
                  <li key={highlight}>
                    <PremiumCheck index={index} />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
            {/* A panel nested inside a section is not a page-level
                complementary landmark; `aside` here produced an
                axe `landmark-complementary-is-top-level` violation. */}
            <div className="audience-value-aside">
              <span>{ui.audienceCardTitle}</span>
              <p>{ui.audienceCardDesc}</p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
