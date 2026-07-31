import Image from "next/image";
import { Calendar, MapPin } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT, EVENTBRITE_URL } from "@/lib/content";
import type { Language } from "@/lib/language";
import PrimaryCTA from "./_primitives/PrimaryCTA";

export default function Hero({ language }: { language: Language }) {
  const { ui, heroStats } = CONTENT[language];

  const renderPresenters = (modifier = "") => (
    <div className={`hero-presenters ${modifier}`} aria-label={ui.presentedBy}>
      <span>{ui.presentedBy}</span>
      <div className="hero-presenter-logos">
        <div className="hero-presenter-logo is-standard">
          <Image
            src="/images/presenter-lanz-logistics.png"
            alt="Lanz Logistics"
            fill
            sizes="160px"
            className="object-contain"
          />
        </div>
        <div className="hero-presenter-logo is-iies">
          <Image
            src="/images/presenter-iies.png"
            alt="Instituto Internacional de Estudios Superiores"
            fill
            sizes="160px"
            className="object-contain"
          />
        </div>
        <div className="hero-presenter-logo is-wide">
          <Image
            src="/images/presenter-villa-florida.png"
            alt="Parque Industrial Villa Florida"
            fill
            sizes="190px"
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );

  const renderIntelligence = (modifier = "") => (
    <aside className={`hero-intelligence ${modifier}`}>
      <div className="hero-countdown-clock">
        <CountdownTimer language={language} />
      </div>
      <div className="hero-stat-grid">
        {heroStats.map((stat, index) => (
          <div key={index}>
            <div>
              <span>{stat.number}</span>
              {stat.suffix ? <span>{stat.suffix}</span> : null}
            </div>
            <p>{stat.label}</p>
          </div>
        ))}
      </div>
    </aside>
  );

  return (
    <section className="hero-section">
      <picture className="absolute inset-0">
        <source srcSet="/images/hero-bg-800.webp" media="(max-width: 768px)" />
        <source srcSet="/images/hero-bg-1200.webp" media="(max-width: 1200px)" />
          <Image
            src="/images/hero-bg.webp"
            alt={ui.heroAlt}
            fill
            className="hero-background-image object-cover object-center"
          sizes="100vw"
          priority
          quality={82}
        />
      </picture>
      <div className="hero-image-overlay" />

      <div className="hero-layout">
        <div className="hero-main">
          <ScrollReveal delay={80}>
            <p className="hero-eyebrow">{ui.heroKicker}</p>
            <h1 className="hero-title">
              {ui.heroTitlePrefix} <span>{ui.heroTitleHighlight}</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            {renderPresenters()}
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <div className="hero-event-facts">
              <div>
                <Calendar aria-hidden="true" />
                <div>
                  <small>{ui.eventDayLabel}</small>
                  <span>{ui.eventDayValue}</span>
                </div>
              </div>
              <div>
                <MapPin aria-hidden="true" />
                <div>
                  <small>{ui.locationLabel}</small>
                  <span>{ui.eventDayVenue}</span>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={180}>
            <p className="hero-description">{ui.heroDescription}</p>
          </ScrollReveal>

          <ScrollReveal delay={210}>
            <div className="hero-actions">
              <PrimaryCTA href={EVENTBRITE_URL} external size="lg">
                {ui.registerNowBtn}
              </PrimaryCTA>
              <a href="#agenda" className="hero-secondary-link">
                <Calendar aria-hidden="true" />
                {ui.heroAgendaBtn}
              </a>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={240} direction="scale" className="hero-intelligence-wrap">
            {renderIntelligence()}
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
