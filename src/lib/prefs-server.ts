import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { clerkEnabled } from "./clerk";
import { prisma } from "./prisma";
import { DEFAULT_LANG, LANG_COOKIE, isLang, langFromLocale, type Lang } from "./i18n/lang";
import { DEFAULT_THEME, THEME_COOKIE, isTheme, type Theme } from "./theme";

export type Prefs = { lang: Lang; theme: Theme; /** Valeurs lues dans le profil (nouvel appareil) : le client les mémorise dans les cookies. */ fromProfile: boolean };

/**
 * Langue et thème de la requête. Ordre : cookie de cet appareil, sinon réglages enregistrés dans le profil
 * (ils suivent l'utilisateur d'un appareil à l'autre), sinon langue de l'appareil / thème sombre.
 */
export const getPrefs = cache(async (): Promise<Prefs> => {
  try {
    const jar = await cookies();
    const cl = jar.get(LANG_COOKIE)?.value;
    const ct = jar.get(THEME_COOKIE)?.value;
    let lang: Lang | null = isLang(cl) ? cl : null;
    let theme: Theme | null = isTheme(ct) ? ct : null;
    let fromProfile = false;
    if ((!lang || !theme) && clerkEnabled) {
      const { userId } = await auth();
      if (userId) {
        const p = await prisma.profile.findUnique({ where: { userId }, select: { langue: true, theme: true } }).catch(() => null);
        if (p) {
          if (!lang && isLang(p.langue)) {
            lang = p.langue;
            fromProfile = true;
          }
          if (!theme && isTheme(p.theme)) {
            theme = p.theme;
            fromProfile = true;
          }
        }
      }
    }
    if (!lang) {
      const accept = (await headers()).get("accept-language")?.split(",")[0];
      lang = accept ? langFromLocale(accept) : DEFAULT_LANG;
    }
    return { lang, theme: theme ?? DEFAULT_THEME, fromProfile };
  } catch {
    return { lang: DEFAULT_LANG, theme: DEFAULT_THEME, fromProfile: false };
  }
});
