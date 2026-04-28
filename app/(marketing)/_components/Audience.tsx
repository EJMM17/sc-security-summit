import ScrollReveal from "@/components/ScrollReveal";
import Icon from "@/components/icon";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import WaveSeparator from "./_primitives/WaveSeparator";

export default function Audience({ language }: { language: Language }) {
  const { ui, attendees } = CONTENT[language];

  return (
    <>
      <WaveSeparator color="#F8FAFC" />
      <section id="audiencia" className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="section-label">{ui.participantsLabel}</span>
              <h2 className="section-title mt-3">{ui.participantsTitle}</h2>
              <p className="text-slate-500 max-w-2xl mx-auto mt-4">{ui.participantsDesc}</p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {attendees.map((attendee, index) => (
              <ScrollReveal key={index} delay={index * 80}>
                <div className="flex items-center gap-4 p-5 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                  <div className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center flex-shrink-0 group-hover:border-blue-300 transition-colors">
                    <Icon name={attendee.icon} className="w-5 h-5 text-slate-600" strokeWidth={1.5} />
                  </div>
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
    </>
  );
}
