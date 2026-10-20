// Suite ordonnée de séances par programme (partie 2, 1.4). Les séances ne sont
// pas un calendrier : chaque jour d'entraînement de l'utilisateur prend la
// séance SUIVANTE de la suite. Quand l'utilisateur en fait moins que le modèle,
// il prend les N premières du classement de priorité (CrossFit, Hybrid, Hyrox)
// ou la ligne du tableau correspondant (Volume Block, At Home), toujours
// dans l'ordre normal de la semaine. Tous ces ordres sont des paramètres.
//
// Les numéros sont ceux des jours des modèles (programming.ts) : 1 = lundi.

import { SLUG_TO_SPORT_LABEL } from "./ecm-programs";

/** Classements (construits par l'IA, validés par Mohamed, pas par un coach). */
export const PRIORITY_RANKING: Record<string, number[]> = {
  // Samedi WOD long · Lundi · Jeudi · Mardi · Vendredi · Mercredi (facultatif)
  "crossfit-pure": [6, 1, 4, 2, 5, 3],
  // Jeudi Full Body · Lundi Upper · Mardi Lower · Mercredi Zone 2 · Vendredi hypertrophie · Samedi WOD long
  "hybrid-cf-strength": [4, 1, 2, 3, 5, 6],
  // Samedi simulation · Mardi course compromise · Jeudi force jambes · Vendredi Zone 2 · Lundi force haut · Mercredi stations
  "hyrox-pure": [6, 2, 4, 5, 1, 3],
};

/**
 * Tableaux par nombre de séances. Une même séance peut revenir (Upper/Lower ×2).
 * Les séances "full body" du document n'existent pas encore dans les modèles :
 * en attendant le contenu d'un coach, on s'appuie sur les séances existantes
 * les plus proches (à 2 séances : Upper puis Lower / Force A puis Force B).
 */
export const COUNT_TABLES: Record<string, Record<number, number[]>> = {
  "volume-block-hypertrophy": {
    5: [1, 2, 3, 4, 5],
    4: [1, 2, 1, 2],
    3: [3, 4, 5],
    2: [1, 2],
    1: [1],
  },
  "at-home": {
    6: [1, 2, 3, 4, 5, 6],
    5: [1, 2, 3, 4, 5],
    4: [1, 4, 3, 2],
    3: [1, 4, 2],
    2: [1, 4],
    1: [1],
  },
};

/** Séances de la suite pour un utilisateur qui s'entraîne `perWeek` fois par semaine sur ce programme. */
export function sequenceFor(slug: string, perWeek: number, modelDays: number[]): number[] {
  const n = Math.max(1, perWeek);
  const table = COUNT_TABLES[slug];
  if (table) {
    const key = Math.min(n, Math.max(...Object.keys(table).map(Number)));
    return table[key] ?? modelDays;
  }
  const ranking = PRIORITY_RANKING[slug] ?? modelDays;
  const ranked = ranking.filter((d) => modelDays.includes(d));
  return ranked.slice(0, Math.min(n, ranked.length)).sort((a, b) => a - b);
}

type CycleLike = Record<string, { repos?: boolean; slots?: { sport: string }[] }> | null | undefined;

/** Nombre de jours de la semaine type où l'utilisateur a ce programme ECM. */
export function sessionsPerWeek(weekCycle: CycleLike, slug: string): number {
  const label = SLUG_TO_SPORT_LABEL[slug];
  if (!weekCycle || !label) return 0;
  return Object.values(weekCycle).filter((d) => !d?.repos && d?.slots?.some((s) => s.sport === label)).length;
}

export function pickFromSequence(seq: number[], position: number): number {
  return seq[((position % seq.length) + seq.length) % seq.length];
}

/** Position suivante après avoir fait la séance `doneDay` : première occurrence à partir de la position courante. */
export function nextPositionAfter(seq: number[], current: number, doneDay: number): number {
  for (let i = 0; i < seq.length; i++) {
    const idx = (current + i) % seq.length;
    if (seq[idx] === doneDay) return (idx + 1) % seq.length;
  }
  return current;
}
