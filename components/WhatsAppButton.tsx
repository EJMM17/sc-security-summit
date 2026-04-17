"use client";

import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "19565158070";
const MESSAGE = encodeURIComponent(
  "Hola, me interesa obtener información sobre el Summit de Seguridad en la Cadena de Suministros 2026."
);

export default function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${MESSAGE}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed safe-offset-bottom-left z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 touch-manipulation"
      style={{ backgroundColor: "#25D366" }}
    >
      <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
    </a>
  );
}
