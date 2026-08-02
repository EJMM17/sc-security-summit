import { ArrowRight, Mic2 } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import SpeakersCarousel from "@/components/SpeakersCarousel";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import SectionIntro from "./_primitives/SectionIntro";

export default function Speakers({ language }: { language: Language }) {
  const { ui, speakers } = CONTENT[language];

  return (
      <section id="especialistas" className="mock-section mock-section--light">
        <div className="mock-container">
          <ScrollReveal>
            <SectionIntro
              label={ui.speakersLabel}
              title={ui.speakersTitle}
              description={ui.speakersDesc}
              icon={<Mic2 className="w-4 h-4" />}
              align="center"
              className="mock-section-intro"
            />
          </ScrollReveal>

          <ScrollReveal delay={120} direction="scale">
            <SpeakersCarousel speakers={speakers} language={language} />
          </ScrollReveal>

          <ScrollReveal delay={180}>
            <div className="speaker-opportunity">
              <div>
                <h3>{ui.speakerOpportunityTitle}</h3>
                <p>{ui.speakerOpportunityDesc}</p>
              </div>
              <a href="#patrocinadores">
                {ui.speakerOpportunityCTA}
                <ArrowRight aria-hidden="true" />
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>
  );
}
