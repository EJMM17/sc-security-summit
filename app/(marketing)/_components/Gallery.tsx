import Image from "next/image";
import { Building2, Mic2, Network, Users } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";

export default function Gallery({ language }: { language: Language }) {
  const { ui } = CONTENT[language];

  return (
    <section className="py-16 sm:py-24 bg-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-10 sm:mb-14">
            <span className="section-label">{ui.galleryLabel}</span>
            <h2 className="section-title mt-3">{ui.galleryTitle}</h2>
            <p className="text-slate-500 max-w-xl mx-auto mt-4 text-base leading-relaxed">
              {ui.galleryDesc}
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={120}>
          <div className="gallery-bento">
            <div className="gallery-photo gallery-p1">
              <Image
                src="/images/gallery-hall.webp"
                alt={ui.galleryTag1}
                fill
                className="object-cover"
                sizes="(max-width: 480px) 100vw, (max-width: 1024px) 100vw, 62vw"
              />
              <div className="gallery-photo-overlay" />
              <div className="gallery-photo-label">
                <span className="gallery-photo-tag">
                  <Building2 className="w-3 h-3" /> {ui.galleryTag1}
                </span>
                <p className="text-white font-oswald text-xl font-bold leading-tight mt-1 drop-shadow-sm">
                  SC Security Summit 2026
                </p>
              </div>
            </div>

            <div className="gallery-photo gallery-p2">
              <Image
                src="/images/gallery-registro.webp"
                alt={ui.galleryTag2}
                fill
                className="object-cover object-top"
                sizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 26vw"
              />
              <div className="gallery-photo-overlay" />
              <div className="gallery-photo-label">
                <span className="gallery-photo-tag">
                  <Users className="w-3 h-3" /> {ui.galleryTag2}
                </span>
                <p className="text-white/85 text-xs mt-1">Reynosa, Tamaulipas</p>
              </div>
            </div>

            <div className="gallery-photo gallery-p3">
              <Image
                src="/images/gallery-keynote.webp"
                alt={ui.galleryTag3}
                fill
                className="object-cover"
                sizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 36vw"
              />
              <div className="gallery-photo-overlay" />
              <div className="gallery-photo-label">
                <span className="gallery-photo-tag">
                  <Mic2 className="w-3 h-3" /> {ui.galleryTag3}
                </span>
              </div>
            </div>

            <div className="gallery-photo gallery-p4">
              <Image
                src="/images/gallery-hub.webp"
                alt={ui.galleryTag4}
                fill
                className="object-cover"
                sizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 30vw"
              />
              <div className="gallery-photo-overlay" />
              <div className="gallery-photo-label">
                <span className="gallery-photo-tag">
                  <Network className="w-3 h-3" /> {ui.galleryTag4}
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
