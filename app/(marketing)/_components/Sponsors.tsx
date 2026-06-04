import { ArrowRight, Crown, LayoutGrid, Ruler, CheckCircle2 } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import WaveSeparator from "./_primitives/WaveSeparator";

export default function Sponsors({ language }: { language: Language }) {
  const { ui, sponsorTierMeta, sponsors } = CONTENT[language];
  const sponsor = sponsors[0];
  const meta = sponsorTierMeta[0];

  const half = Math.ceil(sponsor.benefits.length / 2);
  const col1 = sponsor.benefits.slice(0, half);
  const col2 = sponsor.benefits.slice(half);

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

              <span
                className="absolute -right-3 bottom-0 font-oswald font-black text-[160px] leading-none text-slate-900/[0.03] select-none pointer-events-none group-hover:text-slate-900/[0.055] transition-colors duration-500"
                aria-hidden="true"
              >
                01
              </span>

              <div className="relative flex flex-col lg:flex-row gap-0">
                {/* ── LEFT PANEL ── */}
                <div className="lg:w-64 xl:w-72 flex-shrink-0 flex flex-col justify-between gap-6 p-6 lg:p-8 lg:border-r border-b lg:border-b-0 border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                        <Crown className="w-4 h-4 text-slate-100" strokeWidth={2.5} />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-900">
                        {sponsor.tier}
                      </p>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {language === "es"
                        ? "La experiencia más completa para posicionar tu marca como referente en la industria."
                        : "The most complete experience to position your brand as an industry leader."}
                    </p>
                  </div>

                  <div className="flex flex-row lg:flex-col gap-2">
                    <div className="flex-1 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                      <div className="flex items-center gap-1 text-slate-400 mb-1">
                        <Ruler className="w-3 h-3" strokeWidth={2} />
                        <p className="text-[9px] font-bold uppercase tracking-wider">{ui.sponsorStandLabel}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{meta.stand}</p>
                    </div>
                    <div className="flex-1 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                      <div className="flex items-center gap-1 text-slate-400 mb-1">
                        <LayoutGrid className="w-3 h-3" strokeWidth={2} />
                        <p className="text-[9px] font-bold uppercase tracking-wider">{ui.sponsorSlotsLabel}</p>
                      </div>
                      <p className="text-sm font-bold font-mono text-slate-900">{meta.slotsTotal}</p>
                    </div>
                  </div>

                  <a
                    href={`mailto:hola@scsecuritysummit.com?subject=${encodeURIComponent(
                      language === "es"
                        ? "Patrocinio Platino – Summit 2026"
                        : "Platinum Sponsorship – Summit 2026",
                    )}`}
                    className="sponsor-cta inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:-translate-y-0.5 bg-slate-900 text-white hover:bg-slate-800 shadow-[0_8px_22px_-8px_rgba(15,23,42,0.45)]"
                  >
                    {ui.sponsorRequestInfo}
                    <ArrowRight
                      className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                      strokeWidth={2.5}
                    />
                  </a>
                </div>

                {/* ── RIGHT PANEL: benefits ── */}
                <div className="flex-1 p-6 lg:p-8">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      {sponsor.benefits.length} {ui.sponsorBenefitsLabel}
                    </span>
                    <span className="text-[10px] font-mono font-bold tracking-wider text-slate-900">
                      {"●".repeat(5).split("").join(" ")}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-0">
                    {[col1, col2].map((col, ci) => (
                      <ul key={ci} className="divide-y divide-slate-100">
                        {col.map((benefit, bi) => (
                          <li
                            key={bi}
                            className="py-2.5 flex items-start gap-2 text-[13px] leading-snug text-slate-600"
                          >
                            <CheckCircle2 className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
