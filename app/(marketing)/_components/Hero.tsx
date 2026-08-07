import Image from "next/image";
import { Calendar, MapPin } from "lucide-react";
import EventCountdown from "@/components/EventCountdown";
import { CONTENT, EVENTBRITE_URL } from "@/lib/content";
import type { Language } from "@/lib/language";
import PrimaryCTA from "./_primitives/PrimaryCTA";

const PRESENTER_LOGOS = [
  {
    src: "/images/presenter-lanz-logistics.png",
    alt: "Lanz Logistics",
    className: "is-standard",
  },
  {
    src: "/images/presenter-iies.png",
    alt: "Instituto Internacional de Estudios Superiores",
    className: "is-iies",
  },
  {
    src: "/images/presenter-villa-florida.png",
    alt: "Parque Industrial Villa Florida",
    className: "is-wide",
  },
] as const;

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

        <div className="hero-presenters" aria-label={ui.presentedBy}>
          <span>{ui.presentedBy}</span>
          <div className="hero-presenter-logos">
            {PRESENTER_LOGOS.map((logo) => (
              <div key={logo.src} className={`hero-presenter-logo ${logo.className}`}>
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  fill
                  sizes="(max-width: 640px) 150px, 220px"
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>

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
          <PrimaryCTA href={EVENTBRITE_URL} external size="lg">
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
