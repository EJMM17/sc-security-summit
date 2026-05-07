import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";

export default function FinalCTA({ language }: { language: Language }) {
  const { ui } = CONTENT[language];

  return (
    <section className="relative bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 py-20 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      <div className="absolute top-10 left-10 w-32 h-32 border border-white/5 rounded-full float-shape" />
      <div className="absolute bottom-10 right-10 w-24 h-24 border border-cyan-400/10 rounded-2xl float-shape-reverse" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10">
        <ScrollReveal>
          <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
            {ui.finalCTATitlePart1}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
              {ui.finalCTATitlePart2}
            </span>
          </h2>
          <p className="text-blue-100/60 mt-4 max-w-xl mx-auto">{ui.finalCTADesc}</p>
        </ScrollReveal>
        <ScrollReveal delay={200}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <a href="#registro" className="btn-primary px-8 py-4 text-base">
              {ui.registerNowBtn} <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="mailto:hola@scsecuritysummit.com.mx"
              className="btn-outline px-8 py-4 text-base border-white/30 text-white hover:bg-white/10"
            >
              {ui.contactOrg}
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
