import { MapPin, Calendar, Phone, ExternalLink } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

export default function UbicacionSection() {
  return (
    <section id="ubicacion" className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="section-label flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4" /> SEDE DEL EVENTO
            </span>
            <h2 className="section-title mt-3">Centro de Convenciones de Reynosa</h2>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="grid md:grid-cols-5 gap-8 items-start">
            <div className="md:col-span-3 rounded-2xl overflow-hidden shadow-xl border border-slate-200">
              <iframe
                src="https://www.google.com/maps?q=Blvd.+Morelos+190,+Col.+Longoria,+88630+Reynosa,+Tamaulipas,+Mexico&output=embed"
                className="w-full h-[350px]"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Centro de Convenciones de Reynosa"
              />
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="card-elevated p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Dirección</h4>
                    <p className="text-sm text-slate-700 font-medium mt-1">Centro de Convenciones de Reynosa</p>
                    <p className="text-sm text-slate-500 mt-0.5">Blvd. Morelos 190, Col. Longoria</p>
                    <p className="text-sm text-slate-500">Reynosa, Tamaulipas, C.P. 88630</p>
                    <a
                      href="https://maps.google.com/?q=Blvd.+Morelos+190,+Col.+Longoria,+88630+Reynosa,+Tamaulipas,+Mexico"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2 font-medium"
                    >
                      <ExternalLink className="w-3 h-3" /> Ver en Google Maps
                    </a>
                  </div>
                </div>
              </div>
              <div className="card-elevated p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Fechas</h4>
                    <p className="text-sm text-slate-500 mt-1">24 y 25 de septiembre, 2026</p>
                    <p className="text-xs text-slate-400 mt-1">8:00 AM — 5:30 PM</p>
                  </div>
                </div>
              </div>
              <div className="card-elevated p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Contacto</h4>
                    <p className="text-sm text-slate-500 mt-1">+1 (956) 515-8070</p>
                    <a href="mailto:Contacto@LanzLogistics.com" className="text-sm text-blue-600 hover:underline">Contacto@LanzLogistics.com</a>
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
