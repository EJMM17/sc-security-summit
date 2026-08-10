import Image from "next/image";
import { Handshake } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import SectionIntro from "./_primitives/SectionIntro";

export default function Presenters({ language }: { language: Language }) {
  const { ui, presenters } = CONTENT[language];

  return (
    <section
      id="presentadores"
      className="mock-section mock-section--tight mock-section--light presenters-section"
    >
      <div className="mock-container">
        <ScrollReveal>
          <SectionIntro
            label={ui.presentersLabel}
            title={ui.presentersTitle}
            description={ui.presentersDesc}
            icon={<Handshake className="w-4 h-4" />}
            align="center"
            className="mock-section-intro"
          />
        </ScrollReveal>

        <ScrollReveal delay={120}>
          <div className="presenter-logo-stage">
            <span
              className="presenter-stage-glow presenter-stage-glow--left"
              aria-hidden="true"
            />
            <span
              className="presenter-stage-glow presenter-stage-glow--right"
              aria-hidden="true"
            />
            <ul className="presenter-logo-grid" aria-label={ui.presentedBy}>
              {presenters.map((presenter, index) => (
                <li
                  key={presenter.name}
                  className="presenter-logo-card"
                  data-featured={index === 0 ? "true" : undefined}
                >
                  {presenter.logo ? (
                    <div className="presenter-logo-frame">
                      <Image
                        src={presenter.logo}
                        alt={presenter.name}
                        fill
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    /* Full-colour asset still pending: a wordmark keeps the
                     lineup complete instead of shipping a broken image. */
                    <span className="presenter-wordmark">{presenter.name}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
