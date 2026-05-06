"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export default function CopyButton({
  value,
  label = "Copiar",
  copiedLabel = "Copiado",
  className = "",
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API blocked — fall back to range selection.
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${className}`}
      aria-live="polite"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
          {copiedLabel}
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" aria-hidden="true" />
          {label}
        </>
      )}
    </button>
  );
}
