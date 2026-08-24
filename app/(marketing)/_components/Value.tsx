import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import Icon from "@/components/icon";
import { CONTENT, checkoutHref } from "@/lib/content";
import type { Language } from "@/lib/language";
import PremiumCheck from "./_primitives/PremiumCheck";
import SummitIcon from "./_primitives/SummitIcon";

export default function Value({ language }: { language: Language }) {
  const { ui, attendees, valueHighlights } = CONTENT[language];

  return (
    <section className="mock-section mock-section--soft mock-value">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-5 gap-12 items-start">
          <div className="lg:col-span-3">
            <ScrollReveal>
              <span className="section-label">{ui.valueLabel}</span>
              <h2 className="section-title mt-3 mb-8">{ui.valueTitle}</h2>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className="space-y-3">
                {valueHighlights.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition-colors shadow-sm"
                  >
                    <PremiumCheck
                      index={index}
                      className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                    />
                    <span className="text-[15px] text-slate-700 font-medium leading-relaxed">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          <div className="lg:col-span-2">
            <ScrollReveal delay={200}>
              <div className="sticky top-24 p-8 rounded-[20px] border border-blue-200 bg-white shadow-md">
                <div className="flex items-center gap-3 mb-6">
                  <span className="mock-icon-box" aria-hidden="true">
                    <SummitIcon name="users" />
                  </span>
                  <h3 className="font-oswald text-xl font-bold text-slate-900">
                    {ui.audienceCardTitle}
                  </h3>
                </div>
                <p className="text-[15px] text-slate-600 leading-relaxed mb-6">
                  {ui.audienceCardDesc}
                </p>
                <div className="space-y-3">
                  {attendees.slice(0, 4).map((attendee, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm text-slate-600">
                      <Icon
                        name={attendee.icon}
                        className="w-4 h-4 text-slate-400 flex-shrink-0"
                        strokeWidth={1.5}
                      />
                      <span className="font-medium">{attendee.title}</span>
                    </div>
                  ))}
                </div>
                <a
                  href={checkoutHref(language)}
                  className="btn-primary w-full mt-8 py-3 text-sm justify-center"
                >
                  {ui.audienceCardCTA} <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
