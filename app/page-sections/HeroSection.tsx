import Image from "next/image";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import ScrollReveal from "@/components/ScrollReveal";

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[92vh] flex items-center justify-center overflow-hidden">
      <Image
        src="/images/hero-bg.webp"
        alt="Summit de Seguridad en la Cadena de Suministros"
        fill
        className="object-cover"
        priority
        fetchPriority="high"
        sizes="100vw"
        quality={85}
      />
      <div className="hero-image-overlay" />

      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[8%] w-20 h-20 border border-white/10 rounded-2xl float-shape" />
        <div className="absolute top-[30%] right-[12%] w-16 h-16 border border-cyan-400/15 rounded-full float-shape-reverse" />
        <div className="absolute bottom-[25%] left-[15%] w-12 h-12 border border-blue-400/10 rounded-lg float-shape" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-[20%] right-[8%] w-24 h-24 border border-white/5 rounded-3xl float-shape-reverse" style={{ animationDelay: "1s" }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px"
        }} />
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2.5 mb-8">
            <Calendar className="w-4 h-4 text-cyan-300" />
            <span className="text-sm text-white/90 font-medium">
              24 y 25 de septiembre, 2026 · Reynosa, Tamaulipas
            </span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h1 className="font-oswald text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-[1.1] mb-6">
            SUMMIT DE SEGURIDAD EN LA{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
              CADENA DE SUMINISTROS
            </span>
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="text-lg md:text-xl text-blue-100/80 max-w-2xl mx-auto mb-8 leading-relaxed">
            El encuentro donde convergen la actualización estratégica, la vinculación empresarial y
            las soluciones tecnológicas para fortalecer la industria del norte de México.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <div className="card-dark p-6 sm:p-8 mb-8 inline-flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold tracking-widest uppercase">
              <Clock className="w-3.5 h-3.5" />
              <span>Faltan</span>
            </div>
            <CountdownTimer />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#registro" className="btn-primary px-8 py-4 text-base">
              REGISTRARME AHORA <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#patrocinadores" className="btn-outline px-8 py-4 text-base border-white/30 text-white hover:bg-white/10">
              PATROCINAR EL EVENTO
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
