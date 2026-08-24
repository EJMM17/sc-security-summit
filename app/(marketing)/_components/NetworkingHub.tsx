import Image from "next/image";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT, checkoutHref } from "@/lib/content";
import type { Language } from "@/lib/language";
import PremiumCheck from "./_primitives/PremiumCheck";
import PrimaryCTA from "./_primitives/PrimaryCTA";
import SummitIcon from "./_primitives/SummitIcon";

export default function NetworkingHub({ language }: { language: Language }) {
  const { ui, providers } = CONTENT[language];

  return (
    <section className="mock-section networking-section relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/gallery-hub.webp"
          alt=""
          fill
          className="object-cover opacity-[0.3]"
          sizes="100vw"
          aria-hidden="true"
        />
      </div>
      <div className="networking-overlay absolute inset-0 z-[1]" aria-hidden="true" />

      <div className="mock-container relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-3/5">
            <ScrollReveal>
              <span className="networking-label mb-6">
                {ui.networkingLabel}
              </span>
              <h2 className="font-oswald text-3xl sm:text-4xl font-bold text-white leading-[1.15] mb-4">
                {ui.networkingTitle}
              </h2>
              <p className="networking-lead max-w-lg mb-6">{ui.networkingDesc}</p>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {ui.networkingFeatures.map((item, index) => (
                  <div key={index} className="networking-feature">
                    <PremiumCheck index={index} className="networking-feature-check" />
                    {item}
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <PrimaryCTA href={checkoutHref(language)} size="md">
                {ui.networkingCTA}
              </PrimaryCTA>
            </ScrollReveal>
          </div>

          <div className="md:w-2/5">
            <ScrollReveal delay={150}>
              <span className="networking-label networking-label--sub mb-2">
                {ui.providersLabel}
              </span>
              <h3 className="networking-subtitle">{ui.providersTitle}</h3>
              <p className="networking-lead networking-lead--sm mb-5">
                {ui.providersDesc}
              </p>
              <div className="provider-chip-grid">
                {providers.map((provider) => (
                  <div key={provider.title} className="provider-chip">
                    <span className="provider-chip-icon" aria-hidden="true">
                      <SummitIcon name={provider.icon} />
                    </span>
                    <span className="provider-chip-label">{provider.title}</span>
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
