"use client";

export default function PremiumCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 10" fill="none" className={className} aria-hidden="true">
      <path
        d="M1.5 5L5 8.5L12.5 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
