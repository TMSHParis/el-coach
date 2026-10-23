// Plan de préparation d'un événement (partie 3, missions 3.4 et 4) : phases dont les
// largeurs sont proportionnelles aux durées, phase en cours, volume de la semaine.
// Pur : aucune dépendance serveur, utilisable côté client (fiche) et serveur (dashboard).

import { familyOf, phaseNames, phaseParamsFor, type PhaseKey } from "./competition-params";

export type PlanPhase = {
  key: PhaseKey;
  label: string;
  /** Durée en semaines (0 pour une phase supprimée par le raccourcissement). */
  weeks: number;
  state: "past" | "current" | "future";
};

export type CompetitionPlan = {
  event: string;
  eventDate: string;
  daysToEvent: number;
  weeksOut: number;
  phases: PlanPhase[];
  current: PhaseKey;
  /** Semaine dans la phase en cours (1-based) et durée de cette phase. */
  weekInPhase: number | null;
  currentPhaseWeeks: number | null;
  planWeeks: number;
  /** Position de « aujourd'hui » sur la barre, entre 0 et 1. */
  todayFraction: number;
  shortened: boolean;
  /** Fraction du volume normal cette semaine (1 = complet). */
  volumeFactor: number;
};

const DAY_MS = 86_400_000;
const parse = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
};

/** Poids visuel de la phase « événement » (très courte). */
const EVENT_WEIGHT = 0.6;

/** Niveau visé : « Finir » = moins de volume (proposition à valider) ; les autres = volume complet. */
const LEVEL_FACTOR: Record<string, number> = { Finir: 0.9 };
/** Sports pour lesquels le niveau visé module le volume (proposition : Hyrox seulement). */
const LEVEL_FACTOR_EVENTS = ["Hyrox"];

export function planFor(input: {
  event: string;
  dateExacte: string;
  todayKey: string;
  fiche?: Record<string, string>;
  niveau?: string | null;
  /** Jour où la date a été saisie : sert à raccourcir le plan quand l'événement est proche. */
  savedKey?: string | null;
}): CompetitionPlan | null {
  const { event, dateExacte, todayKey, fiche = {} } = input;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateExacte)) return null;
  const daysToEvent = Math.round((parse(dateExacte) - parse(todayKey)) / DAY_MS);
  if (daysToEvent < 0) return null;
  const weeksOut = Math.floor(daysToEvent / 7);

  const params = phaseParamsFor(event, fiche);
  const names = phaseNames(event);
  const taper = params.affutage;
  let spec = params.specifique;
  let base = Math.max(0, params.total - spec - taper);

  // Date trop proche : on retire d'abord la phase de départ, puis on raccourcit la Spécifique.
  const savedKey = input.savedKey && /^\d{4}-\d{2}-\d{2}$/.test(input.savedKey) ? input.savedKey : null;
  const available = savedKey ? Math.max(0, Math.floor((parse(dateExacte) - parse(savedKey)) / DAY_MS / 7)) : params.total;
  let shortened = false;
  let need = params.total - available;
  if (need > 0) {
    shortened = true;
    const cutBase = Math.min(base, need);
    base -= cutBase;
    need -= cutBase;
    if (need > 0) spec = Math.max(1, spec - need);
  }
  const planWeeks = base + spec + taper;

  let current: PhaseKey;
  let weekInPhase: number | null = null;
  let currentPhaseWeeks: number | null = null;
  if (weeksOut === 0) {
    current = "evenement";
  } else if (weeksOut <= taper) {
    current = "affutage";
    currentPhaseWeeks = taper;
    weekInPhase = taper - weeksOut + 1;
  } else if (weeksOut <= taper + spec) {
    current = "specifique";
    currentPhaseWeeks = spec;
    weekInPhase = taper + spec - weeksOut + 1;
  } else {
    current = "base";
    if (base > 0 && weeksOut <= planWeeks) {
      currentPhaseWeeks = base;
      weekInPhase = planWeeks - weeksOut + 1;
    }
  }

  const order: PhaseKey[] = ["base", "specifique", "affutage", "evenement"];
  const weeksByKey: Record<PhaseKey, number> = { base, specifique: spec, affutage: taper, evenement: 1 };
  const phases: PlanPhase[] = order
    .filter((k) => weeksByKey[k] > 0)
    .map((k) => ({
      key: k,
      label: names[k],
      weeks: weeksByKey[k],
      state: k === current ? "current" : order.indexOf(k) < order.indexOf(current) ? "past" : "future",
    }));

  const total = planWeeks + EVENT_WEIGHT;
  const elapsed = Math.max(0, Math.min(planWeeks, planWeeks - daysToEvent / 7));
  const todayFraction = Math.min(1, elapsed / total);

  const vol = params.volume[Math.min(weeksOut, Math.max(...Object.keys(params.volume).map(Number)) + 1)] ?? 1;
  const volumeFactor = Math.round(vol * (LEVEL_FACTOR_EVENTS.includes(event) ? (LEVEL_FACTOR[input.niveau ?? ""] ?? 1) : 1) * 100) / 100;

  return {
    event,
    eventDate: dateExacte,
    daysToEvent,
    weeksOut,
    phases,
    current,
    weekInPhase,
    currentPhaseWeeks,
    planWeeks,
    todayFraction,
    shortened,
    volumeFactor,
  };
}

/** Largeur relative (pourcentage) d'une phase sur la barre. */
export function phaseWidthPercent(plan: CompetitionPlan, phase: PlanPhase): number {
  const total = plan.planWeeks + EVENT_WEIGHT;
  const w = phase.key === "evenement" ? EVENT_WEIGHT : phase.weeks;
  return (w / total) * 100;
}

export function pathTitle(event: string): string {
  const fam = familyOf(event);
  if (event === "Hyrox" || fam === "course") return "Ton chemin jusqu'à la course";
  if (fam === "combat") return "Ton chemin jusqu'au combat";
  return "Ton chemin jusqu'à l'événement";
}

export function weeksLeftLabel(daysToEvent: number): string {
  const w = Math.floor(daysToEvent / 7);
  if (daysToEvent <= 0) return "aujourd'hui";
  if (w === 0) return `dans ${daysToEvent} jour${daysToEvent > 1 ? "s" : ""}`;
  return `dans ${w} semaine${w > 1 ? "s" : ""}`;
}

/** Ce qui change dans la phase en cours (une phrase). */
export function planSentence(plan: CompetitionPlan): string {
  switch (plan.current) {
    case "base":
      return "On construit la base : régularité, technique et capacité de travail.";
    case "specifique":
      return "Le travail se rapproche de l'effort réel de l'événement.";
    case "affutage":
      return `On garde l'intensité et on réduit le volume (${Math.round(plan.volumeFactor * 100)} % du volume normal). Rien de nouveau à ce stade.`;
    default:
      return "Semaine de l'événement : rien de lourd, rien de nouveau.";
  }
}
