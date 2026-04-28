import { Plus } from "lucide-react";

type FAQItem = {
  question: string;
  answer: string;
};

const FALLBACK_FAQ: FAQItem[] = [
  {
    question: "¿Dónde y cuándo se llevará a cabo el Summit?",
    answer: "El 1er Summit de Seguridad en la Cadena de Suministros se realizará los días 24 y 25 de septiembre de 2026 en el Centro de Convenciones de Reynosa, Tamaulipas, México — a solo 10 minutos de la frontera con Texas.",
  },
  {
    question: "¿A quién está dirigido este evento?",
    answer: "Directivos, gerentes y especialistas de operaciones, logística, aduanas, seguridad patrimonial, compliance y abastecimiento.",
  },
];

export default function FAQAccordion({ items }: { items?: FAQItem[] }) {
  const data = items ?? FALLBACK_FAQ;

  return (
    <div className="w-full">
      {data.map((item, i) => (
        <details
          key={i}
          className="faq-item"
        >
          <summary className="faq-trigger cursor-pointer list-none">
            <span>{item.question}</span>
            <Plus className="faq-icon w-5 h-5 ml-4" />
          </summary>
          <div className="faq-content">
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed pr-12">
              {item.answer}
            </p>
          </div>
        </details>
      ))}
    </div>
  );
}
