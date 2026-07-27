import Image from "next/image";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT, EVENTBRITE_URL } from "@/lib/content";
import type { Language } from "@/lib/language";
import PrimaryCTA from "./_primitives/PrimaryCTA";

export default function FinalCTA({ language }: { language: Language }) {
  const { ui } = CONTENT[language];

  return (
    <section className="final-cta-photo relative overflow-hidden bg-blue-950 py-20 border-y border-blue-900">
      <Image
        src="/images/photo-conference-audience.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
        aria-hidden="true"
      />
      <div className="final-cta-photo-overlay" aria-hidden="true" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <ScrollReveal>
          <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
            {ui.finalCTATitlePart1}{" "}
            <span className="text-cyan-300">{ui.finalCTATitlePart2}</span>
          </h2>
          <p className="text-blue-100/60 mt-4 max-w-xl mx-auto">{ui.finalCTADesc}</p>
        </ScrollReveal>
        <ScrollReveal delay={200}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <PrimaryCTA
              href={EVENTBRITE_URL}
              external
              size="lg"
            >
              {ui.registerNowBtn}
            </PrimaryCTA>
            <a
              href="mailto:hola@scsecuritysummit.com"
              className="btn-outline px-8 py-4 text-base border-white/30 text-white hover:bg-white/10"
            >
              {ui.contactOrg}
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
