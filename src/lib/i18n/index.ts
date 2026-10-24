// Traduction : `translate(lang, clé, variables)`. Module neutre (client et serveur).
import { fr, type DictKey } from "./fr";
import { en } from "./en";
import { es } from "./es";
import { LANG_META, type Lang } from "./lang";

export type { DictKey } from "./fr";
export * from "./lang";

const DICTS: Record<Lang, Record<DictKey, string>> = { fr, en, es };

export type Translate = (key: DictKey, vars?: Record<string, string | number>) => string;

export function translate(lang: Lang, key: DictKey, vars?: Record<string, string | number>): string {
  let s = DICTS[lang][key] ?? fr[key] ?? key;
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
