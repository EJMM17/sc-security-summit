import ScrollProgress from "@/components/ScrollProgress";
import ScrollRevealObserver from "@/components/ScrollRevealObserver";
import { getRequestLanguage } from "@/lib/language";
import { deserializeRegistroFlashState } from "@/lib/registro-form-state";
import Audience from "./(marketing)/_components/Audience";
import Faq from "./(marketing)/_components/Faq";
import FinalCTA from "./(marketing)/_components/FinalCTA";
import Footer from "./(marketing)/_components/Footer";
import Gallery from "./(marketing)/_components/Gallery";
import Header from "./(marketing)/_components/Header";
import Hero from "./(marketing)/_components/Hero";
import Location from "./(marketing)/_components/Location";
import NetworkingHub from "./(marketing)/_components/NetworkingHub";
import Pillars from "./(marketing)/_components/Pillars";
import Pricing from "./(marketing)/_components/Pricing";
import Registro from "./(marketing)/_components/Registro";
import Speakers from "./(marketing)/_components/Speakers";
import Sponsors from "./(marketing)/_components/Sponsors";
import Value from "./(marketing)/_components/Value";
import WhyAttend from "./(marketing)/_components/WhyAttend";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{
    lang?: string;
    registro?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const language = await getRequestLanguage(params?.lang ?? null);
  const registroState = deserializeRegistroFlashState(params?.registro);
  const utms = {
    source: params?.utm_source,
    medium: params?.utm_medium,
    campaign: params?.utm_campaign,
  };

  return (
    <>
      <ScrollProgress />
      <ScrollRevealObserver />
      <Header language={language} />
      <div className="pt-[62px] sm:pt-[68px]">
        <Hero language={language} />
        <WhyAttend language={language} />
        <Pillars language={language} />
        <NetworkingHub language={language} />
        <Speakers language={language} />
        <Gallery language={language} />
        <Value language={language} />
        <Audience language={language} />
        <Pricing language={language} />
        <Sponsors language={language} />
        <FinalCTA language={language} />
        <Registro language={language} state={registroState} utms={utms} />
        <Location language={language} />
        <Faq language={language} />
        <Footer language={language} />
      </div>
    </>
  );
}
