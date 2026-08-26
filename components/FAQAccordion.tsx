import { Plus } from "lucide-react";

type FAQItem = {
  question: string;
  answer: string;
};

// The FAQ copy is bilingual and lives in `lib/content.ts`; the only caller
// passes it in. The former hardcoded Spanish fallback was unreachable and
// still described the retired "a quién va dirigido" audience section.
export default function FAQAccordion({ items }: { items: FAQItem[] }) {
  return (
    <div className="w-full">
      {items.map((item, i) => (
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
