import Image from "next/image";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import Icon from "@/components/icon";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import PremiumCheck from "./_primitives/PremiumCheck";

export default function NetworkingHub({ language }: { language: Language }) {
  const { ui, providers } = CONTENT[language];

  return (
    <section className="bg-gradient-to-br from-blue-900 via-blue-900 to-blue-950 py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/gallery-hub.webp"
          alt=""
          fill
          className="object-cover opacity-[0.18]"
          sizes="100vw"
          aria-hidden="true"
        />
      </div>
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-blue-900/96 via-blue-900/80 to-blue-900/60" />
      <div
        className="absolute inset-0 z-[2] opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-3/5">
            <ScrollReveal>
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-2 text-xs text-white/90 font-semibold tracking-wider uppercase mb-6">
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
                href="#registro"
                className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors shadow-lg"
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
                    className="flex items-center gap-2 p-3 rounded-lg bg-white/10 border border-white/10 text-sm font-medium text-white/80 hover:bg-white/15 transition-colors"
                  >
                    <Icon
                      name={provider.icon}
                      className="w-4 h-4 text-cyan-300 flex-shrink-0"
                      strokeWidth={1.5}
                    />
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
