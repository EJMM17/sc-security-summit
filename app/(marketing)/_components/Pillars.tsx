import ScrollReveal from "@/components/ScrollReveal";
import Icon from "@/components/icon";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import PremiumCheck from "./_primitives/PremiumCheck";

export default function Pillars({ language }: { language: Language }) {
  const { ui, pillars } = CONTENT[language];

  return (
    <>
      <span id="agenda" aria-hidden="true" />
      <section id="enfoque" className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="section-label">{ui.pillarsLabel}</span>
              <h2 className="section-title mt-3">{ui.pillarsTitle}</h2>
              <p className="text-slate-500 max-w-2xl mx-auto mt-4">{ui.pillarsDesc}</p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {pillars.map((pillar, index) => (
              <ScrollReveal key={index} delay={index * 150}>
                <div className="card-elevated p-8 h-full group">
                  <span className="number-accent text-6xl font-oswald font-bold opacity-20 group-hover:opacity-40 transition-opacity">
                    {pillar.number}
                  </span>
                  <div className="w-11 h-11 rounded-lg border border-slate-200 flex items-center justify-center mb-5 group-hover:border-blue-300 transition-colors">
                    <Icon name={pillar.icon} className="w-5 h-5 text-slate-700" strokeWidth={1.5} />
                  </div>
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
    </>
  );
}
