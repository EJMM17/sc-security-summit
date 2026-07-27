"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Language } from "@/lib/language";

type SpeakerSlide = {
  name: string;
  role: string;
  topic: string;
  headline: string;
  description: string;
  image: string;
};

export default function SpeakersCarousel({
  speakers,
  language,
}: {
  speakers: readonly SpeakerSlide[];
  language: Language;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (paused || speakers.length < 2) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % speakers.length);
    }, 7000);

    return () => window.clearInterval(interval);
  }, [paused, speakers.length]);

  const speaker = speakers[activeIndex];
  const previousLabel = language === "es" ? "Conferencista anterior" : "Previous speaker";
  const nextLabel = language === "es" ? "Siguiente conferencista" : "Next speaker";

  const goTo = (index: number) => {
    setActiveIndex((index + speakers.length) % speakers.length);
  };

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + speakers.length) % speakers.length);
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % speakers.length);
  };

  const handleTouchEnd = (clientX: number) => {
    if (touchStartX.current === null) return;
    const distance = clientX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(distance) < 44) return;
    if (distance > 0) goToPrevious();
    else goToNext();
  };

  return (
    <div
      className="speaker-carousel"
      role="region"
      tabIndex={0}
      aria-roledescription={language === "es" ? "carrusel" : "carousel"}
      aria-label={language === "es" ? "Conferencistas confirmados" : "Confirmed speakers"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
        setPaused(true);
      }}
      onTouchEnd={(event) => {
        handleTouchEnd(event.changedTouches[0]?.clientX ?? 0);
        setPaused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") goToPrevious();
        if (event.key === "ArrowRight") goToNext();
      }}
    >
      <article key={speaker.name} className="speaker-slide">
        <div className="speaker-slide-photo">
          <Image
            src={speaker.image}
            alt={speaker.name}
            fill
            sizes="(max-width: 767px) 100vw, 38vw"
            className="object-cover object-top"
            priority={activeIndex === 0}
          />
          <div className="speaker-slide-photo-overlay" aria-hidden="true" />
          <span className="speaker-slide-topic">{speaker.topic}</span>
          <div className="speaker-slide-identity">
            <h3>{speaker.name}</h3>
            <p>{speaker.role}</p>
          </div>
        </div>

        <div className="speaker-slide-copy" aria-live="polite">
          <span className="speaker-slide-quote" aria-hidden="true">“</span>
          <p className="speaker-slide-kicker">
            {language === "es" ? "Conversación clave" : "Key conversation"}
          </p>
          <h4>{speaker.headline}</h4>
          <p className="speaker-slide-description">{speaker.description}</p>
        </div>
      </article>

      <div className="speaker-carousel-controls">
        <button
          type="button"
          className="speaker-carousel-arrow"
          onClick={goToPrevious}
          aria-label={previousLabel}
          title={previousLabel}
        >
          <ArrowLeft aria-hidden="true" />
        </button>
        <div
          className="speaker-carousel-dots"
          role="group"
          aria-label={language === "es" ? "Elegir conferencista" : "Choose speaker"}
        >
          {speakers.map((item, index) => (
            <button
              key={item.name}
              type="button"
              aria-pressed={index === activeIndex}
              aria-label={item.name}
              className={index === activeIndex ? "is-active" : ""}
              onClick={() => goTo(index)}
            >
              <span className="speaker-carousel-thumb">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="44px"
                  className="object-cover object-top"
                  aria-hidden="true"
                />
              </span>
              <span className="speaker-carousel-person">
                <strong>{item.name}</strong>
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="speaker-carousel-arrow"
          onClick={goToNext}
          aria-label={nextLabel}
          title={nextLabel}
        >
          <ArrowRight aria-hidden="true" />
        </button>
        <div className="speaker-carousel-progress" aria-hidden="true">
          <span key={activeIndex} className={paused ? "is-paused" : ""} />
        </div>
      </div>
    </div>
  );
}
