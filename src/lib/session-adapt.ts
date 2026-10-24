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
import { makeT, type DictKey, type Translate } from "./i18n";
import type { Block, Day, Exercise } from "./programming";
import { VOLUME_BLOCK_APPROACH_SETS, VOLUME_BLOCK_DEFAULT_SETS, VOLUME_BLOCK_EXEC_SEC_PER_SET, VOLUME_BLOCK_STRUCTURE } from "./coach-params";

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

type RiskEntry = { areas: InjuryArea[]; replacement: string; reason: DictKey };

const MOVEMENT_RISK: Record<string, RiskEntry> = {
  "back-squat": { areas: ["knee", "back"], replacement: "kb-goblet-squat", reason: "dash.adapt.r1" },
  "front-squat": { areas: ["knee", "back"], replacement: "kb-goblet-squat", reason: "dash.adapt.r1" },
  "overhead-squat": { areas: ["shoulder", "knee", "back"], replacement: "kb-goblet-squat", reason: "dash.adapt.r2" },
  deadlift: { areas: ["back", "hamstring"], replacement: "kb-deadlift", reason: "dash.adapt.r3" },
  rdl: { areas: ["back", "hamstring"], replacement: "dead-bug", reason: "dash.adapt.r4" },
  "kb-swing-russian": { areas: ["back", "hamstring"], replacement: "pallof-press", reason: "dash.adapt.r5" },
  "kb-swing-american": { areas: ["back", "hamstring"], replacement: "pallof-press", reason: "dash.adapt.r5" },
  "strict-press": { areas: ["shoulder"], replacement: "db-floor-press", reason: "dash.adapt.r6" },
  "power-snatch": { areas: ["shoulder"], replacement: "kb-swing-russian", reason: "dash.adapt.r7" },
  "clean-and-jerk": { areas: ["shoulder"], replacement: "power-clean", reason: "dash.adapt.r8" },
  thruster: { areas: ["shoulder"], replacement: "front-squat", reason: "dash.adapt.r9" },
  hspu: { areas: ["shoulder"], replacement: "pike-pushup", reason: "dash.adapt.r10" },
  "handstand-walk": { areas: ["shoulder"], replacement: "bear-crawl", reason: "dash.adapt.r11" },
  "kipping-pullup": { areas: ["shoulder"], replacement: "ring-row", reason: "dash.adapt.r12" },
  "ring-dip": { areas: ["shoulder"], replacement: "box-dip", reason: "dash.adapt.r13" },
  "jump-squat": { areas: ["knee"], replacement: "air-squat", reason: "dash.adapt.r14" },
  "jumping-lunge": { areas: ["knee"], replacement: "walking-lunge", reason: "dash.adapt.r15" },
  "box-jump-over": { areas: ["knee"], replacement: "step-up", reason: "dash.adapt.r16" },
  "broad-jump": { areas: ["knee"], replacement: "row", reason: "dash.adapt.r17" },
  "burpee-broad-jump": { areas: ["knee"], replacement: "row", reason: "dash.adapt.r17" },
  "bar-facing-burpee": { areas: ["knee"], replacement: "row", reason: "dash.adapt.r17" },
  "bb-walking-lunge": { areas: ["knee"], replacement: "farmers-carry", reason: "dash.adapt.r18" },
  "db-bulgarian": { areas: ["knee"], replacement: "farmers-carry", reason: "dash.adapt.r18" },
  "db-box-step-up": { areas: ["knee"], replacement: "farmers-carry", reason: "dash.adapt.r18" },
  "ghd-situp": { areas: ["back"], replacement: "hollow-hold", reason: "dash.adapt.r19" },
  "devils-press": { areas: ["shoulder", "back"], replacement: "assault-bike", reason: "dash.adapt.r20" },
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
  t: Translate,
): { exercises: Exercise[]; substitutions: Substitution[] } {
  const substitutions: Substitution[] = [];
  const out = exercises.map((ex) => {
    const risk = MOVEMENT_RISK[ex.movementId];
    if (!risk || !risk.areas.some((a) => activeAreas.includes(a))) return ex;
    const reason = t(risk.reason);
    substitutions.push({ from: ex.movementId, to: risk.replacement, reason });
    return {
      ...ex,
      movementId: risk.replacement,
      notes: ex.notes ? `${ex.notes} · ${reason}` : reason,
    };
  });
  return { exercises: out, substitutions };
}

/** Remplace les mouvements à risque dans tous les blocs du jour. Aucun-op si activeAreas est vide. */
export function adaptDayForInjuries(
  day: Day,
  activeAreas: InjuryArea[],
  t: Translate = makeT("fr"),
): { day: Day; substitutions: Substitution[] } {
  if (activeAreas.length === 0) return { day, substitutions: [] };

  const substitutions: Substitution[] = [];
  const blocks: Block[] = day.blocks.map((block) => {
    const result = adaptExercises(block.exercises, activeAreas, t);
    substitutions.push(...result.substitutions);
    return { ...block, exercises: result.exercises };
  });

  return { day: { ...day, blocks }, substitutions };
}

