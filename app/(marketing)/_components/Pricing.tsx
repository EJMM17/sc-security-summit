import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT, EVENTBRITE_URL } from "@/lib/content";
import type { Language } from "@/lib/language";
import PremiumCheck from "./_primitives/PremiumCheck";
import PrimaryCTA from "./_primitives/PrimaryCTA";
import SectionIntro from "./_primitives/SectionIntro";

export default function Pricing({ language }: { language: Language }) {
  const { ui, pricing } = CONTENT[language];
  const benefitsLabel = language === "es" ? "beneficios incluidos" : "benefits included";
  const moreLabel = language === "es" ? "beneficios más" : "more benefits";
  const completeLabel = language === "es" ? "Experiencia más completa" : "Most complete experience";

  return (
    <section id="accesos" className="rhythm-pause-lg bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <SectionIntro
            label={ui.pricingLabel}
            title={ui.pricingTitle}
            description={ui.pricingDesc}
            align="center"
            className="mb-6"
          />
        </ScrollReveal>

        <div className="pricing-tier-list">
          {pricing.map((plan, index) => {
            const isVip = plan.id === "vip";
            const visibleFeatures = plan.features.slice(0, 3);
            const moreFeatures = plan.features.slice(3);

            return (
              <ScrollReveal key={plan.id} delay={index * 90}>
                <article className={`pricing-tier ${isVip ? "pricing-tier--featured" : ""}`}>
                  <div className="pricing-tier-plan">
                    <div className="pricing-tier-heading">
                      {isVip ? <strong>{completeLabel}</strong> : null}
                    </div>
                    <h3>{plan.label}</h3>
                    <p>{plan.desc}</p>
                    {"recommended" in plan && plan.recommended ? (
                      <small>
                        {language === "es" ? "Ideal para " : "Ideal for "}
                        {plan.recommended}
                      </small>
                    ) : null}
                  </div>

                  <div className="pricing-tier-price">
                    <div>
                      <strong>{plan.price}</strong>
                      <span>MXN</span>
                    </div>
                    <p>{ui.taxNote}</p>
                  </div>

                  <div className="pricing-tier-benefits">
                    <p className="pricing-tier-benefit-count">
                      {plan.features.length} {benefitsLabel}
                    </p>
                    <ul>
                      {visibleFeatures.map((feature) => (
                        <li key={feature}>
                          <PremiumCheck className="pricing-tier-check" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {moreFeatures.length ? (
                      <details>
                        <summary>
                          {language === "es" ? "Ver " : "View "}
                          {moreFeatures.length} {moreLabel}
                        </summary>
                        <ul>
                          {moreFeatures.map((feature) => (
                            <li key={feature}>
                              <PremiumCheck className="pricing-tier-check" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </div>

                  <div className="pricing-tier-action">
                    <PrimaryCTA
                      href={EVENTBRITE_URL}
                      external
                      size="md"
                      className="pricing-tier-cta"
                    >
                      {ui.getAccessBtn}
                    </PrimaryCTA>
                  </div>
                </article>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
