import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import SectionIntro from "./_primitives/SectionIntro";

export default function Audience({ language }: { language: Language }) {
  const { ui, attendees } = CONTENT[language];

  return (
      <section id="audiencia" className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <SectionIntro
              label={ui.participantsLabel}
              title={ui.participantsTitle}
              description={ui.participantsDesc}
              className="mb-16"
            />
          </ScrollReveal>

          <div className="audience-editorial-grid">
            {attendees.map((attendee, index) => (
              <ScrollReveal key={index} delay={index * 80}>
                <div className="audience-editorial-item">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{attendee.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{attendee.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
  );
}
