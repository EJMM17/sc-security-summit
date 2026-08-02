import type { CSSProperties } from "react";

/* The confirmation tick used across the benefit lists. It rides the
   summit icon system, so it strikes itself on when its section
   reveals instead of arriving pre-drawn.

   `index` staggers a column of ticks: passing the list position turns
   a block of checkmarks into a cascade rather than one flash. */
export default function PremiumCheck({
  className,
  index = 0,
}: {
  className?: string;
  index?: number;
}) {
  return (
    <svg
      viewBox="0 0 14 10"
      fill="none"
      className={`summit-icon ${className ?? ""}`.trim()}
      style={
        index ? ({ "--si-lead": `${90 + index * 60}ms` } as CSSProperties) : undefined
      }
      aria-hidden="true"
      role="presentation"
    >
      <path
        data-si="draw"
        pathLength="1"
        d="M1.5 5L5 8.5L12.5 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
