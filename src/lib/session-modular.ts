// Structure modulable d'une séance (partie 2, 1.1 et 1.2) : B1 à B5, états
// vert / jaune / rouge, variantes Complète / Sans finisher / Courte.
//   B1 obligatoire · B2 obligatoire · B3 modulable · B4 modulable (finisher /
//   accessoire 2) · B5 facultatif.

import type { Block, Day } from "./programming";
import { COACH_PARAMS } from "./coach-params";

export type ModularVariant = "complete" | "nofinisher" | "short";
export type ReadinessState = "green" | "yellow" | "red";
type Role = "B1" | "B2" | "B3" | "B4" | "B5";

export const VARIANT_LABEL: Record<ModularVariant, string> = {
  complete: "Complète",
  nofinisher: "Sans finisher",
  short: "Courte",
};
export const VARIANT_HINT: Record<ModularVariant, string> = {
  complete: "B1 à B5",
  nofinisher: "B1, B2, B3, B5",
  short: "B1, B2, B5",
};

export function parseVariant(value: string | undefined | null): ModularVariant | null {
  return value === "complete" || value === "nofinisher" || value === "short" ? value : null;
}

/**
 * Rôle (B1 à B5) de chaque bloc. Cadre à 5 blocs : par position. Sinon : le
 * premier bloc échauffement = B1, le dernier retour au calme = B5, puis les
 * blocs restants dans l'ordre (cœur, B3, B4).
 */
export function blockRoles(blocks: Block[]): (Role | null)[] {
  if (blocks.length === 5) return ["B1", "B2", "B3", "B4", "B5"];
  const mid: Role[] = ["B2", "B3", "B4"];
  let m = 0;
  return blocks.map((b, i) => {
    if (b.type === "warmup" && i === 0) return "B1";
    if (b.type === "cooldown") return "B5";
    return mid[m++] ?? null;
  });
}

function minutesOf(block: Block): number {
  const m = block.duration?.match(/^(\d+)\s*min$/);
  return m ? Number(m[1]) : 0;
}

function withoutBlocks(day: Day, drop: (role: Role | null, block: Block) => boolean): Day {
  const roles = blockRoles(day.blocks);
  const removed: Block[] = [];
  const blocks = day.blocks.filter((b, i) => {
    if (drop(roles[i], b)) {
      removed.push(b);
      return false;
    }
    return true;
  });
  if (removed.length === 0) return day;
  const known = removed.reduce((sum, b) => sum + minutesOf(b), 0);
  const estimate = known > 0 ? known : Math.round(day.estimatedMinutes * (removed.length / day.blocks.length));
  return { ...day, blocks, estimatedMinutes: Math.max(10, day.estimatedMinutes - estimate) };
}

/** Retire le volume d'une série / d'un round sur les blocs de travail (état jaune). */
function trimOneSet(day: Day): Day {
  const roles = blockRoles(day.blocks);
  const blocks = day.blocks.map((b, i) => {
    if (roles[i] !== "B2" && roles[i] !== "B3") return b;
    const exercises = b.exercises.map((ex) =>
      typeof ex.sets === "number" && ex.sets > 1 ? { ...ex, sets: ex.sets + COACH_PARAMS.yellowVolumeSetsDelta } : ex,
    );
    const rounds = typeof b.rounds === "number" && b.rounds > 1 ? b.rounds - 1 : b.rounds;
    return { ...b, exercises, rounds };
  });
  return { ...day, blocks };
}

export function applyModularVariant(day: Day, variant: ModularVariant): Day {
  if (variant === "complete") return day;
  if (variant === "nofinisher") return withoutBlocks(day, (r) => r === "B4");
  return withoutBlocks(day, (r) => r === "B3" || r === "B4");
}

/**
 * État du jour : vert = séance complète · jaune ≈ 80 % (-1 série ou -1 round,
 * finisher supprimé) · rouge = B1 + mobilité uniquement.
 */
export function applyReadiness(day: Day, state: ReadinessState): Day {
  if (state === "green") return day;
  if (state === "yellow") return trimOneSet(withoutBlocks(day, (r) => r === "B4"));
  return withoutBlocks(day, (r) => r !== "B1" && r !== "B5");
}

export type VariantSuggestion = { variant: ModularVariant; reasons: string[] };

