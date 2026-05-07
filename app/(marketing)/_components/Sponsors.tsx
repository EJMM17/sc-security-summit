import { ArrowRight, LayoutGrid, Ruler } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import WaveSeparator from "./_primitives/WaveSeparator";

export default function Sponsors({ language }: { language: Language }) {
  const { ui, sponsorTierMeta, sponsors } = CONTENT[language];

  return (
    <>
      <WaveSeparator color="#F8FAFC" />
      <section id="patrocinadores" className="sponsors-section py-20 sm:py-28 relative overflow-hidden">
        <div className="sponsors-bg-glow" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center mb-14 sm:mb-16">
              <span className="section-label justify-center">{ui.sponsorsLabel}</span>
              <h2 className="section-title mt-3">{ui.sponsorsTitle}</h2>
              <p className="text-slate-500 max-w-2xl mx-auto mt-4">{ui.sponsorsDesc}</p>
            </div>
          </ScrollReveal>

          <div className="flex flex-col gap-5">
            {sponsors.map((sponsor, index) => {
              const meta = sponsorTierMeta[index];
              const levelLabel = String(meta.level).padStart(2, "0");

              const ctaClass = meta.featured
                ? "bg-slate-900 text-white hover:bg-slate-800 shadow-[0_8px_22px_-8px_rgba(15,23,42,0.45)]"
                : meta.highlighted
                  ? "bg-amber-500 text-white hover:bg-amber-400 shadow-[0_8px_22px_-8px_rgba(245,158,11,0.5)]"
                  : index === 2
                    ? "bg-slate-700 text-white hover:bg-slate-600 shadow-[0_8px_20px_-8px_rgba(15,23,42,0.38)]"
                    : "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_8px_22px_-8px_rgba(37,99,235,0.5)]";

              // Split benefits into two columns
              const half = Math.ceil(sponsor.benefits.length / 2);
              const col1 = sponsor.benefits.slice(0, half);
              const col2 = sponsor.benefits.slice(half);

              return (
                <ScrollReveal key={index} delay={index * 80}>
                  <div
                    className={`sponsor-card group relative rounded-3xl bg-white border border-slate-200/80 overflow-hidden transition-all duration-500 ${meta.ring} ${
                      meta.featured ? "sponsor-card--featured" : ""
                    }`}
                  >
                    {/* top stripe */}
                    <div className={`h-1.5 w-full ${meta.stripe}`} aria-hidden="true" />

                    {/* watermark number */}
                    <span
                      className="absolute -right-3 bottom-0 font-oswald font-black text-[160px] leading-none text-slate-900/[0.03] select-none pointer-events-none group-hover:text-slate-900/[0.055] transition-colors duration-500"
                      aria-hidden="true"
                    >
                      {levelLabel}
                    </span>

                    <div className="relative flex flex-col lg:flex-row gap-0">
                      {/* ── LEFT PANEL: identity + meta + CTA ── */}
                      <div className="lg:w-56 xl:w-64 flex-shrink-0 flex flex-col justify-between gap-6 p-6 lg:border-r border-b lg:border-b-0 border-slate-100">
                        <div>
                          <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${meta.accent} mb-1`}>
                            {ui.sponsorsLabel.split(" ")[0]} {levelLabel}
                          </p>
                          <h3 className="font-oswald text-2xl font-bold text-slate-900 leading-tight tracking-tight">
                            {sponsor.tier}
                          </h3>
                        </div>

                        <div className="flex flex-row lg:flex-col gap-2">
                          <div className="flex-1 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                            <div className="flex items-center gap-1 text-slate-400 mb-1">
                              <Ruler className="w-3 h-3" strokeWidth={2} />
                              <p className="text-[9px] font-bold uppercase tracking-wider">{ui.sponsorStandLabel}</p>
                            </div>
                            <p className={`text-sm font-bold ${meta.accent}`}>{meta.stand}</p>
                          </div>
                          <div className="flex-1 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                            <div className="flex items-center gap-1 text-slate-400 mb-1">
                              <LayoutGrid className="w-3 h-3" strokeWidth={2} />
                              <p className="text-[9px] font-bold uppercase tracking-wider">{ui.sponsorSlotsLabel}</p>
                            </div>
                            <p className={`text-sm font-bold font-mono ${meta.accent}`}>{meta.slotsTotal}</p>
                          </div>
                        </div>

                        <a
                          href={`mailto:hola@scsecuritysummit.com.mx?subject=${encodeURIComponent(
                            `Patrocinio ${sponsor.tier} – Summit 2026`,
                          )}`}
                          className={`sponsor-cta inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:-translate-y-0.5 ${ctaClass}`}
                        >
                          {ui.sponsorRequestInfo}
                          <ArrowRight
                            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                            strokeWidth={2.5}
                          />
                        </a>
                      </div>

                      {/* ── RIGHT PANEL: benefits in two columns ── */}
                      <div className="flex-1 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                            {sponsor.benefits.length} {ui.sponsorBenefitsLabel}
                          </span>
                          <span className={`text-[10px] font-mono font-bold tracking-wider ${meta.accent}`}>
                            {"●".repeat(Math.min(sponsor.benefits.length, 5)).split("").join(" ")}
                          </span>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-0">
                          {[col1, col2].map((col, ci) => (
                            <ul key={ci} className="divide-y divide-slate-100">
                              {col.map((benefit, bi) => (
                                <li
                                  key={bi}
                                  className="py-2 text-[13px] leading-snug text-slate-600"
                                >
                                  {benefit}
                                </li>
                              ))}
                            </ul>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
