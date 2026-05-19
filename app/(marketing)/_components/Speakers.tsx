import Image from "next/image";
import { Mic2 } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import WaveSeparator from "./_primitives/WaveSeparator";

export default function Speakers({ language }: { language: Language }) {
  const { ui, speakers } = CONTENT[language];

  return (
    <>
      <WaveSeparator color="#FFFFFF" flip />
      <section id="speakers" className="rhythm-pause-lg bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="section-label flex items-center justify-center gap-2">
                <Mic2 className="w-4 h-4" /> {ui.speakersLabel}
              </span>
              <h2 className="section-title mt-3">
                <span className="speaker-section-title">{ui.speakersTitle}</span>
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto mt-4">{ui.speakersDesc}</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {speakers.map((speaker, index) => (
              <ScrollReveal key={index} delay={index * 120} direction="scale">
                <article className="speaker-card group">
                  <div className="speaker-photo-wrap">
                    <Image
                      src={speaker.image}
                      alt={speaker.name}
                      fill
                      sizes="(max-width:640px) 50vw, (max-width:1024px) 45vw, 25vw"
                      className="speaker-avatar object-cover object-top"
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMxZTI5M2IiLz48L3N2Zz4="
                    />

                    {/* Bottom gradient for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/25 to-transparent z-[1] pointer-events-none" />

                    {/* Topic badge — top-left, reveals on scroll */}
                    <span className="speaker-tag absolute top-3 left-3 z-10">
                      {speaker.topic}
                    </span>

                    {/* Decorative index number */}
                    <span className="speaker-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    {/* Name + role always visible at the bottom */}
                    <div className="absolute bottom-0 inset-x-0 z-10 px-3 sm:px-4 pb-4 pt-10">
                      <h3 className="font-oswald text-[0.9rem] sm:text-[1rem] font-bold text-white leading-tight tracking-wide">
                        {speaker.name}
                      </h3>
                      <p className="mt-1 text-[0.62rem] sm:text-[0.68rem] text-blue-300 leading-snug font-semibold tracking-wider uppercase">
                        {speaker.role}
                      </p>
                    </div>
                  </div>

                  <div className="speaker-accent-line" />
                </article>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={600}>
            <p className="text-center text-sm text-slate-400 mt-12">
              {ui.speakersMorePrefix}{" "}
              <a href="#registro" className="text-blue-600 font-semibold hover:underline">
                {ui.speakersMoreCTA}
              </a>
            </p>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