/** Groupes sollicités, déduits du libellé de la séance — sert à la règle des 24 h. */
const FOCUS_GROUPS: Record<string, RegExp> = {
  jambes: /squat|lower|jambe|leg|hinge|deadlift|fessier/i,
  haut: /upper|haut|push|pull|press|bench|gym|tirage|pompe/i,
  engine: /cardio|engine|course|run|zone ?2|hyrox|metcon|wod|simulation/i,
};
export function sameStressNextDay(todayFocus: string, nextFocus: string | null | undefined): boolean {
  if (!nextFocus) return false;
  return Object.values(FOCUS_GROUPS).some((re) => re.test(todayFocus) && re.test(nextFocus));
}

/**
 * Variante proposée (1.2) : le finisher saute si au moins une condition est
 * vraie ; "Courte" quand l'état est rouge ou le temps vraiment court.
 * Le finisher est conservé en état vert + objectif conditionnement + temps suffisant.
 */
export function suggestModularVariant(input: {
  state: ReadinessState;
  isDeload?: boolean;
  /** Objectif du moment : profil, demande du check-in, thème du bloc. */
  goal?: "force" | "hypertrophie" | "conditionnement" | "autre";
  sessionMinutes: number;
  availableMinutes?: number | null;
  nextDayOverlap?: boolean;
}): VariantSuggestion {
  const reasons: string[] = [];
  if (input.state === "red") return { variant: "short", reasons: ["état rouge"] };
  if (input.availableMinutes && input.availableMinutes < input.sessionMinutes * 0.7) {
    return { variant: "short", reasons: [`temps disponible court (${input.availableMinutes} min)`] };
  }
  if (input.state === "yellow") reasons.push("état jaune");
  if (input.isDeload) reasons.push("semaine de décharge");
  if ((input.goal === "force" || input.goal === "hypertrophie") && input.sessionMinutes >= COACH_PARAMS.longSessionMinutes)
    reasons.push("séance déjà longue");
  if (input.availableMinutes && input.availableMinutes <= COACH_PARAMS.shortTimeMinutes) reasons.push("temps disponible court");
  if (input.nextDayOverlap) reasons.push("demain sollicite les mêmes groupes");
  return reasons.length > 0 ? { variant: "nofinisher", reasons } : { variant: "complete", reasons: [] };
}

/** "45 min" → 45, "1h" → 60, "1h30" → 90, "2h+" → 120 ; null si illisible. */
export function parseAvailableMinutes(label: string | null | undefined): number | null {
  if (!label) return null;
  const h = label.match(/^(\d+)\s*h\s*(\d+)?/i);
  if (h) return Number(h[1]) * 60 + (h[2] ? Number(h[2]) : 0);
  const m = label.match(/^(\d+)\s*min/i);
  return m ? Number(m[1]) : null;
}

export function goalFromText(text: string | null | undefined): "force" | "hypertrophie" | "conditionnement" | "autre" {
  if (!text) return "autre";
  if (/force|puissance/i.test(text)) return "force";
  if (/masse|hypertroph|muscle|volume/i.test(text)) return "hypertrophie";
  if (/cardio|condition|endurance|capacit|perform|hyrox/i.test(text)) return "conditionnement";
  return "autre";
}

/**
 * Séance du jour après structure modulable : état du jour, puis variante
 * (celle choisie par l'utilisateur, sinon la proposition de l'app).
 */
export function resolveModularDay(input: {
  day: Day;
  state: ReadinessState;
  chosen: ModularVariant | null;
  goalText?: string | null;
  availableLabel?: string | null;
  nextDayFocus?: string | null;
  isDeload?: boolean;
}): { day: Day; variant: ModularVariant; suggestion: VariantSuggestion } {
  const suggestion = suggestModularVariant({
    state: input.state,
    isDeload: input.isDeload,
    goal: goalFromText(input.goalText),
    sessionMinutes: input.day.estimatedMinutes,
    availableMinutes: parseAvailableMinutes(input.availableLabel),
    nextDayOverlap: sameStressNextDay(input.day.focus, input.nextDayFocus),
  });
  const variant = input.chosen ?? suggestion.variant;
  const adjusted = applyReadiness(input.day, input.state === "red" ? "red" : input.state);
  // État rouge : B1 + mobilité déjà appliqués ; une variante ne s'y ajoute pas.
  return { day: input.state === "red" ? adjusted : applyModularVariant(adjusted, variant), variant, suggestion };
}
