"use client";

import { useRouter } from "next/navigation";
import { setLanguageCookie } from "@/app/actions/language";
import type { Language } from "@/lib/language";

export default function LanguageSwitcher({ current }: { current: Language }) {
  const router = useRouter();

  async function handleToggle() {
    const next = current === "es" ? "en" : "es";
    await setLanguageCookie(next);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleToggle();
      }}
      className="inline-flex items-center justify-center px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
      aria-label={current === "es" ? "Cambiar a inglés" : "Switch to Spanish"}
    >
      {current === "es" ? "EN" : "ES"}
    </button>
  );
}
