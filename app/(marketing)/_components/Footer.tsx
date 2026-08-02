import Image from "next/image";
import { ExternalLink, Mail, Phone } from "lucide-react";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";

export default function Footer({
  language,
  hrefBase = "",
}: {
  language: Language;
  /** Prefix for in-page (#hash) links so they resolve from sub-pages, e.g. "/". */
  hrefBase?: string;
}) {
  const { ui, footerLinks } = CONTENT[language];
  const sectionHref = (href: string) =>
    href.startsWith("#") ? `${hrefBase}${href}` : href;

  return (
    <footer className="summit-footer">
      <div className="mock-container">
        <div className="summit-footer-grid">
          <div className="summit-footer-brand">
            <div className="flex items-center gap-3 mb-5">
              {/* logo-symbol-white.png is a blank all-white asset (no alpha), so it
                  renders as a solid block on the dark footer. Use the transparent
                  symbol and invert it to white, as the hero presenter logos do. */}
              <Image
                src="/images/logo-symbol-blue.png"
                alt="SC Security Summit"
                width={52}
                height={52}
                className="summit-footer-logo w-12 h-12 object-contain"
              />
              <div>
                <span className="font-oswald text-xl font-bold text-white">SC SUMMIT</span>
                <span className="block text-[10px] font-bold tracking-[0.2em] text-blue-300">
                  REYNOSA 2026
                </span>
              </div>
            </div>
            <p>{ui.footerDesc}</p>
          </div>

          <div className="summit-footer-nav">
            <h3>{ui.footerEvent}</h3>
            <nav aria-label={ui.footerEvent} className="summit-footer-links">
              {footerLinks.map((link) => (
                <a key={link.href} href={sectionHref(link.href)}>
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div>
            <h3>{ui.footerContact}</h3>
            <div className="summit-footer-links">
              <a href="mailto:hola@scsecuritysummit.com">
                <Mail aria-hidden="true" /> hola@scsecuritysummit.com
              </a>
              <a href="tel:+528991128755">
                <Phone aria-hidden="true" /> +52 899 112 8755
              </a>
              <a
                href="https://scsecuritysummit.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink aria-hidden="true" /> scsecuritysummit.com
              </a>
            </div>
          </div>
        </div>

        <div className="summit-footer-bottom">
          <p>{ui.footerCopyright}</p>
          <div>
            <a href="/aviso-de-privacidad">{ui.footerPrivacy}</a>
            <a href="/terminos-y-condiciones">{ui.footerTerms}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
