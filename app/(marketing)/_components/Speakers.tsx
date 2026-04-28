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

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {speakers.map((speaker, index) => (
              <ScrollReveal key={index} delay={index * 150} direction="scale">
                <div className="speaker-card group">
                  <div className="speaker-photo-wrap">
                    <Image
                      src={speaker.image}
                      alt={speaker.name}
                      fill
                      sizes="(max-width:640px) 80vw, (max-width:1024px) 45vw, 22vw"
                      className="speaker-avatar object-cover object-top"
                    />
                    <span className="speaker-tag absolute top-3 left-3 z-10">
                      {speaker.topic}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-900/55 to-transparent pointer-events-none z-[1]" />
                    <span className="speaker-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="speaker-info p-5 pb-4">
                    <h3 className="font-oswald text-base font-bold text-slate-900 leading-tight">
                      {speaker.name}
                    </h3>
                    <p className="text-[0.76rem] text-slate-500 mt-1.5 leading-snug flex items-center">
                      <span className="speaker-role-dot" />
                      {speaker.role}
                    </p>
                  </div>

                  <div className="speaker-accent-line" />
                </div>
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
