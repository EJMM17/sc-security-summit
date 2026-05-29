import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Footer from "@/app/(marketing)/_components/Footer";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";

/**
 * Minimal chrome for discrete acquisition / SEO pages. Reuses the brand
 * logo, type scale and Footer from the marketing site, but keeps its own
 * simple top bar whose links resolve back to the home page (/#registro)
 * instead of the home-only hash anchors — so it never feels like a
 * redesign and never breaks navigation off the landing page.
 */
export default function PageShell({
  language,
  children,
}: {
  language: Language;
  children: React.ReactNode;
}) {
  const { ui } = CONTENT[language];
  const home = language === "en" ? "/?lang=en" : "/";

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[62px] sm:h-[68px] flex items-center justify-between gap-3">
          <Link href={home} className="flex min-w-0 items-center gap-2 sm:gap-3 group">
            <Image
              src="/images/logo-symbol-blue.png"
              alt="SC Security Summit"
              width={40}
              height={40}
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain flex-shrink-0"
              priority
            />
            <div className="min-w-0">
              <span className="font-oswald block truncate text-base sm:text-lg font-bold tracking-tight text-slate-900">
                SC SUMMIT
              </span>
              <span className="hidden sm:block text-[10px] font-bold tracking-[0.18em] text-blue-600">
                REYNOSA 2026
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageSwitcher current={language} />
            <Link href={`${home}#registro`} className="btn-primary hidden sm:inline-flex text-sm">
              {ui.registerBtn} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <Footer language={language} hrefBase={home} />
    </>
  );
}
