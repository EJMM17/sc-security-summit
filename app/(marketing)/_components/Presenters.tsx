import type { CSSProperties } from "react";
import Image from "next/image";
import { Handshake } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import SectionIntro from "./_primitives/SectionIntro";

/* Column count for the lineup from 640px up, counting only the marks that
   follow the institutional row. It is the divisor that leaves no orphan cell
   showing the grid's hairline background, and it stays even so the two lead
   marks split their row exactly (eight marks read as four by two). */
function lineupColumns(count: number): number {
  if (count <= 5) return count % 2 === 0 ? count : count + 1;
  for (const columns of [4, 6, 2]) {
    if (count % columns === 0) return columns;
  }
  return 4;
}

export default function Presenters({ language }: { language: Language }) {
  const { ui, presenters } = CONTENT[language];

  /* The institutional marks head the lineup and take the first row between
     them; the columns are sized for the marks that follow. */
  const leads = presenters.filter((brand) => brand.lead);
  const rest = presenters.length - leads.length;
  const columns = lineupColumns(rest);

  /* On mobile the first mark opens the composition at full width, which only
     balances when the rest form complete pairs. A lead row already does that,
     so the anchor is only for a lineup without one. */
  const hasAnchor = leads.length === 0 && presenters.length % 2 === 1;

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
            <ul
              className="presenter-logo-grid"
              style={
                {
                  "--lineup-columns": columns,
                  "--lead-span": Math.max(
                    1,
                    Math.floor(columns / Math.max(leads.length, 1)),
                  ),
                } as CSSProperties
              }
              aria-label={ui.presentedBy}
            >
              {presenters.map((presenter, index) => (
                <li
                  key={presenter.name}
                  className="presenter-logo-card"
                  data-lead={presenter.lead ? "true" : undefined}
                  data-featured={hasAnchor && index === 0 ? "true" : undefined}
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
