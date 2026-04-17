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
      className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
      style={{ backgroundColor: "#25D366" }}
    >
      <MessageCircle className="w-6 h-6 text-white" />
    </a>
  );
}
