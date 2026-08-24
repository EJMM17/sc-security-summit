import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import PremiumCheck from "./_primitives/PremiumCheck";
import PrimaryCTA from "./_primitives/PrimaryCTA";
import SectionIntro from "./_primitives/SectionIntro";

export default function Pricing({ language }: { language: Language }) {
  const { ui, pricing } = CONTENT[language];
  // Both counts are data-driven, so a hardcoded plural renders "Ver 1
  // beneficios más" whenever a tier has exactly one hidden benefit.
  const benefitsLabel = (n: number) =>
    language === "es"
      ? `${n} ${n === 1 ? "beneficio incluido" : "beneficios incluidos"}`
      : `${n} ${n === 1 ? "benefit included" : "benefits included"}`;
  const moreLabel = (n: number) =>
    language === "es"
      ? `Ver ${n} ${n === 1 ? "beneficio más" : "beneficios más"}`
      : `View ${n} ${n === 1 ? "more benefit" : "more benefits"}`;
  const completeLabel = language === "es" ? "Experiencia más completa" : "Most complete experience";

  return (
    <section id="accesos" className="mock-section mock-section--tall">
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
            // The highlighted tier is data-driven: `featured` in lib/content.ts
            // is the single source of truth, so retiring a tier never leaves a
            // hardcoded id pointing at a plan that no longer exists.
            const isFeatured = plan.featured;
            const visibleFeatures = plan.features.slice(0, 3);
            const moreFeatures = plan.features.slice(3);

            return (
              <ScrollReveal key={plan.id} delay={index * 90}>
                <article className={`pricing-tier ${isFeatured ? "pricing-tier--featured" : ""}`}>
                  <div className="pricing-tier-plan">
                    {isFeatured ? (
                      <div className="pricing-tier-heading">
                        <strong>{completeLabel}</strong>
                      </div>
                    ) : null}
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
                      {benefitsLabel(plan.features.length)}
                    </p>
                    <ul>
                      {visibleFeatures.map((feature, index) => (
                        <li key={feature}>
                          <PremiumCheck index={index} className="pricing-tier-check" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {moreFeatures.length ? (
                      <details>
                        <summary>{moreLabel(moreFeatures.length)}</summary>
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
                    {/* Individual accesses are now sold on site through
                        MercadoPago; the tier travels in the query string so
                        the checkout opens on the plan the visitor clicked. */}
                    <PrimaryCTA
                      href={
                        language === "en"
                          ? `/checkout?lang=en&tier=${plan.id}`
                          : `/checkout?tier=${plan.id}`
                      }
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
