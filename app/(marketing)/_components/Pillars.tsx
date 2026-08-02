import {
  Gauge,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { COMPETENCIES, CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import SectionIntro from "./_primitives/SectionIntro";

const ICONS = [Gauge, Truck, ShieldCheck, LockKeyhole, RefreshCw, Users] as const;

export default function Pillars({ language }: { language: Language }) {
  const { ui } = CONTENT[language];
  const competencies = COMPETENCIES[language];

  return (
    <section id="formacion" className="mock-section mock-section--soft">
      <div className="mock-container">
        <ScrollReveal>
          <SectionIntro
            label={ui.pillarsLabel}
            title={ui.pillarsTitle}
            description={ui.pillarsDesc}
            align="center"
            className="mock-section-intro"
          />
        </ScrollReveal>

        <ScrollReveal>
          <div className="surface-card competency-panel">
            <ol className="competency-list">
              {competencies.map((title, index) => {
                const CompetencyIcon = ICONS[index];

                return (
                  <li key={title} className="competency-row">
                    <span className="competency-row-index" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="competency-row-icon" aria-hidden="true">
                      <CompetencyIcon />
                    </span>
                    <h3>{title}</h3>
                  </li>
                );
              })}
            </ol>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
