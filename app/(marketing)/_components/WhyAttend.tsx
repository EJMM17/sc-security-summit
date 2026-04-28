import ScrollReveal from "@/components/ScrollReveal";
import Icon from "@/components/icon";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";

export default function WhyAttend({ language }: { language: Language }) {
  const { ui, whyAttend } = CONTENT[language];

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="accent-line" />
              <span className="section-label">{ui.whyAttendLabel}</span>
              <div className="accent-line" />
            </div>
            <h2 className="section-title">{ui.whyAttendTitle}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto mt-4 text-lg">
              {ui.whyAttendDesc}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 gap-6">
          {whyAttend.map((item, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <div className="group relative p-8 rounded-2xl border border-slate-100 bg-white hover:bg-blue-50/50 hover:border-blue-200 transition-all duration-500 hover:shadow-lg">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0 ring-1 ring-slate-700 group-hover:ring-blue-500/50 transition-all shadow-lg">
                    <Icon name={item.icon} className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-oswald text-xl font-bold text-slate-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
