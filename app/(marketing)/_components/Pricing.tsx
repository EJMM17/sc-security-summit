import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT, PRICING_STRIPE } from "@/lib/content";
import type { Language } from "@/lib/language";
import PremiumCheck from "./_primitives/PremiumCheck";

export default function Pricing({ language }: { language: Language }) {
  const { ui, pricing } = CONTENT[language];

  return (
    <section id="accesos" className="rhythm-pause-lg bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-6">
            <span className="section-label">{ui.pricingLabel}</span>
            <h2 className="section-title mt-3">{ui.pricingTitle}</h2>
            <p className="text-slate-500 max-w-xl mx-auto mt-4">{ui.pricingDesc}</p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-7 mt-12 md:items-stretch">
          {pricing.map((plan, index) => {
            const isVip = plan.id === "vip";
            const stripe = PRICING_STRIPE[plan.id];

            return (
              <ScrollReveal key={plan.id} delay={index * 100}>
                <div
                  className={`pricing-card-v2 relative group rounded-3xl h-full flex flex-col overflow-hidden transition-all duration-500 ${
                    isVip
                      ? "pricing-card-v2--featured text-white md:-translate-y-2"
                      : "bg-white border border-slate-200/80 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.08)] hover:shadow-[0_20px_44px_-16px_rgba(15,23,42,0.16)] hover:-translate-y-1 hover:border-slate-300"
                  }`}
                >
                  <div className={`absolute inset-x-0 top-0 h-1 ${stripe}`} aria-hidden="true" />

                  {isVip && (
                    <div
                      className="absolute inset-0 opacity-[0.04] pointer-events-none"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                      }}
                      aria-hidden="true"
                    />
                  )}

                  <div className="relative p-7 sm:p-8 pt-9 sm:pt-9 flex flex-col flex-1">
                    <div className="mb-6">
                      <h3
                        className={`font-oswald text-xl font-bold leading-tight tracking-tight ${
                          isVip ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {plan.label}
                      </h3>
                      <p
                        className={`text-xs mt-1.5 leading-relaxed ${
                          isVip ? "text-slate-300/90" : "text-slate-500"
                        }`}
                      >
                        {plan.desc}
                      </p>
                    </div>

                    <div
                      className={`pb-6 mb-6 border-b ${
                        isVip ? "border-white/10" : "border-slate-100"
                      }`}
                    >
                      <div className="flex items-baseline gap-2">
                        <span
                          className={`font-oswald text-5xl font-bold tracking-tight leading-none ${
                            isVip ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {plan.price}
                        </span>
                        <span
                          className={`text-xs font-bold uppercase tracking-[0.18em] ${
                            isVip ? "text-cyan-300" : "text-slate-400"
                          }`}
                        >
                          MXN
                        </span>
                      </div>
                      <p className="text-[11px] mt-2 text-slate-400">{ui.taxNote}</p>
                    </div>

                    <ul className="space-y-2.5 mb-8 flex-1">
                      {plan.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className={`flex items-start gap-2.5 text-[13.5px] leading-snug ${
                            isVip ? "text-slate-100" : "text-slate-600"
                          }`}
                        >
                          <span
                            className={`w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isVip
                                ? "bg-blue-400/20 ring-1 ring-cyan-300/25"
                                : "bg-slate-100 ring-1 ring-slate-200"
                            }`}
                          >
                            <PremiumCheck
                              className={`w-2.5 h-2.5 ${
                                isVip ? "text-cyan-300" : "text-slate-500"
                              }`}
                            />
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <a
                      href="#registro"
                      className={`w-full py-3.5 rounded-xl font-bold text-sm text-center inline-flex items-center justify-center gap-2 uppercase tracking-[0.12em] transition-all duration-300 ${
                        isVip
                          ? "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_8px_24px_-8px_rgba(37,99,235,0.6)] hover:shadow-[0_12px_28px_-8px_rgba(37,99,235,0.75)] hover:-translate-y-0.5"
                          : "btn-primary"
                      }`}
                    >
                      <span>{ui.getAccessBtn}</span>
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

        <ScrollReveal delay={200}>
          <div className="mt-10 p-6 sm:p-8 rounded-2xl bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl border-2 border-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <PremiumCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-oswald text-lg font-bold text-slate-900 mb-1">
                  {ui.paymentTitle}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {ui.paymentIntro.parts.map((part, index) =>
                    "strong" in part ? <strong key={index}>{part.text}</strong> : part.text,
                  )}
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {ui.paymentSteps.map((step) => (
                    <div
                      key={step.step}
                      className="flex items-start gap-3 bg-white rounded-xl p-4 border border-blue-100"
                    >
                      <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {step.step}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{step.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-4">
                  {ui.paymentQuestionsPrefix}{" "}
                  <a
                    href="mailto:hola@scsecuritysummit.com.mx"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    hola@scsecuritysummit.com.mx
                  </a>{" "}
                  {ui.paymentOr}{" "}
                  <a
                    href="tel:+19565158070"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    +1 (956) 515-8070
                  </a>
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
