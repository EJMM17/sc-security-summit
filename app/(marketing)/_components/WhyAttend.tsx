import Image from "next/image";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import SectionIntro from "./_primitives/SectionIntro";

const WHY_ATTEND_PHOTOS = [
  "/images/photo-conference-audience.webp",
  "/images/photo-conference-speaker.webp",
  "/images/photo-logistics-operations.webp",
  "/images/photo-logistics-team.webp",
] as const;

export default function WhyAttend({ language }: { language: Language }) {
  const { ui, whyAttend } = CONTENT[language];

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <SectionIntro
            label={ui.whyAttendLabel}
            title={ui.whyAttendTitle}
            description={ui.whyAttendDesc}
            align="center"
            className="mb-16"
          />
        </ScrollReveal>

        <div className="why-photo-grid">
          {whyAttend.map((item, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <article className="why-photo-card">
                <div className="why-photo-card-media">
                  <Image
                    src={WHY_ATTEND_PHOTOS[index]}
                    alt=""
                    fill
                    sizes="(max-width: 767px) 100vw, 50vw"
                    className="object-cover"
                    aria-hidden="true"
                  />
                </div>
                <div className="why-photo-card-copy">
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
