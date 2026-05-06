import Image from "next/image";
import { Calendar, Clock, MapPin } from "lucide-react";
import AnimatedCounter from "@/components/AnimatedCounter";
import CountdownTimer from "@/components/CountdownTimer";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";

export default function Hero({ language }: { language: Language }) {
  const { ui, heroStats } = CONTENT[language];

  return (
    <section className="relative w-full min-h-[92vh] sm:min-h-[94vh] flex items-center justify-center overflow-hidden">
      <Image
        src="/images/hero-bg.webp"
        alt={ui.heroAlt}
        fill
        className="object-cover object-center"
        sizes="100vw"
        priority
        quality={82}
      />
      <div className="hero-image-overlay" />

      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        <svg
          className="absolute top-[18%] left-[6%] opacity-[0.14] float-shape"
          width="52"
          height="52"
          viewBox="0 0 52 52"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M0,16 L0,0 L16,0 M36,0 L52,0 L52,16 M52,36 L52,52 L36,52 M16,52 L0,52 L0,36"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        </svg>
        <svg
          className="absolute top-[28%] right-[10%] opacity-[0.11] float-shape-reverse"
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          aria-hidden="true"
        >
          <line x1="20" y1="0" x2="20" y2="40" stroke="#22D3EE" strokeWidth="0.75" />
          <line x1="0" y1="20" x2="40" y2="20" stroke="#22D3EE" strokeWidth="0.75" />
          <circle cx="20" cy="20" r="7" stroke="#22D3EE" strokeWidth="0.75" fill="none" />
        </svg>
        <svg
          className="absolute bottom-[30%] left-[12%] opacity-[0.09] float-shape"
          style={{ animationDelay: "2s" }}
          width="30"
          height="30"
          viewBox="0 0 30 30"
          fill="none"
          aria-hidden="true"
        >
          <path d="M15,1 L29,15 L15,29 L1,15 Z" stroke="white" strokeWidth="1" />
        </svg>
        <svg
          className="absolute bottom-[18%] right-[6%] opacity-[0.07] float-shape-reverse"
          style={{ animationDelay: "1s" }}
          width="60"
          height="60"
          viewBox="0 0 60 60"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M0,18 L0,0 L18,0 M42,0 L60,0 L60,18 M60,42 L60,60 L42,60 M18,60 L0,60 L0,42"
            stroke="white"
            strokeWidth="1"
            strokeLinecap="square"
          />
        </svg>
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 text-center px-5 sm:px-6 py-10 sm:py-16 max-w-5xl mx-auto flex flex-col items-center">
        <ScrollReveal delay={100}>
          <h1 className="font-oswald text-[2rem] sm:text-5xl md:text-[4.2rem] lg:text-7xl font-bold text-white leading-[1.06] mb-6 sm:mb-7 tracking-tight">
            {ui.heroTitlePrefix}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
              {ui.heroTitleHighlight}
            </span>
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="text-base sm:text-lg md:text-xl text-blue-100/85 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            {ui.heroDescription}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={260}>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-8 sm:mb-10">
            {heroStats.map((stat, index) => (
              <div key={index} className="text-center px-5 py-3">
                <div className="flex items-baseline justify-center gap-1">
                  <AnimatedCounter
                    target={stat.number}
                    className="font-oswald text-3xl sm:text-4xl font-bold text-white"
                  />
                  {stat.suffix && (
                    <span className="font-oswald text-2xl font-bold text-white">
                      {stat.suffix}
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/70 uppercase tracking-wider font-medium mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={280}>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-6 sm:mb-8">
            <div className="flex items-center gap-2 text-cyan-300/90">
              <Calendar className="w-4 h-4" />
              <span className="text-sm sm:text-base font-semibold text-white tracking-wide">
                {ui.eventDayValue}
              </span>
            </div>
            <span className="hidden sm:inline text-white/25">|</span>
            <div className="flex items-center gap-2 text-cyan-300/90">
              <MapPin className="w-4 h-4" />
              <span className="text-sm sm:text-base font-medium text-white/80">
                {ui.eventDayVenue}
              </span>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={320}>
          <div className="mb-8 sm:mb-10">
            <div className="flex items-center justify-center gap-2 text-cyan-300/80 text-xs font-bold tracking-widest uppercase mb-3">
              <Clock className="w-3.5 h-3.5" />
              <span>{ui.countdownLabel}</span>
            </div>
            <CountdownTimer language={language} />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
