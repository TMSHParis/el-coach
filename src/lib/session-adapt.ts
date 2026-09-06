// ============================================================================
// Adaptation de la séance générée (programming.ts) aux blessures/douleurs
// réelles de l'athlète — profil (chronique) + check-in du jour (aigu).
//
// Principe : une table de risque PAR MOUVEMENT (pas par zone) avec un seul
// remplaçant sûr — évite les conflits quand un mouvement est risqué pour
// plusieurs zones à la fois. Toutes les cibles existent déjà dans
// movements.ts, aucun ajout au catalogue nécessaire.
// ============================================================================

import { getMovement } from "./movements";
import type { Block, Day, Exercise } from "./programming";

export type InjuryArea = "shoulder" | "knee" | "back" | "hamstring";

const AREA_KEYWORDS: Record<InjuryArea, string[]> = {
  shoulder: ["epaule", "coiffe", "deltoide"],
  knee: ["genou", "genoux", "rotule", "menisque"],
  back: ["lombaire", "lombalgie", "dos", "vertebre", "sciatique"],
  hamstring: ["ischio", "jambe", "mollet", "cuisse"],
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Détecte les zones à risque depuis du texte libre (blessuresDetail, douleurDetail). */
export function detectInjuryAreas(...texts: (string | null | undefined)[]): InjuryArea[] {
  const combined = normalize(texts.filter(Boolean).join(" "));
  if (!combined) return [];
  const areas: InjuryArea[] = [];
  for (const area of Object.keys(AREA_KEYWORDS) as InjuryArea[]) {
    if (AREA_KEYWORDS[area].some((kw) => combined.includes(kw))) areas.push(area);
  }
  return areas;
}

type RiskEntry = { areas: InjuryArea[]; replacement: string; reason: string };

const MOVEMENT_RISK: Record<string, RiskEntry> = {
  "back-squat": { areas: ["knee", "back"], replacement: "kb-goblet-squat", reason: "Charge et amplitude réduites — protège genoux/dos." },
  "front-squat": { areas: ["knee", "back"], replacement: "kb-goblet-squat", reason: "Charge et amplitude réduites — protège genoux/dos." },
  "overhead-squat": { areas: ["shoulder", "knee", "back"], replacement: "kb-goblet-squat", reason: "Retire la charge overhead et la flexion profonde." },
  deadlift: { areas: ["back", "hamstring"], replacement: "kb-deadlift", reason: "Charge réduite — protège le bas du dos." },
  rdl: { areas: ["back", "hamstring"], replacement: "dead-bug", reason: "Remplacé par du gainage léger — pas de charge sur la chaîne postérieure." },
  "kb-swing-russian": { areas: ["back", "hamstring"], replacement: "pallof-press", reason: "Retire le ballant de hanche chargé — protège dos/ischios." },
  "kb-swing-american": { areas: ["back", "hamstring"], replacement: "pallof-press", reason: "Retire le ballant de hanche chargé — protège dos/ischios." },
  "strict-press": { areas: ["shoulder"], replacement: "db-floor-press", reason: "Amplitude limitée au sol — retire l'overhead." },
  "power-snatch": { areas: ["shoulder"], replacement: "kb-swing-russian", reason: "Retire la réception overhead." },
  "clean-and-jerk": { areas: ["shoulder"], replacement: "power-clean", reason: "Garde le clean, retire le jerk overhead." },
  thruster: { areas: ["shoulder"], replacement: "front-squat", reason: "Garde le squat, retire la finition overhead." },
  hspu: { areas: ["shoulder"], replacement: "pike-pushup", reason: "Amplitude overhead réduite." },
  "handstand-walk": { areas: ["shoulder"], replacement: "bear-crawl", reason: "Retire la charge overhead en appui." },
  "kipping-pullup": { areas: ["shoulder"], replacement: "ring-row", reason: "Tirage horizontal — retire la suspension overhead." },
  "ring-dip": { areas: ["shoulder"], replacement: "box-dip", reason: "Amplitude épaule réduite." },
  "jump-squat": { areas: ["knee"], replacement: "air-squat", reason: "Retire l'impact à la réception." },
  "jumping-lunge": { areas: ["knee"], replacement: "walking-lunge", reason: "Retire l'impact — garde le pattern de fente." },
  "box-jump-over": { areas: ["knee"], replacement: "step-up", reason: "Retire l'impact/la réception sautée." },
  "broad-jump": { areas: ["knee"], replacement: "row", reason: "Cardio sans impact." },
  "burpee-broad-jump": { areas: ["knee"], replacement: "row", reason: "Cardio sans impact." },
  "bar-facing-burpee": { areas: ["knee"], replacement: "row", reason: "Cardio sans impact." },
  "bb-walking-lunge": { areas: ["knee"], replacement: "farmers-carry", reason: "Retire la flexion de genou chargée." },
  "db-bulgarian": { areas: ["knee"], replacement: "farmers-carry", reason: "Retire la flexion de genou chargée." },
  "db-box-step-up": { areas: ["knee"], replacement: "farmers-carry", reason: "Retire la flexion de genou chargée." },
  "ghd-situp": { areas: ["back"], replacement: "hollow-hold", reason: "Retire l'hyperextension lombaire." },
  "devils-press": { areas: ["shoulder", "back"], replacement: "assault-bike", reason: "Retire l'overhead et la charge lombaire du mouvement complexe." },
};

export type Substitution = { from: string; to: string; reason: string };

/** Nom lisible pour affichage ("Back Squat → Kettlebell Goblet Squat"). */
export function substitutionMessage(sub: Substitution): string {
  const fromName = getMovement(sub.from)?.name ?? sub.from;
  const toName = getMovement(sub.to)?.name ?? sub.to;
  return `${fromName} → ${toName}`;
}

function adaptExercises(
  exercises: Exercise[],
  activeAreas: InjuryArea[],
): { exercises: Exercise[]; substitutions: Substitution[] } {
  const substitutions: Substitution[] = [];
  const out = exercises.map((ex) => {
    const risk = MOVEMENT_RISK[ex.movementId];
    if (!risk || !risk.areas.some((a) => activeAreas.includes(a))) return ex;
    substitutions.push({ from: ex.movementId, to: risk.replacement, reason: risk.reason });
    return {
      ...ex,
      movementId: risk.replacement,
      notes: ex.notes ? `${ex.notes} · ${risk.reason}` : risk.reason,
    };
  });
  return { exercises: out, substitutions };
}

/** Remplace les mouvements à risque dans tous les blocs du jour. Aucun-op si activeAreas est vide. */
export function adaptDayForInjuries(
  day: Day,
  activeAreas: InjuryArea[],
): { day: Day; substitutions: Substitution[] } {
  if (activeAreas.length === 0) return { day, substitutions: [] };

  const substitutions: Substitution[] = [];
  const blocks: Block[] = day.blocks.map((block) => {
    const result = adaptExercises(block.exercises, activeAreas);
    substitutions.push(...result.substitutions);
    return { ...block, exercises: result.exercises };
  });

  return { day: { ...day, blocks }, substitutions };
}

const LIGHT_FACTOR = 0.8; // cohérent avec la matrice d'état "Intensité 80%" (JAUNE).

/** Séance allégée : sets/reps/durées réduits d'~20% — la vraie variante B, pas juste un badge. */
export function reduceVolume(day: Day): Day {
  const blocks: Block[] = day.blocks.map((block) => {
    const exercises = block.exercises.map((ex) => {
      const next: Exercise = { ...ex };
      if (typeof ex.sets === "number") next.sets = Math.max(1, Math.round(ex.sets * LIGHT_FACTOR));
      if (typeof ex.reps === "number") next.reps = Math.max(1, Math.round(ex.reps * LIGHT_FACTOR));
      return next;
    });

    let duration = block.duration;
    const match = duration?.match(/^(\d+)min$/);
    if (match) duration = `${Math.max(5, Math.round(Number(match[1]) * LIGHT_FACTOR))}min`;

    return { ...block, exercises, duration };
  });

  return {
    ...day,
    blocks,
    estimatedMinutes: Math.max(10, Math.round(day.estimatedMinutes * LIGHT_FACTOR)),
  };
}
