// Traduction : `translate(lang, clé, variables)`. Module neutre (client et serveur).
import { DICT, type DictKey } from "./dict";
import { LANGS, LANG_META, type Lang } from "./lang";

export type { DictKey } from "./dict";
export * from "./lang";

export type Translate = (key: DictKey, vars?: Record<string, string | number>) => string;

export function translate(lang: Lang, key: DictKey, vars?: Record<string, string | number>): string {
  const entry = DICT[key];
  let s: string = entry ? (entry[LANGS.indexOf(lang)] ?? entry[0]) : key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

export function makeT(lang: Lang): Translate {
  return (key, vars) => translate(lang, key, vars);
}

/** Dates, heures et nombres suivent la langue. */
export function formatDate(lang: Lang, d: Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(LANG_META[lang].locale, opts).format(d);
}
export function formatNumber(lang: Lang, n: number, opts?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(LANG_META[lang].locale, opts).format(n);
}
