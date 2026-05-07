import Image from "next/image";
import { ExternalLink, Mail, Phone } from "lucide-react";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";

export default function Footer({ language }: { language: Language }) {
  const { ui, footerLinks } = CONTENT[language];

  return (
    <footer className="bg-slate-900 pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/images/logo-symbol-blue.png"
                alt="SC Security Summit"
                width={44}
                height={44}
                className="w-10 h-10 sm:w-11 sm:h-11 object-contain logo-on-dark"
              />
              <div>
                <span className="font-oswald text-lg font-bold text-white">SC SUMMIT</span>
                <span className="block text-[10px] font-bold tracking-[0.2em] text-blue-400">
                  REYNOSA 2026
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">{ui.footerDesc}</p>
            <p className="text-xs text-slate-500 mt-4">
              {ui.footerPresentedBy}{" "}
              <span className="text-blue-400 font-semibold">Lanz Logistics</span> +{" "}
              <span className="text-blue-400 font-semibold">Thynk Unlimited</span>
            </p>
          </div>

          <div>
            <h4 className="font-oswald text-sm font-bold text-white uppercase tracking-wider mb-4">
              {ui.footerEvent}
            </h4>
            <nav className="flex flex-col gap-2.5">
              {footerLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="font-oswald text-sm font-bold text-white uppercase tracking-wider mb-4">
              {ui.footerContact}
            </h4>
            <div className="space-y-3">
              <a
                href="mailto:hola@scsecuritysummit.com.mx"
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors"
              >
                <Mail className="w-4 h-4" /> hola@scsecuritysummit.com.mx
              </a>
              <a
                href="tel:+19565158070"
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors"
              >
                <Phone className="w-4 h-4" /> +1 (956) 515-8070
              </a>
              <a
                href="https://scsecuritysummit.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> scsecuritysummit.com
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">{ui.footerCopyright}</p>
          <div className="flex items-center gap-6">
            <a
              href="/aviso-de-privacidad"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              {ui.footerPrivacy}
            </a>
            <a
              href="/terminos-y-condiciones"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              {ui.footerTerms}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
