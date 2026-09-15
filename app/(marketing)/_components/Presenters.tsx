import Image from "next/image";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";

export default function Presenters({ language }: { language: Language }) {
  const { ui, presenters } = CONTENT[language];

  return (
    <section
      id="presentadores"
      className="mock-section mock-section--tight mock-section--light presenters-section"
    >
      <div className="mock-container presenters-editorial">
        <ScrollReveal className="presenters-heading">
          <header className="presenters-intro">
            <div>
              <span className="section-label">{ui.presentersLabel}</span>
              <h2 className="section-title">{ui.presentersTitle}</h2>
            </div>
            <p className="presenters-description">{ui.presentersDesc}</p>
          </header>
        </ScrollReveal>

        <div className="presenter-stage">
          <ul className="presenter-wall" aria-label={ui.presentedBy}>
            {presenters.map((presenter) => (
              <li
                key={presenter.name}
                className="presenter-mark"
                data-lead={presenter.lead ? "true" : undefined}
                data-shape={presenter.shape}
              >
                <ScrollReveal className="presenter-mark-surface" threshold={0.1}>
                  <div className="presenter-brand">
                    {presenter.logo ? (
                      <div className="presenter-logo-frame">
                        <Image
                          src={presenter.logo}
                          alt={presenter.name}
                          fill
                          sizes={
                            presenter.lead
                              ? "(max-width: 639px) 42vw, 320px"
                              : "(max-width: 639px) 42vw, (max-width: 1023px) 26vw, 220px"
                          }
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <span className="presenter-wordmark">{presenter.name}</span>
                    )}
                  </div>
                </ScrollReveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
