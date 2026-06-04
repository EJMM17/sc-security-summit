import { ArrowRight, Sparkles, LayoutGrid, Ruler, CheckCircle2, Star } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import WaveSeparator from "./_primitives/WaveSeparator";

export default function Sponsors({ language }: { language: Language }) {
  const { ui, sponsorTierMeta, sponsors } = CONTENT[language];
  const sponsor = sponsors[0];
  const meta = sponsorTierMeta[0];

  const benefitGroups = groupBenefits(sponsor.benefits, language);

  return (
    <>
      <WaveSeparator color="#F8FAFC" />
      <section id="patrocinadores" className="sponsors-section py-20 sm:py-28 relative overflow-hidden">
        <div className="sponsors-bg-glow" aria-hidden="true" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center mb-14 sm:mb-16">
              <span className="section-label justify-center">{ui.sponsorsLabel}</span>
              <h2 className="section-title mt-3">{ui.sponsorsTitle}</h2>
              <p className="text-slate-500 max-w-2xl mx-auto mt-4">{ui.sponsorsDesc}</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="sponsor-card sponsor-card--featured group relative rounded-3xl bg-white border border-slate-200/80 overflow-hidden hover:ring-2 hover:ring-slate-300 transition-all duration-500">
              <div className={`h-1.5 w-full ${meta.stripe}`} aria-hidden="true" />

              {/* ── HEADER ── */}
              <div className="relative px-6 pt-6 pb-5 lg:px-8 lg:pt-8 lg:pb-6 border-b border-slate-100">
                <span
                  className="absolute -right-3 top-0 font-oswald font-black text-[140px] leading-none text-slate-900/[0.025] select-none pointer-events-none group-hover:text-slate-900/[0.05] transition-colors duration-500"
                  aria-hidden="true"
                >
                  SC
                </span>
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-slate-100" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        {ui.sponsorsLabel}
                      </p>
                      <p className="text-lg font-bold text-slate-900 font-oswald tracking-wide">
                        {sponsor.tier}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-3 py-1.5">
                      <Ruler className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                      <span className="text-xs font-semibold text-slate-700">{ui.sponsorStandLabel}: {meta.stand}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-3 py-1.5">
                      <LayoutGrid className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                      <span className="text-xs font-semibold text-slate-700">{meta.slotsTotal} {ui.sponsorSlotsLabel}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── BENEFITS GRID ── */}
              <div className="relative p-6 lg:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 mb-5">
                  {sponsor.benefits.length} {ui.sponsorBenefitsLabel}
                </p>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0">
                  {benefitGroups.map((group, gi) => (
                    <div key={gi}>
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                        <Star className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.5} fill="currentColor" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                          {group.label}
                        </span>
                      </div>
                      <ul className="space-y-2 mb-6">
                        {group.items.map((benefit, bi) => (
                          <li
                            key={bi}
                            className="flex items-start gap-2 text-[13px] leading-snug text-slate-600"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── CTA FOOTER ── */}
              <div className="relative px-6 pb-6 lg:px-8 lg:pb-8">
                <div className="flex flex-col sm:flex-row items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-sm text-slate-500 flex-1 text-center sm:text-left">
                    {language === "es"
                      ? "¿Listo para posicionar tu marca? Solicita más información y un asesor te contactará."
                      : "Ready to position your brand? Request more information and an advisor will contact you."}
                  </p>
                  <a
                    href={`mailto:hola@scsecuritysummit.com?subject=${encodeURIComponent(
                      language === "es"
                        ? "Patrocinio – Summit 2026"
                        : "Sponsorship – Summit 2026",
                    )}`}
                    className="sponsor-cta inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:-translate-y-0.5 bg-slate-900 text-white hover:bg-slate-800 shadow-[0_8px_22px_-8px_rgba(15,23,42,0.45)] whitespace-nowrap"
                  >
                    {ui.sponsorRequestInfo}
                    <ArrowRight
                      className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                      strokeWidth={2.5}
                    />
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

type BenefitGroup = { label: string; items: string[] };

function groupBenefits(benefits: readonly string[], language: Language): BenefitGroup[] {
  const labels =
    language === "es"
      ? { visibility: "Visibilidad", experience: "Experiencia", training: "Capacitación" }
      : { visibility: "Visibility", experience: "Experience", training: "Training" };

  const third = Math.ceil(benefits.length / 3);
  return [
    { label: labels.visibility, items: benefits.slice(0, third) as unknown as string[] },
    { label: labels.experience, items: benefits.slice(third, third * 2) as unknown as string[] },
    { label: labels.training, items: benefits.slice(third * 2) as unknown as string[] },
  ];
}
