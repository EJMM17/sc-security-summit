import { Calendar, ExternalLink, MapPin, Phone } from "lucide-react";
import OnDemandMap from "@/components/OnDemandMap";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";

export default function Location({ language }: { language: Language }) {
  const { ui } = CONTENT[language];

  return (
    <section id="ubicacion" className="mock-section mock-location">
      <div className="mock-container">
        <ScrollReveal>
          <div className="mock-section-intro text-center">
            <span className="section-label section-label--center">
              <MapPin className="w-4 h-4" /> {ui.locationLabel}
            </span>
            <h2 className="section-title mt-3">{ui.locationTitle}</h2>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="grid md:grid-cols-5 gap-8 items-start">
            <div className="md:col-span-3 summit-map-shell">
              <OnDemandMap
                buttonLabel={ui.loadInteractiveMap}
                privacyNote={ui.mapPrivacyNote}
                title={ui.mapTitle}
              />
            </div>

            <div className="md:col-span-2 space-y-6 location-facts stagger-children">
              <div className="reveal card-elevated p-6">
                <div className="flex items-start gap-4">
                  <span className="mock-icon-box" aria-hidden="true">
                    <MapPin strokeWidth={1.8} />
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{ui.addressLabel}</h4>
                    <p className="text-sm text-slate-700 font-medium mt-1">{ui.addressName}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{ui.addressLine1}</p>
                    <p className="text-sm text-slate-500">{ui.addressLine2}</p>
                    <a
                      href="https://maps.google.com/?q=Libramiento+Ote+S/N,+Azteca,+88680+Reynosa,+Tamaulipas,+Mexico"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2 font-medium"
                    >
                      <ExternalLink className="w-3 h-3" /> {ui.viewOnMaps}
                    </a>
                  </div>
                </div>
              </div>
              <div className="reveal card-elevated p-6">
                <div className="flex items-start gap-4">
                  <span className="mock-icon-box" aria-hidden="true">
                    <Calendar strokeWidth={1.8} />
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{ui.datesLabel}</h4>
                    <p className="text-sm text-slate-500 mt-1">{ui.datesValue}</p>
                    <p className="text-xs text-slate-400 mt-1">{ui.datesHours}</p>
                  </div>
                </div>
              </div>
              <div className="reveal card-elevated p-6">
                <div className="flex items-start gap-4">
                  <span className="mock-icon-box" aria-hidden="true">
                    <Phone strokeWidth={1.8} />
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{ui.contactLabel}</h4>
                    <p className="text-sm text-slate-500 mt-1">+52 899 112 8755</p>
                    <a
                      href="mailto:hola@scsecuritysummit.com"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      hola@scsecuritysummit.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
