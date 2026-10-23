// Placement des séances ECM autour des sports fixes (partie 3, règle 7). Un sport hors ECM
// (combat, natation, vélo…) est une ancre : ses jours sont fixes et les séances ECM se calent
// sur les jours restants. Quand il y a moins de jours que de séances, on garde les plus
// importantes selon le classement de priorité du programme. L'adaptation se fait par le
// placement seulement : le contenu des séances ne change pas.

import type { WeekCycle, WeekCycleDayKey } from "@/app/signup/actions";
import { SPORT_LABEL_TO_SLUG } from "./ecm-programs";
import { getTemplate } from "./programming";
import { sequenceFor } from "./program-sequence";
import { WEEK_DAYS } from "./week-cycle";

/** Séances de jambes lourdes : à ne pas placer la veille d'un entraînement dur d'un autre sport (paramètre). */
export const HEAVY_LEGS_PATTERN = /jambes|legs|lower|squat|hinge|force bas/i;

const ECM_LABELS = Object.keys(SPORT_LABEL_TO_SLUG);
const isEcm = (sport: string) => ECM_LABELS.includes(sport);

/** La semaine contient-elle un sport hors ECM (donc une ancre) ? */
export function hasExternalSport(cycle: WeekCycle): boolean {
  return WEEK_DAYS.some((d) => !cycle[d]?.repos && cycle[d]?.slots?.some((s) => s.sport && !isEcm(s.sport)));
}

function combinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (items.length < k) return [];
  const [head, ...rest] = items;
  return [...combinations(rest, k - 1).map((c) => [head, ...c]), ...combinations(rest, k)];
}

/**
 * Nouvelle semaine avec les créneaux du programme ECM replacés sur les jours libres, ou null s'il
 * n'y a rien à replacer. Les créneaux des autres sports et leurs réglages restent inchangés.
 */
export function placeEcmAroundSports(cycle: WeekCycle, programmeLabel: string): WeekCycle | null {
  const slug = SPORT_LABEL_TO_SLUG[programmeLabel];
  const template = slug ? getTemplate(slug) : undefined;
  if (!template) return null;

  const ecmSlots = WEEK_DAYS.flatMap((d) => (cycle[d]?.slots ?? []).filter((s) => s.sport === programmeLabel));
  if (ecmSlots.length === 0) return null;
  const anchors = WEEK_DAYS.filter((d) => !cycle[d]?.repos && cycle[d]?.slots?.some((s) => s.sport && !isEcm(s.sport)));
  if (anchors.length === 0) return null;
  const free = WEEK_DAYS.filter((d) => !anchors.includes(d));
  if (free.length === 0) return null;

  const modelDays = template.weeks[0].days.filter((d) => d.blocks.length > 0 || d.adaptive).map((d) => d.day);
  const count = Math.min(ecmSlots.length, free.length);
  // Séances conservées (les plus importantes) puis remises dans l'ordre normal de la semaine.
  const sessions = sequenceFor(slug, count, modelDays).slice().sort((a, b) => a - b);
  const heavy = sessions.map((n) => HEAVY_LEGS_PATTERN.test(template.weeks[0].days.find((d) => d.day === n)?.focus ?? ""));
  const idx = (d: WeekCycleDayKey) => WEEK_DAYS.indexOf(d);
  const previous = WEEK_DAYS.filter((d) => cycle[d]?.slots?.some((s) => s.sport === programmeLabel));

  let best: { days: WeekCycleDayKey[]; score: number } | null = null;
  for (const days of combinations(free, count)) {
    let score = 0;
    days.forEach((d, i) => {
      const next = WEEK_DAYS[idx(d) + 1];
      if (heavy[i] && next && anchors.includes(next)) score -= 100; // jambes lourdes la veille d'un sport dur
      if (days.includes(WEEK_DAYS[idx(d) + 1])) score -= 10; // séances difficiles à espacer
      if (previous.includes(d)) score += 1; // déplacer le moins possible
    });
    if (!best || score > best.score) best = { days, score };
  }
  if (!best) return null;

  const template0 = ecmSlots[0];
  const out = {} as WeekCycle;
  for (const d of WEEK_DAYS) {
    const others = (cycle[d]?.slots ?? []).filter((s) => s.sport !== programmeLabel);
    const kept = (cycle[d]?.slots ?? []).find((s) => s.sport === programmeLabel);
    const slots = best.days.includes(d) ? [{ ...(kept ?? { ...template0, heure: "" }), sport: programmeLabel }, ...others] : others;
    out[d] = { repos: slots.length === 0, slots };
  }
  return JSON.stringify(out) === JSON.stringify(cycle) ? null : out;
}
