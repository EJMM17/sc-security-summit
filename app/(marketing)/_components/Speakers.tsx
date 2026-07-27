import { Mic2 } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import SpeakersCarousel from "@/components/SpeakersCarousel";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import SectionIntro from "./_primitives/SectionIntro";

export default function Speakers({ language }: { language: Language }) {
  const { ui, speakers } = CONTENT[language];

  return (
      <section id="speakers" className="rhythm-pause-lg bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <SectionIntro
              label={ui.speakersLabel}
              title={ui.speakersTitle}
              description={ui.speakersDesc}
              icon={<Mic2 className="w-4 h-4" />}
              className="mb-16"
            />
          </ScrollReveal>

          <ScrollReveal delay={120} direction="scale">
            <SpeakersCarousel speakers={speakers} language={language} />
          </ScrollReveal>
        </div>
      </section>
  );
}
