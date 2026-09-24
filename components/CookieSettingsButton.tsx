"use client";

import { openCookieSettings } from "@/lib/consent";

/**
 * The permanent control to change the cookie choice. The notice itself closes
 * completely once the visitor decides; this reopens it.
 */
export default function CookieSettingsButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      {label}
    </button>
  );
}
