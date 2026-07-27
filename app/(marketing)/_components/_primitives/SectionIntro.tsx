import type { ReactNode } from "react";

export default function SectionIntro({
  label,
  title,
  description,
  icon,
  align = "split",
  className = "",
}: {
  label: string;
  title: ReactNode;
  description: ReactNode;
  icon?: ReactNode;
  align?: "split" | "center";
  className?: string;
}) {
  return (
    <div className={`section-intro section-intro--${align} ${className}`}>
      <div className="section-intro-label">
        <span className="section-label">
          {icon}
          {label}
        </span>
      </div>
      <div className="section-intro-copy">
        <h2 className="section-title">{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}
