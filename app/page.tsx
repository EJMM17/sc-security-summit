import { WaveSeparator } from "./page-sections/_shared";
import HeaderSection from "./page-sections/HeaderSection";
import HeroSection from "./page-sections/HeroSection";
import StatsBar from "./page-sections/StatsBar";
import WhyAttendSection from "./page-sections/WhyAttendSection";
import VisionMisionSection from "./page-sections/VisionMisionSection";
import PilaresSection from "./page-sections/PilaresSection";
import SpeakersSection from "./page-sections/SpeakersSection";
import ValorSection from "./page-sections/ValorSection";
import AgendaSection from "./page-sections/AgendaSection";
import AudienciaSection from "./page-sections/AudienciaSection";
import NetworkingHubSection from "./page-sections/NetworkingHubSection";
import PricingSection from "./page-sections/PricingSection";
import PatrocinadoresSection from "./page-sections/PatrocinadoresSection";
import UbicacionSection from "./page-sections/UbicacionSection";
import FAQSection from "./page-sections/FAQSection";
import RegistroSection from "./page-sections/RegistroSection";
import FinalCTASection from "./page-sections/FinalCTASection";
import FooterSection from "./page-sections/FooterSection";

export default function Home() {
  return (
    <>
      {/* Accessibility: skip to registration form */}
      <a
        href="#registro"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg"
      >
        Ir al formulario de registro
      </a>

      <HeaderSection />

      <div className="pt-[68px]">
        <HeroSection />
        <StatsBar />
        <WhyAttendSection />
        <VisionMisionSection />
        <WaveSeparator color="#F8FAFC" />
        <PilaresSection />
        <WaveSeparator color="#FFFFFF" flip />
        <SpeakersSection />
        <ValorSection />
        <WaveSeparator color="#FFFFFF" />
        <AgendaSection />
        <WaveSeparator color="#F8FAFC" />
        <AudienciaSection />
        <NetworkingHubSection />
        <PricingSection />
        <WaveSeparator color="#F8FAFC" />
        <PatrocinadoresSection />
        <WaveSeparator color="#FFFFFF" flip />
        <UbicacionSection />
        <WaveSeparator color="#F8FAFC" />
        <FAQSection />
        <WaveSeparator color="#FFFFFF" flip />
        <RegistroSection />
        <FinalCTASection />
        <FooterSection />
      </div>
    </>
  );
}
