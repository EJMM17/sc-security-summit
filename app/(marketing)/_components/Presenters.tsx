import type { CSSProperties } from "react";
import Image from "next/image";
import { Handshake } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT, type Presenter } from "@/lib/content";
import type { Language } from "@/lib/language";
import SectionIntro from "./_primitives/SectionIntro";

/* One lineup of brand marks: the same card, canvas and hover for presenting
   organizations and for sponsors, so the section reads as a single wall of
   brands. Only the caption above the block and the desktop column count
   change between them. */
function LogoLineup({
  brands,
  caption,
  ariaLabel,
}: {
  brands: readonly Presenter[];
  caption: string;
  ariaLabel: string;
}) {
  /* The desktop row never grows past five marks: beyond that the logos shrink
     below a readable size inside the card. */
  const columns = Math.min(brands.length, 5);

  return (
    <div className="presenter-lineup">
      <p className="presenter-lineup-label">{caption}</p>
      <ul
        className="presenter-logo-grid"
        style={{ "--lineup-columns": columns } as CSSProperties}
        aria-label={ariaLabel}
      >
        {brands.map((brand, index) => (
          <li
            key={brand.name}
            className="presenter-logo-card"
            data-featured={index === 0 ? "true" : undefined}
          >
            {brand.logo ? (
              <div className="presenter-logo-frame">
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  fill
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
                  className="object-contain"
                />
              </div>
            ) : (
              /* Full-colour asset still pending: a wordmark keeps the
                 lineup complete instead of shipping a broken image. */
              <span className="presenter-wordmark">{brand.name}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Presenters({ language }: { language: Language }) {
  const { ui, presenters, sponsors } = CONTENT[language];

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
            <LogoLineup
              brands={presenters}
              caption={ui.presentersLineupLabel}
              ariaLabel={ui.presentedBy}
            />
            {sponsors.length > 0 ? (
              <LogoLineup
                brands={sponsors}
                caption={ui.sponsorsLineupLabel}
                ariaLabel={ui.sponsoredBy}
              />
            ) : null}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
