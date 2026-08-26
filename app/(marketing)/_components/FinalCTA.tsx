import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT, checkoutHref } from "@/lib/content";
import type { Language } from "@/lib/language";
import PrimaryCTA from "./_primitives/PrimaryCTA";

export default function FinalCTA({ language }: { language: Language }) {
  const { ui } = CONTENT[language];

  return (
    <section className="final-cta-photo final-cta-production relative overflow-hidden">
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <ScrollReveal>
          <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
            {ui.finalCTATitlePart1}{" "}
            <span>{ui.finalCTATitlePart2}</span>
          </h2>
          <p className="text-blue-100/60 mt-4 max-w-xl mx-auto">{ui.finalCTADesc}</p>
          <dl className="final-cta-facts">
            <div>
              <dt>{ui.eventDayLabel}</dt>
              <dd>{ui.eventDayValue}</dd>
            </div>
            <div>
              <dt>{ui.locationLabel}</dt>
              <dd>{ui.eventDayVenue}</dd>
            </div>
          </dl>
        </ScrollReveal>
        <ScrollReveal delay={200}>
          {/* One action only: the corporate block is bought through the same
              checkout, so a second button here sent visitors to a form that
              asks for the whole roster before they have chosen anything. */}
          <div className="flex items-center justify-center mt-8">
            <PrimaryCTA href={checkoutHref(language)} size="lg">
              {ui.registerNowBtn}
            </PrimaryCTA>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
