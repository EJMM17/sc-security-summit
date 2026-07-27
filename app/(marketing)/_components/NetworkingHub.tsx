import Image from "next/image";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT, EVENTBRITE_URL } from "@/lib/content";
import type { Language } from "@/lib/language";
import PremiumCheck from "./_primitives/PremiumCheck";

export default function NetworkingHub({ language }: { language: Language }) {
  const { ui, providers } = CONTENT[language];

  return (
    <section className="bg-blue-950 py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/photo-logistics-operations.webp"
          alt=""
          fill
          className="object-cover opacity-[0.3]"
          sizes="100vw"
          aria-hidden="true"
        />
      </div>
      <div className="absolute inset-0 z-[1] bg-blue-950/85" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-3/5">
            <ScrollReveal>
              <span className="inline-flex items-center gap-2 py-1 text-xs text-white/90 font-semibold tracking-wider uppercase mb-6">
                {ui.networkingLabel}
              </span>
              <h2 className="font-oswald text-3xl sm:text-4xl font-bold text-white leading-[1.15] mb-4">
                {ui.networkingTitle}
              </h2>
              <p className="text-blue-100/80 max-w-lg text-base leading-relaxed mb-6">
                {ui.networkingDesc}
              </p>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {ui.networkingFeatures.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-white/80">
                    <PremiumCheck className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <a
                href={EVENTBRITE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-white text-blue-800 px-6 py-3 rounded-full font-bold text-sm hover:bg-blue-50 transition-colors shadow-md"
              >
                {ui.networkingCTA} <ArrowRight className="w-4 h-4" />
              </a>
            </ScrollReveal>
          </div>

          <div className="md:w-2/5">
            <ScrollReveal delay={150}>
              <span className="inline-block text-[10px] text-white/60 tracking-widest font-semibold uppercase mb-2">
                {ui.providersLabel}
              </span>
              <h3 className="font-oswald text-xl font-bold text-white mb-3">
                {ui.providersTitle}
              </h3>
              <p className="text-blue-100/70 text-sm leading-relaxed mb-5">
                {ui.providersDesc}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {providers.map((provider, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 rounded-xl bg-blue-950/70 border border-white/15 text-sm font-medium text-white/80 hover:border-cyan-300/50 transition-colors"
                  >
                    <PremiumCheck className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                    {provider.title}
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
