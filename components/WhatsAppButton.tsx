"use client";

import { MessageCircle } from "lucide-react";
import { CONTENT } from "@/lib/content";
import type { Language } from "@/lib/language";

const WHATSAPP_NUMBER = "528991128755";

export default function WhatsAppButton({ language }: { language: Language }) {
  const { ui } = CONTENT[language];
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    ui.whatsappMessage,
  )}`;

  return (
    // A body-level `complementary` landmark: the floating control sits outside
    // header/main/footer, so without one the link is orphaned from every
    // landmark and unreachable by landmark navigation.
    <aside aria-label="WhatsApp">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ui.whatsappLabel}
        className="whatsapp-fab fixed safe-offset-bottom-left z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg touch-manipulation"
      >
        <span className="whatsapp-fab-halo" aria-hidden="true" />
        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white relative" />
      </a>
    </aside>
  );
}
