// Langues de l'interface (partie 5, mission 4B). Module neutre : importé côté client et serveur.

export const LANGS = ["fr", "en", "es"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "fr";
export const LANG_COOKIE = "ecm_lang";

export const LANG_META: Record<Lang, { flag: string; code: string; name: string; locale: string }> = {
  fr: { flag: "🇫🇷", code: "FR", name: "Français", locale: "fr-FR" },
  en: { flag: "🇬🇧", code: "EN", name: "English", locale: "en-US" },
  es: { flag: "🇪🇸", code: "ES", name: "Español", locale: "es-ES" },
};

export function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (LANGS as readonly string[]).includes(v);
}

/** Langue de l'appareil (navigator.language / Accept-Language) si parmi les trois, sinon français. */
export function langFromLocale(locale: string | null | undefined): Lang {
  const base = (locale ?? "").toLowerCase().slice(0, 2);
  return isLang(base) ? base : DEFAULT_LANG;
}

export type L10n = Record<Lang, string>;
export const l10n = (fr: string, en: string, es: string): L10n => ({ fr, en, es });
