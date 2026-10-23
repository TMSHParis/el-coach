// Mode préparation de compétition Hyrox (partie 2, 1.9 / 2.5). Activation automatique :
// objectif « Je prépare mon corps à… » = Hyrox + date exacte. Phases : Construction →
// Spécifique → Affûtage → Course. Durées et volumes viennent de coach-params.ts.

import type { Block, Day } from "./programming";
import { planFor } from "./competition-plan";

export type HyroxPhase = "construction" | "specifique" | "affutage" | "course";

export const PHASE_LABEL: Record<HyroxPhase, string> = {
  construction: "Construction",
  specifique: "Spécifique",
  affutage: "Affûtage",
  course: "Course",
};

export type HyroxPrep = {
  raceDate: string;
  daysToRace: number;
  weeksOut: number;
  phase: HyroxPhase;
  /** Semaine dans la phase (1-based) et durée de la phase, quand elles sont définies. */
  weekInPhase: number | null;
  phaseWeeks: number | null;
  /** Fraction du volume normal (1 = volume complet). */
  volumeFactor: number;
  categorie: string | null;
  niveauVise: string | null;
};

/** Objectif Hyrox exploitable : événement Hyrox + date exacte à venir. Les phases viennent du plan générique (competition-plan). */
export function hyroxPrepFor(
  objectifs: { event?: string | null; dateExacte?: string | null; categorie?: string | null; priorite?: string | null; fiche?: Record<string, string> }[],
  todayKey: string,
): HyroxPrep | null {
  const obj = objectifs.find((o) => o.event === "Hyrox" && o.dateExacte);
  if (!obj?.dateExacte) return null;
  const plan = planFor({
    event: "Hyrox",
    dateExacte: obj.dateExacte,
    todayKey,
    fiche: obj.fiche,
    niveau: obj.priorite,
    savedKey: obj.fiche?._saisie,
  });
  if (!plan) return null;
  const PHASE_OF = { base: "construction", specifique: "specifique", affutage: "affutage", evenement: "course" } as const;
  return {
    raceDate: obj.dateExacte,
    daysToRace: plan.daysToEvent,
    weeksOut: plan.weeksOut,
    phase: PHASE_OF[plan.current],
    weekInPhase: plan.weekInPhase,
    phaseWeeks: plan.currentPhaseWeeks,
    volumeFactor: plan.volumeFactor,
    categorie: obj.categorie ?? null,
    niveauVise: obj.priorite ?? null,
  };
}

export function phaseSentence(prep: HyroxPrep): string {
  switch (prep.phase) {
    case "specifique":
      return "Plus de simulations et de course compromise. La séance de samedi passe en simulation half.";
    case "affutage":
      return "On garde l'intensité et la course compromise, on réduit le volume. Rien de nouveau à ce stade.";
    case "course":
      return "Semaine de course : rien de lourd, rien de nouveau.";
    default:
      return "On construit la base : Zone 2, force et technique des stations.";
  }
}

export function scaleVolume(day: Day, factor: number): Day {
  if (factor >= 1) return day;
  const blocks: Block[] = day.blocks.map((b) => ({
    ...b,
    exercises: b.exercises.map((e) => (typeof e.sets === "number" ? { ...e, sets: Math.max(1, Math.round(e.sets * factor)) } : e)),
    rounds: typeof b.rounds === "number" ? Math.max(1, Math.round(b.rounds * factor)) : b.rounds,
  }));
  return { ...day, blocks, estimatedMinutes: Math.max(15, Math.round(day.estimatedMinutes * factor)) };
}

/** Séances de la semaine de course (exemples de durée, à valider par un coach). */
function raceWeekDay(prep: HyroxPrep, base: Day): Day {
  const mk = (focus: string, notes: string, blocks: Block[], minutes: number): Day => ({ day: base.day, focus, estimatedMinutes: minutes, notes, blocks });
  if (prep.daysToRace === 0) {
    return mk("JOUR J · HYROX", "Charges de référence affichées sur la carte Préparation. Rien de nouveau.", [], 0);
  }
  const rest = mk("Repos", "Repos, sommeil, hydratation, matériel prêt.", [], 0);
  if (prep.daysToRace === 1) return rest;
  if (prep.daysToRace === 2) {
    return mk("Séance d'activation", "Deux jours avant la course : courte et vive, rien de lourd.", [
      { name: "Activation", type: "conditioning", format: "Intervals", duration: "20min", exercises: [{ movementId: "run", sets: 4, time: "1min", rest: "1min30", notes: "Allure course, vif." }, { movementId: "wall-ball", sets: 2, reps: 10 }] },
    ], 25);
  }
  if (base.day === 1 || prep.daysToRace >= 5) {
    return mk("Footing de décrassage", "Allure facile, 20 à 30 min.", [{ name: "Footing", type: "endurance", format: "StraightSets", duration: "25min", exercises: [{ movementId: "run", time: "25min", notes: "Allure facile." }] }], 25);
  }
  return rest;
}

/** Applique la phase à la séance du jour. */
export function applyPrepToDay(day: Day, prep: HyroxPrep): Day {
  if (prep.phase === "course") return raceWeekDay(prep, day);
  const out = scaleVolume(day, prep.volumeFactor);
  const note =
    prep.phase === "affutage"
      ? `Affûtage · volume ${Math.round(prep.volumeFactor * 100)} % du volume normal, intensité conservée.`
      : prep.phase === "specifique"
        ? "Phase Spécifique : plus de simulations et de course compromise."
        : null;
  return note ? { ...out, notes: [out.notes, note].filter(Boolean).join(" ") } : out;
}
