import Link from "next/link";

/**
 * One header for the three panel sections, so an operator always knows where
 * they are and can move between requests, orders and sold accesses without
 * going back to a bookmark.
 */
const SECTIONS = [
  { href: "/admin", label: "Solicitudes" },
  { href: "/admin/ordenes", label: "Órdenes" },
  { href: "/admin/boletos", label: "Boletos vendidos" },
] as const;

export type AdminSection = (typeof SECTIONS)[number]["href"];

export default function AdminNav({ current }: { current: AdminSection }) {
  return (
    <nav
      aria-label="Secciones del panel"
      className="flex flex-wrap items-center gap-1.5"
    >
      {SECTIONS.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          aria-current={section.href === current ? "page" : undefined}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            section.href === current
              ? "bg-slate-900 text-white"
              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {section.label}
        </Link>
      ))}
    </nav>
  );
}
