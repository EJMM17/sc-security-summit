import { ArrowRight, LayoutGrid, Ruler } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import PremiumCheck from "./_primitives/PremiumCheck";
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {sponsors.map((sponsor, index) => {
              const meta = sponsorTierMeta[index];
              const levelLabel = String(meta.level).padStart(2, "0");
              const benefitsCount = sponsor.benefits.length;
              const ctaClass = meta.featured
                ? "bg-slate-900 text-white hover:bg-slate-800 shadow-[0_8px_22px_-8px_rgba(15,23,42,0.45)]"
                : meta.highlighted
                  ? "bg-amber-500 text-white hover:bg-amber-400 shadow-[0_8px_22px_-8px_rgba(245,158,11,0.5)]"
                  : index === 2
                    ? "bg-slate-700 text-white hover:bg-slate-600 shadow-[0_8px_20px_-8px_rgba(15,23,42,0.38)]"
                    : "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_8px_22px_-8px_rgba(37,99,235,0.5)]";

              return (
                <ScrollReveal key={index} delay={index * 100}>
                  <div
                    className={`sponsor-card group relative h-full flex flex-col rounded-3xl bg-white border border-slate-200/80 overflow-hidden transition-all duration-500 ${meta.ring} ${
                      meta.featured ? "sponsor-card--featured" : ""
                    }`}
                  >
                    <div className={`h-1.5 w-full ${meta.stripe}`} aria-hidden="true" />
                    <div
                      className="absolute inset-x-0 top-0 h-32 pointer-events-none opacity-50"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)",
                      }}
                      aria-hidden="true"
                    />
                    <span
                      className="absolute -right-2 -bottom-3 font-oswald font-black text-[120px] leading-none text-slate-900/[0.03] select-none pointer-events-none group-hover:text-slate-900/[0.055] transition-colors duration-500"
                      aria-hidden="true"
                    >
                      {levelLabel}
                    </span>

                    <div className="relative p-6 pb-5 flex flex-col flex-1">
                      <div className="mb-5">
                        <h3 className="font-oswald text-xl font-bold text-slate-900 leading-tight tracking-tight">
                          {sponsor.tier}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-5">
                        <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                          <div className="flex items-center gap-1 text-slate-400">
                            <Ruler className="w-3 h-3" strokeWidth={2} />
                            <p className="text-[9px] font-bold uppercase tracking-wider">
                              {ui.sponsorStandLabel}
                            </p>
                          </div>
                          <p className={`text-sm font-bold mt-1 ${meta.accent}`}>{meta.stand}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                          <div className="flex items-center gap-1 text-slate-400">
                            <LayoutGrid className="w-3 h-3" strokeWidth={2} />
                            <p className="text-[9px] font-bold uppercase tracking-wider">
                              {ui.sponsorSlotsLabel}
                            </p>
                          </div>
                          <p className={`text-sm font-bold mt-1 ${meta.accent}`}>
                            <span className="font-mono">{meta.slotsTotal}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                          {benefitsCount} {ui.sponsorBenefitsLabel}
                        </span>
                        <span className={`text-[10px] font-mono font-bold tracking-wider ${meta.accent}`}>
                          {"●".repeat(Math.min(benefitsCount, 5)).split("").join(" ")}
                        </span>
                      </div>

                      <ul className="space-y-2 flex-1">
                        {sponsor.benefits.map((benefit, benefitIndex) => (
                          <li
                            key={benefitIndex}
                            className="flex items-start gap-2 text-[13px] leading-snug text-slate-600"
                          >
                            <span
                              className={`w-4 h-4 rounded-full ${meta.chipBg} flex items-center justify-center flex-shrink-0 mt-0.5`}
                            >
                              <PremiumCheck className={`w-2.5 h-2.5 ${meta.accent}`} />
                            </span>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>

                      <a
                        href={`mailto:Contacto@LanzLogistics.com?subject=${encodeURIComponent(
                          `Patrocinio ${sponsor.tier} – Summit 2026`,
                        )}`}
                        className={`sponsor-cta inline-flex items-center justify-center gap-2 mt-6 w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:-translate-y-0.5 ${ctaClass}`}
                      >
                        {ui.sponsorRequestInfo}
                        <ArrowRight
                          className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                          strokeWidth={2.5}
                        />
                      </a>
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
