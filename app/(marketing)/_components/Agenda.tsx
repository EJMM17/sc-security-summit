import { Users } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import SectionIntro from "./_primitives/SectionIntro";

export default function Agenda({ language }: { language: Language }) {
  const { agenda, ui } = CONTENT[language];

  return (
    <section id="programa" className="mock-section mock-section--soft agenda-section">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <SectionIntro
            label={ui.agendaLabel}
            title={ui.agendaTitle}
            description={ui.agendaDesc}
            align="center"
            className="mb-12 sm:mb-16"
          />
        </ScrollReveal>

        <div className="agenda-editorial-grid">
          {agenda.map((block, blockIndex) => (
            <ScrollReveal key={block.title} delay={blockIndex * 80}>
              <article className="agenda-block">
                <header>
                  <div>
                    <p className="agenda-block-number">
                      {language === "es" ? "Bloque" : "Block"} {blockIndex + 1}
                    </p>
                    <h3>{block.title.replace(/^Bloque \d+ — |^Block \d+ — /, "")}</h3>
                  </div>
                  <span className="agenda-block-badge" aria-hidden="true">
                    {String(blockIndex + 1).padStart(2, "0")}
                  </span>
                </header>

                <p className="agenda-block-audience">
                  <Users aria-hidden="true" />
                  <span>{block.audience}</span>
                </p>

                <ol>
                  {block.sessions.map((session, sessionIndex) => (
                    <li key={`${session.title}-${sessionIndex}`}>
                      <span className="agenda-session-marker" aria-hidden="true" />
                      <div>
                        <p>{session.title}</p>
                        {"speaker" in session && session.speaker ? (
                          <span>{session.speaker}</span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
