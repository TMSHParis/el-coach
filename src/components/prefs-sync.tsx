"use client";

import { useEffect } from "react";
import { LANG_COOKIE, type Lang } from "@/lib/i18n/lang";
import { THEME_COOKIE, type Theme } from "@/lib/theme";

/** Nouvel appareil : mémorise la langue et le thème du profil dans les cookies (lus ensuite par le serveur). */
export function PrefsSync({ lang, theme }: { lang: Lang; theme: Theme }) {
  useEffect(() => {
    const year = 60 * 60 * 24 * 365;
    document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=${year}; samesite=lax`;
    document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${year}; samesite=lax`;
  }, [lang, theme]);
  return null;
}
