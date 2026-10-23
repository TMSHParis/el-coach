// Mode compétition : objectifs « événement » du profil et plan de préparation du jour.
// Un événement peut venir de « Je prépare mon corps à… » ou de la priorité Compétition
// de « Améliorer mes performances sportives » — les deux écrivent event + date exacte.

import { planFor, type CompetitionPlan } from "./competition-plan";
import { COMPETITION_BLOCKED_THEMES, SPORT_PROGRAM } from "./competition-params";

export type ProfileObjectifRow = {
  objectif1Event?: string | null;
  objectif1DateExacte?: string | null;
  objectif1Categorie?: string | null;
  objectif1Priorite?: string | null;
  objectif1Details?: unknown;
  objectif2Event?: string | null;
  objectif2DateExacte?: string | null;
  objectif2Categorie?: string | null;
  objectif2Priorite?: string | null;
  objectif2Details?: unknown;
};

export type EventObjective = {
  event: string;
  dateExacte: string | null;
  categorie: string | null;
  /** Niveau visé (Finir, Performer, Podium, Loisir, Amateur, Élite). */
  priorite: string | null;
  fiche: Record<string, string>;
};

function detailsOf(raw: unknown): { axes: string[]; fiche: Record<string, string> } {
  const d = (raw && typeof raw === "object" ? raw : {}) as { axes?: string[]; fiche?: Record<string, string> };
  return { axes: Array.isArray(d.axes) ? d.axes : [], fiche: d.fiche && typeof d.fiche === "object" ? d.fiche : {} };
}

/** Les (jusqu'à 2) objectifs du profil sous forme normalisée. */
export function objectifsOf(profile: ProfileObjectifRow | null | undefined): EventObjective[] {
  if (!profile) return [];
  const rows: EventObjective[] = [];
  const push = (event: string | null | undefined, date: string | null | undefined, cat: string | null | undefined, prio: string | null | undefined, details: unknown) => {
    rows.push({ event: event ?? "", dateExacte: date ?? null, categorie: cat ?? null, priorite: prio ?? null, fiche: detailsOf(details).fiche });
  };
  push(profile.objectif1Event, profile.objectif1DateExacte, profile.objectif1Categorie, profile.objectif1Priorite, profile.objectif1Details);
  push(profile.objectif2Event, profile.objectif2DateExacte, profile.objectif2Categorie, profile.objectif2Priorite, profile.objectif2Details);
  return rows;
}

/** Axes de progression ordonnés d'un objectif (liste d'un élément pour les profils existants). */
export function axesOf(details: unknown, sousCat: string | null | undefined): string[] {
  const { axes } = detailsOf(details);
  if (axes.length > 0) return axes;
  return sousCat ? [sousCat] : [];
}

/** Plan de l'événement le plus proche à venir (tous sports), ou null. */
export function competitionPlanFor(profile: ProfileObjectifRow | null | undefined, todayKey: string): (CompetitionPlan & { categorie: string | null; niveauVise: string | null }) | null {
  let best: (CompetitionPlan & { categorie: string | null; niveauVise: string | null }) | null = null;
  for (const o of objectifsOf(profile)) {
    if (!o.event || !o.dateExacte) continue;
    const plan = planFor({ event: o.event, dateExacte: o.dateExacte, todayKey, fiche: o.fiche, niveau: o.priorite, savedKey: o.fiche._saisie });
    if (!plan) continue;
    if (!best || plan.daysToEvent < best.daysToEvent) best = { ...plan, categorie: o.categorie, niveauVise: o.priorite };
  }
  return best;
}

/** Le mode compétition d'un sport bloque-t-il certains thèmes (Hyrox, CrossFit Games) ? */
export function isCompetitionMode(plan: { event: string } | null): boolean {
  return !!plan && !!SPORT_PROGRAM[plan.event]?.competitionMode;
}

/** Thème réellement appliqué : en mode compétition, Force / Endurance / Capacité / Haltérophilie ne s'appliquent plus. */
export function effectiveTheme(theme: string, programLabel: string | null | undefined, profile: ProfileObjectifRow | null | undefined, todayKey: string): string {
  if (!COMPETITION_BLOCKED_THEMES.map((t) => t.toLowerCase().replace("é", "e")).includes(theme.toLowerCase().replace("é", "e"))) return theme;
  const plan = competitionPlanFor(profile, todayKey);
  const mapping = plan ? SPORT_PROGRAM[plan.event] : null;
  if (!plan || !mapping?.competitionMode || !mapping.program || !programLabel?.endsWith(mapping.program)) return theme;
  return "equilibre";
}
