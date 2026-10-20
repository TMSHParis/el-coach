// Chaînes de progression At Home (partie 2, 2.7 / 4.5) — proposées d'après la pratique
// courante de la calisthénie, à valider par un coach. Règle de montée : quand l'objectif de
// reps est atteint (coach-params : 3 × 12 par défaut), l'app propose le cran suivant.
// Pas de montée pendant la semaine de décharge.

import type { Day } from "./programming";
import { getMovement } from "./movements";
import { COACH_PARAMS, type HomeLevel } from "./coach-params";

export type ChainId = "poussee" | "epaules" | "tirage" | "jambes" | "core";

export const CHAINS: Record<ChainId, { label: string; steps: string[]; needsBarFrom?: number }> = {
  poussee: { label: "Poussée", steps: ["knee-pushup", "pushup", "decline-pushup", "archer-pushup", "one-arm-pushup"] },
  epaules: { label: "Épaules", steps: ["pike-pushup", "handstand-hold"] },
  // À partir du cran 1 (tractions négatives) il faut une barre de traction.
  tirage: { label: "Tirage", steps: ["inverted-row", "negative-pullup", "strict-pullup", "pull-up", "archer-pull-up"], needsBarFrom: 1 },
  jambes: { label: "Jambes", steps: ["air-squat", "db-bulgarian", "pistol-assisted", "pistol"] },
  core: { label: "Core", steps: ["plank", "hollow-hold", "l-sit", "front-lever"] },
};

/** Chaîne et cran d'un mouvement, s'il en fait partie. */
export function chainOf(movementId: string): { chain: ChainId; index: number } | null {
  for (const [id, c] of Object.entries(CHAINS) as [ChainId, (typeof CHAINS)[ChainId]][]) {
    const index = c.steps.indexOf(movementId);
    if (index >= 0) return { chain: id, index };
  }
  return null;
}

/** Cran maximal accessible selon le matériel : sans barre de traction, le tirage reste au rowing. */
export function maxStep(chain: ChainId, level: HomeLevel): number {
  const c = CHAINS[chain];
  if (chain === "tirage" && level !== "etendu") return (c.needsBarFrom ?? 1) - 1;
  return c.steps.length - 1;
}

/** Remplace les mouvements des chaînes par le cran actuel de l'utilisateur (défaut : le cran écrit dans la séance). */
export function applyChains(day: Day, levels: Partial<Record<ChainId, number>>, home: HomeLevel): Day {
  let limited = false;
  const blocks = day.blocks.map((b) => ({
    ...b,
    exercises: b.exercises.map((e) => {
      const ref = chainOf(e.movementId);
      if (!ref) return e;
      const wanted = levels[ref.chain] ?? ref.index;
      const cap = maxStep(ref.chain, home);
      const idx = Math.min(wanted, cap);
      if (ref.chain === "tirage" && wanted > cap) limited = true;
      const id = CHAINS[ref.chain].steps[idx];
      if (id === e.movementId) return e;
      const name = getMovement(id)?.name;
      return { ...e, movementId: id, notes: [e.notes, name ? `Cran actuel de ta chaîne ${CHAINS[ref.chain].label.toLowerCase()} : ${name}.` : null].filter(Boolean).join(" ") };
    }),
  }));
  const note = limited
    ? "Sans barre de traction, les chaînes de tirage sont limitées (rowing sous une table, serviette)."
    : null;
  return { ...day, blocks, notes: [day.notes, note].filter(Boolean).join(" ") || day.notes };
}

type SerieLike = { charge: string; reps: string }[];

/** Objectif de reps atteint sur toutes les séries demandées ? */
export function reachedTarget(series: SerieLike | undefined): boolean {
  const done = (series ?? []).filter((s) => parseFloat(s.reps) > 0);
  if (done.length < COACH_PARAMS.chainUpgradeSets) return false;
  return done.slice(0, COACH_PARAMS.chainUpgradeSets).every((s) => parseFloat(s.reps) >= COACH_PARAMS.chainUpgradeReps);
}

/** Propositions de montée d'après les résultats de la séance. */
export function upgradeProposals(
  results: { nom: string; series?: SerieLike }[],
  levels: Partial<Record<ChainId, number>>,
  home: HomeLevel,
): { chain: ChainId; from: string; to: string; toIndex: number }[] {
  const out: { chain: ChainId; from: string; to: string; toIndex: number }[] = [];
  for (const r of results) {
    if (!reachedTarget(r.series)) continue;
    for (const [id, c] of Object.entries(CHAINS) as [ChainId, (typeof CHAINS)[ChainId]][]) {
      const cur = levels[id];
      c.steps.forEach((stepId, i) => {
        const name = getMovement(stepId)?.name;
        if (name && r.nom.startsWith(name) && (cur === undefined || cur === i) && i + 1 <= maxStep(id, home) && i + 1 < c.steps.length) {
          out.push({ chain: id, from: name, to: getMovement(c.steps[i + 1])?.name ?? c.steps[i + 1], toIndex: i + 1 });
        }
      });
    }
  }
  return out.filter((p, i, a) => a.findIndex((q) => q.chain === p.chain) === i);
}
