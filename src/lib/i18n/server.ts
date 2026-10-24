import "server-only";
import { cookies, headers } from "next/headers";
import { DEFAULT_LANG, LANG_COOKIE, isLang, langFromLocale, type Lang } from "./lang";
import { makeT } from "./index";

/** Langue de la requête : cookie (synchronisé avec le profil), sinon langue de l'appareil, sinon français. */
export async function getLang(): Promise<Lang> {
  try {
    const jar = await cookies();
    const c = jar.get(LANG_COOKIE)?.value;
    if (isLang(c)) return c;
    const h = await headers();
    const accept = h.get("accept-language")?.split(",")[0];
    return accept ? langFromLocale(accept) : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

export async function getT() {
  const lang = await getLang();
  return { lang, t: makeT(lang) };
}
