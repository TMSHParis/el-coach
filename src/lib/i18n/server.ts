import "server-only";
import { getPrefs } from "../prefs-server";
import { makeT } from "./index";
import type { Lang } from "./lang";

/** Langue de la requête (cookie, sinon profil, sinon langue de l'appareil, sinon français). */
export async function getLang(): Promise<Lang> {
  return (await getPrefs()).lang;
}

export async function getT() {
  const lang = await getLang();
  return { lang, t: makeT(lang) };
}
