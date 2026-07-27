import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import PremiumCheck from "./_primitives/PremiumCheck";
import SectionIntro from "./_primitives/SectionIntro";

export default function Pillars({ language }: { language: Language }) {
  const { ui, pillars } = CONTENT[language];

  return (
      <section id="enfoque" className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <SectionIntro
              label={ui.pillarsLabel}
              title={ui.pillarsTitle}
              description={ui.pillarsDesc}
              className="mb-16"
            />
          </ScrollReveal>

          <div className="pillar-editorial-grid">
            {pillars.map((pillar, index) => (
              <ScrollReveal key={index} delay={index * 150}>
                <div className="pillar-editorial-item">
                  <h3 className="font-oswald text-xl font-bold text-slate-900 mb-3">
                    {pillar.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-5">
                    {pillar.desc}
                  </p>
                  <ul className="space-y-2">
                    {pillar.bullets.map((bullet, bulletIndex) => (
                      <li
                        key={bulletIndex}
                        className="flex items-start gap-2 text-sm text-slate-600"
                      >
                        <PremiumCheck className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
  );
}
