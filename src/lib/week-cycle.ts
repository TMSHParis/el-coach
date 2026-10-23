// Semaine effective d'une date (partie 3, mission 7). Priorité : modification propre à la
// semaine (« cette semaine » ou « 4 semaines ») > alternance A/B > semaine type.
// Pur : utilisable côté client (planificateur) et serveur (dashboard, check-in).

import type { WeekCycle, WeekCycleDayKey } from "@/app/signup/actions";
import { parseKey } from "./week";

export const WEEK_DAYS: WeekCycleDayKey[] = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];

/** Alternance de deux semaines différentes : A, B, A, B… à partir du lundi `anchor` (semaine A). */
export type WeekAlternance = { a: WeekCycle; b: WeekCycle; anchor: string };

/** Lettre de la semaine `weekStart` dans l'alternance (valable aussi avant l'ancre). */
export function alternanceLetter(anchor: string, weekStart: string): "A" | "B" {
  const weeks = Math.round((parseKey(weekStart).getTime() - parseKey(anchor).getTime()) / (7 * 86_400_000));
  return ((weeks % 2) + 2) % 2 === 0 ? "A" : "B";
}

export function cycleForWeek(
  weekStart: string,
  base: WeekCycle | null,
  overrides: Record<string, WeekCycle>,
  alternance: WeekAlternance | null,
): WeekCycle | null {
  const own = overrides[weekStart];
  if (own) return own;
  if (alternance) return alternanceLetter(alternance.anchor, weekStart) === "A" ? alternance.a : alternance.b;
  return base;
}

/** Jours dont le contenu diffère entre deux semaines. */
export function diffDays(a: WeekCycle, b: WeekCycle): WeekCycleDayKey[] {
  return WEEK_DAYS.filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
}

/** Semaine vide (aucun repos explicite, aucun créneau) : la semaine type n'a pas encore été personnalisée. */
export function isEmptyCycle(c: WeekCycle | null | undefined): boolean {
  return !c || WEEK_DAYS.every((k) => !c[k]?.repos && (c[k]?.slots?.length ?? 0) === 0);
}
