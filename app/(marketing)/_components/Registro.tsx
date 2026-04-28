import RegistroForm from "@/components/RegistroForm";
import ScrollReveal from "@/components/ScrollReveal";
import type { RegistroFlashState } from "@/lib/registro-form-state";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";
import WaveSeparator from "./_primitives/WaveSeparator";

export default function Registro({
  language,
  state,
  utms,
}: {
  language: Language;
  state?: RegistroFlashState | null;
  utms?: { source?: string; medium?: string; campaign?: string };
}) {
  const { ui } = CONTENT[language];

  return (
    <>
      <WaveSeparator color="#FFFFFF" flip />
      <section id="registro" className="py-20 sm:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center mb-10">
              <span className="section-label">{ui.regLabel}</span>
              <h2 className="section-title mt-3">{ui.regTitle}</h2>
              <p className="text-slate-500 max-w-xl mx-auto mt-4">{ui.regDesc}</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="card-elevated p-6 sm:p-10">
              <RegistroForm language={language} state={state} utms={utms} />
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