const LIGHT_FACTOR = 0.8; // cohérent avec la matrice d'état "Intensité 80%" (JAUNE).

/**
 * Contrat Séance A / Séance B (doc H.7) :
 * - Séance A = `safeDay` (en appelant, cf. dashboard/page.tsx) — toujours la
 *   version RX/standard, jamais variable dans son format.
 * - Séance B = `reduceVolume(safeDay)` ci-dessous — toujours proposée à côté
 *   de A, jamais une 3e carte séparée pour la blessure.
 * - Les DEUX sources de blessure (profil chronique + check-in du jour) sont
 *   déjà combinées AVANT cet appel, via `detectInjuryAreas(blessuresDetail,
 *   douleurDetail)` puis `adaptDayForInjuries` — `safeDay` contient donc déjà
 *   les substitutions de mouvements à risque, que B hérite automatiquement.
 * - `reduceVolume` applique aujourd'hui le même facteur de volume (-20%) que
 *   blessure il y ait ou non : B n'est donc actuellement qu'un "Scaled
 *   standard" dans tous les cas, jamais une adaptation ciblée différente du
 *   Scaled générique en cas de blessure déclarée. Si ce comportement doit un
 *   jour distinguer "pas de blessure → Scaled standard" de "blessure →
 *   adaptation ciblée sur la blessure ET l'état du jour", c'est ici qu'il
 *   faudra brancher cette distinction (ex. un second paramètre `activeAreas`
 *   sur `reduceVolume`, ou un chemin dédié appelé par le même call-site).
 */

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

/**
 * Filet de sécurité pour la séance générée par Claude (moteur de génération
 * dynamique) : tout movementId halluciné (absent du vrai catalogue) est
 * remplacé par un mouvement de repli neutre — jamais laissé tel quel, jamais
 * affiché brut à l'utilisateur. `allowedIds` doit être l'ensemble complet des
 * ids réels de movements.ts (pas seulement les candidats proposés à Claude —
 * il peut légitimement en citer un hors de sa liste suggérée).
 */
const FALLBACK_MOVEMENT_ID = "air-squat";

/**
 * Filet de sécurité (doc H.13) : un bloc typé "wod"/"conditioning"/"endurance"
 * sans format de metcon (AMRAP/EMOM/ForTime/...) et dont TOUS les mouvements
 * portent des sets+reps numériques classiques est presque certainement un
 * bloc de musculation mal catégorisé par la génération — un vrai metcon a
 * toujours un format, lui. Recatégorisé en "accessory" pour que l'écran
 * séance affiche les champs kg/reps/RPE au lieu d'une simple case à cocher.
 */
export function reclassifyMisplacedStrengthBlocks(day: Day): Day {
  const blocks: Block[] = day.blocks.map((block) => {
    if (block.type !== "wod" && block.type !== "conditioning" && block.type !== "endurance") return block;
    if (block.format) return block;
    if (block.exercises.length === 0) return block;
    const looksLikeStrength = block.exercises.every(
      (ex) => typeof ex.sets === "number" && (typeof ex.reps === "number" || /^\d+(-\d+)?$/.test(String(ex.reps ?? ""))),
    );
    if (!looksLikeStrength) return block;
    return { ...block, type: "accessory" as const };
  });
  return { ...day, blocks };
}

export function validateGeneratedDay(day: Day, allowedIds: ReadonlySet<string>, t: Translate = makeT("fr")): Day {
  const blocks: Block[] = day.blocks.map((block) => ({
    ...block,
    exercises: block.exercises.map((ex): Exercise => {
      if (allowedIds.has(ex.movementId)) return ex;
      const reason = t("dash.adapt.unknown", { id: ex.movementId });
      return {
        ...ex,
        movementId: FALLBACK_MOVEMENT_ID,
        notes: ex.notes ? `${ex.notes} · ${reason}` : reason,
      };
    }),
  }));
  return { ...day, blocks };
}

// ---------------------------------------------------------------------------
// Volume Block Hypertrophie (partie 4, missions 8 et 10)
// ---------------------------------------------------------------------------

const REST_SEC = (rest: string | undefined, fallback: number): number => {
  if (!rest) return fallback;
  const min = rest.match(/(\d+)\s*min/i);
  if (min) return Number(min[1]) * 60;
  const sec = rest.match(/(\d+)/);
  return sec ? Number(sec[1]) : fallback;
};

