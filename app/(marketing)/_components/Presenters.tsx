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
          {/* One wall, not a set of cards. Every mark sits on the same white
              plane with no tile, no frame and no shadow of its own; the only
              structure is the rhythm of the grid and a single rule under the
              institutional row. The brand assets ship on a flat white
              background (PHOTO_MANIFEST.md), so a white plane is also the one
              surface that never draws a visible rectangle around a logo. */}
          <ul className="presenter-wall" aria-label={ui.presentedBy}>
            {presenters.map((presenter, index) => (
              <li
                key={presenter.name}
                className="presenter-mark"
                data-lead={presenter.lead ? "true" : undefined}
                data-shape={presenter.shape}
                /* The mark's place in the lineup, which is all the entrance
                   animation needs to land the wall in reading order. The
                   stylesheet owns the timing; the component only counts. */
                style={{ "--tile-index": index } as CSSProperties}
              >
                {presenter.logo ? (
                  <div className="presenter-logo-frame">
                    <Image
                      src={presenter.logo}
                      alt={presenter.name}
                      fill
                      sizes="(max-width: 639px) 45vw, (max-width: 1023px) 30vw, 220px"
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
        </ScrollReveal>
      </div>
    </section>
  );
}
