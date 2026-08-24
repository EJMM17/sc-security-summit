import Image from "next/image";
import { Calendar, MapPin } from "lucide-react";
import EventCountdown from "@/components/EventCountdown";
import { CONTENT, checkoutHref } from "@/lib/content";
import type { Language } from "@/lib/language";
import PrimaryCTA from "./_primitives/PrimaryCTA";

export default function Hero({ language }: { language: Language }) {
  const { ui, heroStats } = CONTENT[language];

  return (
    <section id="top" className="hero-section hero-production">
      <Image
        src="/images/hero-bg.webp"
        alt={ui.heroAlt}
        fill
        className="hero-background-image object-cover object-center"
        sizes="100vw"
        priority
        fetchPriority="high"
        quality={70}
      />
      <div className="hero-image-overlay" aria-hidden="true" />

      <div className="hero-production-inner">
        <h1 className="hero-title">
          {ui.heroTitlePrefix} <span>{ui.heroTitleHighlight}</span>
        </h1>

        <p className="hero-description">{ui.heroDescription}</p>

        <p className="hero-topics">{ui.heroTopics}</p>

        <dl className="hero-stat-grid">
          {heroStats.map((stat) => (
            <div key={stat.number}>
              <dt>
                {stat.number}
                {stat.suffix ? <span>{stat.suffix}</span> : null}
              </dt>
              <dd>{stat.label}</dd>
            </div>
          ))}
        </dl>

        <div className="hero-event-cluster">
          {/* Single inline fact line: the labels that used to sit above each
              value are redundant next to a calendar and a pin, so they stay
              only as accessible names for screen readers. */}
          <div className="hero-event-facts">
            <div>
              <Calendar aria-hidden="true" />
              <strong>
                <span className="sr-only">{ui.eventDayLabel}: </span>
                {ui.eventDayValue}
              </strong>
            </div>
            <div>
              <MapPin aria-hidden="true" />
              <strong>
                <span className="sr-only">{ui.locationLabel}: </span>
                {ui.eventDayVenue}
              </strong>
            </div>
          </div>

          <EventCountdown language={language} />
        </div>

        <div className="hero-actions">
          <PrimaryCTA href={checkoutHref(language)} size="lg">
            {ui.registerNowBtn}
          </PrimaryCTA>
          <a href="#programa" className="hero-secondary-link">
            <Calendar aria-hidden="true" />
            {ui.heroAgendaBtn}
          </a>
        </div>
      </div>
    </section>
  );
}
