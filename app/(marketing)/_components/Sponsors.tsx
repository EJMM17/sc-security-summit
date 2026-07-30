import { ArrowRight, Sparkles, LayoutGrid, Ruler, CheckCircle2, Star } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import SponsorInquiryForm from "@/components/SponsorInquiryForm";
import { CONTENT } from "@/lib/content";
import { isVisualOnlyVercelDeployment } from "@/lib/deployment-environment";
import type { Language } from "@/lib/language";
import SectionIntro from "./_primitives/SectionIntro";

export default function Sponsors({ language }: { language: Language }) {
  const { ui, sponsorTierMeta, sponsors } = CONTENT[language];
  const sponsor = sponsors[0];
  const meta = sponsorTierMeta[0];
  const inquiriesDisabled = isVisualOnlyVercelDeployment();

  const benefitGroups = groupBenefits(sponsor.benefits, language);

  return (
      <section id="patrocinadores" className="sponsors-section py-20 sm:py-28 relative overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <SectionIntro
              label={ui.sponsorsLabel}
              title={ui.sponsorsTitle}
              description={ui.sponsorsDesc}
              className="mb-14 sm:mb-16"
            />
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="sponsor-card sponsor-card--featured group relative rounded-[22px] bg-white border border-slate-200 overflow-hidden">
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
                <div className="flex flex-col sm:flex-row items-center gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-sm text-slate-500 flex-1 text-center sm:text-left">
                    {language === "es"
                      ? "¿Listo para posicionar tu marca? Solicita más información y un asesor te contactará."
                      : "Ready to position your brand? Request more information and an advisor will contact you."}
                  </p>
                  <a
                    href="#contacto-patrocinio"
                    className="sponsor-cta inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors duration-200 bg-slate-900 text-white hover:bg-slate-800 whitespace-nowrap"
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

          <ScrollReveal delay={160}>
            <div id="contacto-patrocinio" className="sponsor-contact-panel">
              <div>
                <span className="section-label">{ui.sponsorFormLabel}</span>
                <h3>{ui.sponsorFormTitle}</h3>
                <p>{ui.sponsorFormDesc}</p>
              </div>
              <SponsorInquiryForm
                language={language}
                previewDisabled={inquiriesDisabled}
              />
            </div>
          </ScrollReveal>
        </div>
      </section>
  );
}

type BenefitGroup = { label: string; items: string[] };

function groupBenefits(benefits: readonly string[], language: Language): BenefitGroup[] {
  const labels =
    language === "es"
      ? { visibility: "Visibilidad", experience: "Experiencia", training: "Capacitación" }
      : { visibility: "Visibility", experience: "Experience", training: "Training" };

  const visibilityCount = 6;
  const experienceCount = 5;

  return [
    { label: labels.visibility, items: [...benefits.slice(0, visibilityCount)] },
    {
      label: labels.experience,
      items: [...benefits.slice(visibilityCount, visibilityCount + experienceCount)],
    },
    { label: labels.training, items: [...benefits.slice(visibilityCount + experienceCount)] },
  ];
}
