import type { CSSProperties } from "react";
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
          <div className="presenter-stage">
            <div className="presenter-stage-glow" aria-hidden="true" />
            <ul className="presenter-wall" aria-label={ui.presentedBy}>
              {presenters.map((presenter, index) => (
                <li
                  key={presenter.name}
                  className="presenter-mark"
                  data-lead={presenter.lead ? "true" : undefined}
                  data-shape={presenter.shape}
                  style={{ "--tile-index": index } as CSSProperties}
                >
                  <div className="presenter-mark-surface">
                    {presenter.logo ? (
                      <div className="presenter-logo-frame">
                        <Image
                          src={presenter.logo}
                          alt={presenter.name}
                          fill
                          sizes="(max-width: 639px) 46vw, (max-width: 1023px) 30vw, 230px"
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <span className="presenter-wordmark">{presenter.name}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
