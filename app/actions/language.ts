"use server";

import { cookies } from "next/headers";
import {
  LANGUAGE_COOKIE,
  LANGUAGE_COOKIE_MAX_AGE_S,
  isLanguage,
  type Language,
} from "@/lib/language";

// Called from the in-app toggle button. We don't redirect or revalidate —
// the page is a Client Component that already maintains the language in
// React state and localStorage. The cookie just bridges that state across
// to the server so server actions, emails, and the next SSR render know
// which language to use.
export async function setLanguageCookie(lang: Language): Promise<void> {
  if (!isLanguage(lang)) return;
  const cookieStore = await cookies();
  cookieStore.set(LANGUAGE_COOKIE, lang, {
    path: "/",
    maxAge: LANGUAGE_COOKIE_MAX_AGE_S,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
  });
}
