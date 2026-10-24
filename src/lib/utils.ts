import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { LANG_META, type Lang } from "@/lib/i18n/lang";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(cents: number, currency = "EUR", lang: Lang = "fr") {
  // Affiche les centimes seulement quand ils sont non nuls (9,90€ → "9,90 €" mais 50€ → "50 €").
  const hasCents = cents % 100 !== 0;
  return new Intl.NumberFormat(LANG_META[lang].locale, {
    style: "currency",
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
