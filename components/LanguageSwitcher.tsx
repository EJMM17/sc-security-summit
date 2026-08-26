"use client";

import { useRouter } from "next/navigation";
import { setLanguageCookie } from "@/app/actions/language";
import { languageSwitchTarget } from "@/lib/language-url";
import type { Language } from "@/lib/language";

export default function LanguageSwitcher({ current }: { current: Language }) {
  const router = useRouter();

  async function handleToggle() {
    const next = current === "es" ? "en" : "es";
    await setLanguageCookie(next);
    // On a URL carrying ?lang=, the param outranks the cookie we just wrote,
    // so refreshing alone re-renders the page in the language it is leaving.
    // Rewrite the param in that case and refresh only when there is none.
    const target = languageSwitchTarget(window.location.href, next);
    if (target) {
      router.replace(target);
      router.refresh();
      return;
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleToggle();
      }}
      className="header-language-switcher inline-flex items-center justify-center px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
      aria-label={current === "es" ? "Cambiar a inglés" : "Switch to Spanish"}
    >
      {current === "es" ? "EN" : "ES"}
    </button>
  );
}
