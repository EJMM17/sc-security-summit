import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

export default function PrimaryCTA({
  href,
  children,
  className = "",
  size = "md",
  external = false,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  external?: boolean;
}) {
  return (
    <a
      href={href}
      className={`primary-cta primary-cta--${size} ${className}`}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
    >
      <span>{children}</span>
      <ArrowRight className="primary-cta-icon" aria-hidden="true" />
    </a>
  );
}
