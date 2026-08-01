import Image from "next/image";
import HeaderScroll from "@/components/HeaderScroll";
import MobileNav from "@/components/MobileNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { CONTENT, EVENTBRITE_URL } from "@/lib/content";
import type { Language } from "@/lib/language";
import PrimaryCTA from "./_primitives/PrimaryCTA";

export default function Header({ language }: { language: Language }) {
  const content = CONTENT[language];

  return (
    <>
      <a
        href="#registro"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg"
      >
        {content.ui.skipToForm}
      </a>

      <HeaderScroll>
        <header className="summit-header fixed top-0 w-full z-50 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 h-[62px] sm:h-[68px] flex items-center justify-between gap-2 sm:gap-4">
            <a href="#top" className="flex min-w-0 items-center gap-2 sm:gap-3 group">
              <Image
                src="/images/logo-symbol-blue.png"
                alt="Security Chain Summit"
                width={40}
                height={40}
                className="header-logo w-9 h-9 sm:w-10 sm:h-10 object-contain flex-shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                priority
              />
              <div className="min-w-0">
                <span className="header-brand-title font-oswald block truncate text-base sm:text-lg font-bold tracking-tight text-slate-900">
                  SC SUMMIT
                </span>
                <span className="header-brand-subtitle hidden sm:block text-[10px] font-bold tracking-[0.18em] text-blue-600">
                  REYNOSA 2026
                </span>
              </div>
            </a>

            <nav className="hidden lg:flex items-center gap-4">
              {content.nav.map((link) => (
                <a key={link.href} href={link.href} className="nav-link">
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <LanguageSwitcher current={language} />
              <PrimaryCTA
                href={EVENTBRITE_URL}
                external
                size="sm"
                className="header-cta hidden lg:inline-flex"
              >
                {content.ui.registerBtn}
              </PrimaryCTA>
              <MobileNav language={language} />
            </div>
          </div>
        </header>
      </HeaderScroll>
    </>
  );
}
