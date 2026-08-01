import Image from "next/image";
import ScrollReveal from "@/components/ScrollReveal";
import { PRESENTERS_COPY } from "@/lib/content";
import type { Language } from "@/lib/language";

const logos = [
  {
    src: "/images/presenter-lanz-logistics.png",
    alt: "Lanz Logistics",
    width: 198,
    height: 64,
  },
  {
    src: "/images/presenter-iies.png",
    alt: "Instituto Internacional de Estudios Superiores",
    width: 198,
    height: 64,
  },
  {
    src: "/images/presenter-villa-florida.png",
    alt: "Universidad Tecnológica de Matamoros Villa Florida",
    width: 198,
    height: 64,
  },
] as const;

export default function Presenters({ language }: { language: Language }) {
  const copy = PRESENTERS_COPY[language];

  return (
    <section className="presenters-band" aria-labelledby="presenters-title">
      <div className="mock-container">
        <ScrollReveal>
          <div className="presenters-band-heading">
            <span>{copy.label}</span>
            <h2 id="presenters-title">{copy.title}</h2>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="presenters-logo-grid">
            {logos.map((logo) => (
              <div className="presenters-logo-card" key={logo.src}>
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.width}
                  height={logo.height}
                  sizes="(max-width: 640px) 45vw, 198px"
                />
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
