import { ChevronRight } from "lucide-react";
import { BASE_URL } from "@/lib/content";

type Crumb = {
  label: string;
  href?: string;
};

type Props = {
  items: Crumb[];
  /** Optional nonce for the JSON-LD script tag */
  nonce?: string;
};

/**
 * Visual breadcrumb trail + BreadcrumbList JSON-LD schema.
 * The last item is treated as the current page (no link).
 */
export default function Breadcrumbs({ items, nonce }: Props) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      ...(crumb.href ? { item: crumb.href.startsWith("/") ? `${BASE_URL}${crumb.href}` : crumb.href } : {}),
    })),
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-2">
        <ol className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
          {items.map((crumb, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={index} className="flex items-center gap-1.5">
                {index > 0 && (
                  <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" aria-hidden="true" />
                )}
                {isLast ? (
                  <span className="text-slate-600 font-medium" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  <a
                    href={crumb.href ?? "/"}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {crumb.label}
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </>
  );
}