/** Durée d'un bloc de musculation : séries × (exécution + repos), sans repos après la toute dernière série. */
export function estimateStrengthBlockMinutes(block: Block): number {
  let sec = 0;
  const superset = block.format === "Superset" || block.format === "Circuit";
  if (superset && block.exercises.length > 1) {
    const sets = Math.max(...block.exercises.map((e) => e.sets ?? VOLUME_BLOCK_DEFAULT_SETS));
    const rest = Math.max(...block.exercises.map((e) => REST_SEC(e.rest, 60)));
    sec = sets * (block.exercises.length * VOLUME_BLOCK_EXEC_SEC_PER_SET + rest) - rest;
  } else {
    for (const e of block.exercises) {
      const sets = e.sets ?? VOLUME_BLOCK_DEFAULT_SETS;
      sec += sets * (VOLUME_BLOCK_EXEC_SEC_PER_SET + REST_SEC(e.rest, 90)) - REST_SEC(e.rest, 90);
    }
  }
  if (block.type === "strength") sec += VOLUME_BLOCK_APPROACH_SETS * (VOLUME_BLOCK_EXEC_SEC_PER_SET + 60);
  return Math.max(5, Math.round(sec / 60 / 5) * 5);
}

const INTERNAL_NOTE = /format\s*nft[^.;]*[.;]?|volumeBlockFocus[^.;]*[.;]?|not for time[^.;]*[.;]?/gi;

/**
 * Impose la structure musculation aux blocs 2, 3 et 4 : « Strength » (1 à 2 mouvements), « Accessoire 1 »
 * et « Accessoire 2 » (2 à 4). Le type vient du programme, pas du squelette commun (où le bloc 3 est un
 * metcon et le bloc 4 un finisher). Chaque mouvement reçoit des séries × reps et un repos ; la durée du bloc
 * est calculée, plus fixée à une plage.
 */
export function normalizeVolumeBlockDay(day: Day): Day {
  const warm = day.blocks.findIndex((b) => b.type === "warmup");
  const cool = day.blocks.length - 1 - [...day.blocks].reverse().findIndex((b) => b.type === "cooldown");
  const middle = day.blocks.filter((_, i) => i !== warm && !(day.blocks[i].type === "cooldown" && i === cool));
  if (middle.length === 0) return day;

  const shaped: Block[] = VOLUME_BLOCK_STRUCTURE.map((spec, i): Block | null => {
    const src = middle[i];
    if (!src) return null;
    let exercises = src.exercises.slice(0, spec.movements[1]).map((e): Exercise => {
      const reps = typeof e.reps === "number" ? e.reps : /^\d+(-\d+)?$/.test(String(e.reps ?? "")) ? e.reps : spec.defaultReps;
      const { time, distance, ...rest } = e;
      void time;
      void distance;
      return { ...rest, sets: e.sets ?? VOLUME_BLOCK_DEFAULT_SETS, reps, rest: e.rest ?? spec.defaultRest };
    });
    if (exercises.length === 0) exercises = [];
    const block: Block = {
      name: spec.name,
      type: spec.type,
      // Superset (2 mouvements) ou Circuit (3 et plus) : un seul repos à la fin de chaque tour.
      format: src.format === "Superset" || src.format === "Circuit" ? (exercises.length >= 3 ? "Circuit" : "Superset") : "StraightSets",
      exercises,
      notes: src.notes?.replace(INTERNAL_NOTE, "").trim() || undefined,
    };
    const minutes = estimateStrengthBlockMinutes(block);
    return { ...block, duration: `${Math.min(spec.minutes[1], Math.max(spec.minutes[0], minutes))}min` };
  }).filter((b): b is Block => b !== null);

  const blocks = [...(warm >= 0 ? [day.blocks[warm]] : []), ...shaped, ...(cool >= 0 && day.blocks[cool]?.type === "cooldown" ? [day.blocks[cool]] : [])];
  return { ...day, blocks, notes: day.notes?.replace(INTERNAL_NOTE, "").trim() || undefined };
}

const ISOMETRIC = /plank|hold|hollow|l-sit|wall-sit|dead-hang|side-plank|superman|deep-squat-hold/i;

/** Un mouvement isométrique prescrit avec des répétitions devient un temps tenu (mission 8, gainage). */
export function fixIsometricPrescriptions(day: Day): Day {
  const blocks = day.blocks.map((b) => {
    if (b.type !== "strength" && b.type !== "accessory" && b.type !== "skill") return b;
    return {
      ...b,
      exercises: b.exercises.map((e) => {
        if (!ISOMETRIC.test(e.movementId) || e.reps === undefined || e.time) return e;
        const { reps, ...rest } = e;
        void reps;
        return { ...rest, time: "30s" };
      }),
    };
  });
  return { ...day, blocks };
}
